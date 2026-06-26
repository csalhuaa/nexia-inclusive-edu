import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { SignAvatar } from "@/features/deaf-student/components/SignAvatar";

type SignAvatarCanvasProps = {
  currentGloss: string | null;
};

export function SignAvatarCanvas({ currentGloss }: SignAvatarCanvasProps) {
  return (
    <Canvas camera={{ position: [0, 1.2, 4.2], fov: 42 }} className="h-full w-full">
      <color attach="background" args={["#0f172a"]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[2.5, 4, 3]} intensity={1.6} />
      <pointLight position={[-2, 2, 2]} intensity={0.7} color="#67e8f9" />
      <SignAvatar currentGloss={currentGloss} />
      <Environment preset="city" />
      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={1.15} maxPolarAngle={1.8} />
    </Canvas>
  );
}
