import { useCallback, useEffect, useRef, useState } from "react";

const GLOSS_DURATION_MS = 1200;

export function useGlossPlayer(glosses: string[]) {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    setIsPlaying(false);
    setCurrentIndex(-1);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setCurrentIndex(glosses.length ? 0 : -1);
    setIsPlaying(Boolean(glosses.length));
  }, [clearTimer, glosses.length]);

  const play = useCallback(() => {
    if (!glosses.length) return;
    setCurrentIndex((prev) => (prev >= 0 && prev < glosses.length ? prev : 0));
    setIsPlaying(true);
  }, [glosses.length]);

  useEffect(() => {
    reset();
    return clearTimer;
  }, [clearTimer, glosses.join("|"), reset]);

  useEffect(() => {
    clearTimer();
    if (!isPlaying || currentIndex < 0) return;

    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= glosses.length) {
          setIsPlaying(false);
          return -1;
        }
        return next;
      });
    }, GLOSS_DURATION_MS);

    return clearTimer;
  }, [clearTimer, currentIndex, glosses.length, isPlaying]);

  return {
    currentGloss: currentIndex >= 0 ? glosses[currentIndex] : null,
    currentIndex,
    isPlaying,
    play,
    stop,
    reset,
  };
}
