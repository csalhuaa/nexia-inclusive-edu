import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { CartoonSignAvatar } from "@/features/deaf-student/components/CartoonSignAvatar";

type SignAvatarCanvasProps = {
  currentGloss: string | null;
};

export function SignAvatarCanvas({ currentGloss }: SignAvatarCanvasProps) {
  return (
    <Canvas camera={{ position: [0, 0.85, 4.2], fov: 36 }} className="h-full w-full">
      <color attach="background" args={["#0f172a"]} />
      <ambientLight intensity={1.05} />
      <directionalLight position={[2.4, 4.4, 3.2]} intensity={1.45} />
      <directionalLight position={[-2.8, 2.2, 2.6]} intensity={0.55} color="#bae6fd" />
      <spotLight position={[0, 3.4, 3.2]} angle={0.42} penumbra={0.75} intensity={0.65} />
      <CartoonSignAvatar currentGloss={currentGloss} />
      <Environment preset="city" />
      <OrbitControls
        target={[0, 0.55, 0]}
        enablePan={false}
        enableZoom={false}
        enableRotate={false}
        minPolarAngle={1.05}
        maxPolarAngle={1.75}
      />
    </Canvas>
  );
}
