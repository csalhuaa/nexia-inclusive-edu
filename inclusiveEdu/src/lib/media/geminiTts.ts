import { GoogleGenAI } from "@google/genai";
import { env } from "@/config/env";

let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

// Caché de los últimos audios generados (soporta hasta 10 para evitar fugas de memoria).
// Así permitimos que el resumen y el texto completo convivan en memoria al mismo tiempo.
const audioCache = new Map<string, AudioBuffer>();
const MAX_CACHE_SIZE = 10;

export async function playGeminiTts(text: string): Promise<void> {
  if (!env.geminiApiKey) {
    throw new Error("La API Key de Gemini no está configurada.");
  }

  // Inicializar contexto de audio si no existe (se hace primero por si tiramos de caché)
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  // Detener cualquier audio reproduciéndose
  stopGeminiTts();

  // Si el texto solicitado ya está en caché, lo usamos directamente
  if (audioCache.has(text)) {
    const cachedBuffer = audioCache.get(text)!;
    currentSource = audioContext.createBufferSource();
    currentSource.buffer = cachedBuffer;
    currentSource.connect(audioContext.destination);
    currentSource.start(0);
    return;
  }

  const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });

  // Agregamos instrucciones para mejorar la prosodia y forzar el idioma
  const prompt = `[cheerful, in Spanish] Lee el siguiente texto de forma clara, natural y con buen ritmo:\n\n${text}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: prompt,
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: "Aoede", // Aoede tiene un tono muy claro
          },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("La API de Gemini no devolvió audio.");
  }

  // Convertir Base64 a ArrayBuffer
  const binaryString = window.atob(base64Audio);
  const len = binaryString.length;
  const pcmBytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    pcmBytes[i] = binaryString.charCodeAt(i);
  }

  const wavBuffer = createWavHeader(pcmBytes, 24000);
  const audioBuffer = await audioContext.decodeAudioData(wavBuffer);
  
  // Guardamos en caché y evitamos sobrepasar el límite
  if (audioCache.size >= MAX_CACHE_SIZE) {
    const firstKey = audioCache.keys().next().value;
    if (firstKey) audioCache.delete(firstKey);
  }
  audioCache.set(text, audioBuffer);

  currentSource = audioContext.createBufferSource();
  currentSource.buffer = audioBuffer;
  currentSource.connect(audioContext.destination);
  currentSource.start(0);
}

function createWavHeader(pcmData: Uint8Array, sampleRate: number): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  
  writeString(36, "data");
  view.setUint32(40, dataSize, true);
  
  new Uint8Array(buffer, 44).set(pcmData);
  
  return buffer;
}

export function stopGeminiTts() {
  if (currentSource) {
    try {
      currentSource.stop();
    } catch (e) {
      // Ignorar
    }
    currentSource = null;
  }
}
