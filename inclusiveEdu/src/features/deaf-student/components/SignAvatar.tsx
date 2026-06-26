import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { getAnimationForGloss } from "@/features/deaf-student/data/glossAnimationMap";

type SignAvatarProps = {
  currentGloss: string | null;
};

export function SignAvatar({ currentGloss }: SignAvatarProps) {
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const leftHandRef = useRef<Group>(null);
  const rightHandRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const animation = currentGloss ? getAnimationForGloss(currentGloss) : "idle";
    const pulse = Math.sin(t * 5);
    const slow = Math.sin(t * 2.4);

    const leftArm = leftArmRef.current;
    const rightArm = rightArmRef.current;
    const leftHand = leftHandRef.current;
    const rightHand = rightHandRef.current;
    const head = headRef.current;
    if (!leftArm || !rightArm || !leftHand || !rightHand || !head) return;

    leftArm.rotation.set(0.15, 0, 0.65);
    rightArm.rotation.set(0.15, 0, -0.65);
    leftHand.position.set(-0.95, 0.35, 0.05);
    rightHand.position.set(0.95, 0.35, 0.05);
    head.rotation.y = slow * 0.08;

    if (animation === "wave") {
      rightArm.rotation.set(-1.2 + pulse * 0.18, 0, -0.25);
      rightHand.position.set(1.1, 1.15 + pulse * 0.16, 0.05);
    }
    if (animation === "point") {
      rightArm.rotation.set(0, -0.9, -1.25);
      rightHand.position.set(1.35, 0.55, -0.55);
    }
    if (animation === "chest") {
      leftArm.rotation.set(-0.6, 0, 0.25);
      rightArm.rotation.set(-0.6, 0, -0.25);
      leftHand.position.set(-0.28, 0.42 + pulse * 0.04, 0.28);
      rightHand.position.set(0.28, 0.42 - pulse * 0.04, 0.28);
    }
    if (animation === "hands") {
      leftArm.rotation.set(-0.85, 0, 0.2 + pulse * 0.08);
      rightArm.rotation.set(-0.85, 0, -0.2 - pulse * 0.08);
      leftHand.position.set(-0.35 + pulse * 0.08, 0.35, 0.35);
      rightHand.position.set(0.35 - pulse * 0.08, 0.35, 0.35);
    }
    if (animation === "explain") {
      leftArm.rotation.set(-0.25, 0.2, 0.95);
      rightArm.rotation.set(-0.25, -0.2, -0.95);
      leftHand.position.set(-1.1, 0.42 + slow * 0.06, 0.28);
      rightHand.position.set(1.1, 0.42 - slow * 0.06, 0.28);
    }
    if (animation === "write") {
      rightArm.rotation.set(-0.7, -0.4, -0.55);
      rightHand.position.set(0.52 + pulse * 0.12, 0.16 + Math.abs(pulse) * 0.08, 0.45);
    }
    if (animation === "draw") {
      rightArm.rotation.set(-0.45, -0.7, -0.75);
      rightHand.position.set(0.6 + pulse * 0.34, 0.34, 0.35);
    }
    if (animation === "question") {
      leftArm.rotation.set(-0.8, 0, 0.7);
      rightArm.rotation.set(-0.8, 0, -0.7);
      leftHand.position.set(-0.75, 0.8 + slow * 0.08, 0.2);
      rightHand.position.set(0.75, 0.8 - slow * 0.08, 0.2);
      head.rotation.z = slow * 0.08;
    }
    if (animation === "emphasis") {
      leftArm.rotation.set(-0.7, 0.1, 0.45);
      rightArm.rotation.set(-0.7, -0.1, -0.45);
      leftHand.position.set(-0.45, 0.48, 0.55 + Math.abs(pulse) * 0.16);
      rightHand.position.set(0.45, 0.48, 0.55 + Math.abs(pulse) * 0.16);
    }
    if (animation === "show") {
      leftArm.rotation.set(-0.1, 0.35, 1.15);
      rightArm.rotation.set(-0.1, -0.35, -1.15);
      leftHand.position.set(-1.22, 0.58, 0.18);
      rightHand.position.set(1.22, 0.58, 0.18);
    }
  });

  return (
    <group position={[0, -0.7, 0]}>
      <group ref={headRef} position={[0, 1.85, 0]}>
        <mesh>
          <sphereGeometry args={[0.36, 32, 32]} />
          <meshStandardMaterial color="#f1c6a8" roughness={0.55} />
        </mesh>
        <mesh position={[-0.12, 0.05, 0.31]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
        <mesh position={[0.12, 0.05, 0.31]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
      </group>

      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[0.82, 1.12, 0.38]} />
        <meshStandardMaterial color="#2563eb" roughness={0.7} />
      </mesh>

      <group ref={leftArmRef} position={[-0.55, 1.28, 0]}>
        <mesh position={[-0.25, -0.32, 0]} rotation={[0, 0, 0.25]}>
          <cylinderGeometry args={[0.08, 0.09, 0.72, 18]} />
          <meshStandardMaterial color="#2563eb" />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.55, 1.28, 0]}>
        <mesh position={[0.25, -0.32, 0]} rotation={[0, 0, -0.25]}>
          <cylinderGeometry args={[0.08, 0.09, 0.72, 18]} />
          <meshStandardMaterial color="#2563eb" />
        </mesh>
      </group>

      <group ref={leftHandRef}>
        <mesh>
          <sphereGeometry args={[0.12, 18, 18]} />
          <meshStandardMaterial color="#f1c6a8" />
        </mesh>
      </group>
      <group ref={rightHandRef}>
        <mesh>
          <sphereGeometry args={[0.12, 18, 18]} />
          <meshStandardMaterial color="#f1c6a8" />
        </mesh>
      </group>
    </group>
  );
}
