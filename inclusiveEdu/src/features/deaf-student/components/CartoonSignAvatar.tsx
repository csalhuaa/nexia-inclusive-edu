import { useRef } from "react";
import type { RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { MathUtils } from "three";
import { getAnimationForGloss } from "@/features/deaf-student/data/glossAnimationMap";

type CartoonSignAvatarProps = {
  currentGloss: string | null;
  isSpeaking?: boolean;
};

type Pose = {
  leftUpper: [number, number, number];
  leftFore: [number, number, number];
  rightUpper: [number, number, number];
  rightFore: [number, number, number];
  head: [number, number, number];
  torso: [number, number, number];
};

const idlePose: Pose = {
  leftUpper: [0.1, 0, 0.55],
  leftFore: [-0.35, 0, 0.1],
  rightUpper: [0.1, 0, -0.55],
  rightFore: [-0.35, 0, -0.1],
  head: [0, 0, 0],
  torso: [0, 0, 0],
};

function lerpGroup(group: Group | null, rotation: [number, number, number], speed = 0.16) {
  if (!group) return;
  group.rotation.x = MathUtils.lerp(group.rotation.x, rotation[0], speed);
  group.rotation.y = MathUtils.lerp(group.rotation.y, rotation[1], speed);
  group.rotation.z = MathUtils.lerp(group.rotation.z, rotation[2], speed);
}

function poseFor(animation: string, pulse: number, slow: number, isSpeaking: boolean): Pose {
  const speakingLift = isSpeaking ? Math.sin(pulse * 0.7) * 0.08 : 0;

  if (animation === "wave") {
    return {
      ...idlePose,
      rightUpper: [-1.05 + Math.sin(pulse) * 0.12, -0.12, -0.2],
      rightFore: [-0.78, 0.18, 0.18 + Math.sin(pulse * 1.6) * 0.35],
      head: [0.02, -0.12, 0.02],
    };
  }

  if (animation === "point") {
    return {
      ...idlePose,
      rightUpper: [-0.38, -0.85, -1.0],
      rightFore: [-0.2, -0.35, -0.1],
      head: [0.02, -0.18, 0],
      torso: [0, -0.08, 0],
    };
  }

  if (animation === "hands") {
    return {
      ...idlePose,
      leftUpper: [-0.72, 0.12, 0.28 + Math.sin(pulse) * 0.05],
      leftFore: [-1.02, 0, -0.24],
      rightUpper: [-0.72, -0.12, -0.28 - Math.sin(pulse) * 0.05],
      rightFore: [-1.02, 0, 0.24],
      head: [0.03, Math.sin(slow) * 0.03, 0],
    };
  }

  if (animation === "explain") {
    return {
      ...idlePose,
      leftUpper: [-0.18, 0.38, 1.08],
      leftFore: [-0.35 + Math.sin(slow) * 0.08, 0.08, 0.28],
      rightUpper: [-0.18, -0.38, -1.08],
      rightFore: [-0.35 - Math.sin(slow) * 0.08, -0.08, -0.28],
      head: [0.01, Math.sin(slow) * 0.08, 0],
    };
  }

  if (animation === "write" || animation === "draw") {
    return {
      ...idlePose,
      leftUpper: [0.02, 0, 0.62],
      leftFore: [-0.4, 0, 0.18],
      rightUpper: [-0.72, -0.48 + Math.sin(pulse) * 0.08, -0.5],
      rightFore: [-0.62 + Math.sin(pulse * 1.8) * 0.16, -0.18, 0.08],
      head: [0.08, -0.1, 0],
    };
  }

  if (animation === "show") {
    return {
      ...idlePose,
      leftUpper: [-0.1, 0.45, 1.22],
      leftFore: [-0.25, 0.08, 0.22],
      rightUpper: [-0.1, -0.45, -1.22],
      rightFore: [-0.25, -0.08, -0.22],
      head: [0.01, Math.sin(slow) * 0.05, 0],
    };
  }

  if (animation === "question") {
    return {
      ...idlePose,
      leftUpper: [-0.7, 0.08, 0.72],
      leftFore: [-0.58 + Math.sin(slow) * 0.08, 0, -0.05],
      rightUpper: [-0.7, -0.08, -0.72],
      rightFore: [-0.58 - Math.sin(slow) * 0.08, 0, 0.05],
      head: [0.02, 0, Math.sin(slow) * 0.08],
    };
  }

  if (animation === "emphasis") {
    const hit = Math.abs(Math.sin(pulse));
    return {
      ...idlePose,
      leftUpper: [-0.76 - hit * 0.08, 0.08, 0.42],
      leftFore: [-0.7 - hit * 0.18, 0, -0.22],
      rightUpper: [-0.76 - hit * 0.08, -0.08, -0.42],
      rightFore: [-0.7 - hit * 0.18, 0, 0.22],
      head: [-0.03, 0, 0],
      torso: [0.03, 0, 0],
    };
  }

  if (animation === "chest") {
    return {
      ...idlePose,
      leftUpper: [-0.48, 0.08, 0.22],
      leftFore: [-0.88, 0.02, -0.24],
      rightUpper: [-0.48, -0.08, -0.22],
      rightFore: [-0.88, -0.02, 0.24],
      head: [0.04, 0, 0],
    };
  }

  return {
    ...idlePose,
    leftUpper: [idlePose.leftUpper[0] - speakingLift, 0, idlePose.leftUpper[2]],
    rightUpper: [idlePose.rightUpper[0] - speakingLift, 0, idlePose.rightUpper[2]],
    head: [Math.sin(slow) * 0.025, Math.sin(slow * 0.7) * 0.05, 0],
  };
}

function Arm({
  side,
  sleeveColor,
  skinColor,
  upperRef,
  foreRef,
  handRef,
}: {
  side: "left" | "right";
  sleeveColor: string;
  skinColor: string;
  upperRef: RefObject<Group | null>;
  foreRef: RefObject<Group | null>;
  handRef: RefObject<Group | null>;
}) {
  const sign = side === "left" ? -1 : 1;

  return (
    <group ref={upperRef} position={[sign * 0.58, 0.95, 0.02]}>
      <mesh position={[sign * 0.14, -0.26, 0]} rotation={[0, 0, sign * 0.15]}>
        <capsuleGeometry args={[0.095, 0.42, 8, 18]} />
        <meshStandardMaterial color={sleeveColor} roughness={0.75} />
      </mesh>
      <group ref={foreRef} position={[sign * 0.26, -0.52, 0.02]}>
        <mesh position={[sign * 0.08, -0.24, 0.02]} rotation={[0, 0, sign * 0.1]}>
          <capsuleGeometry args={[0.078, 0.38, 8, 18]} />
          <meshStandardMaterial color={skinColor} roughness={0.58} />
        </mesh>
        <group ref={handRef} position={[sign * 0.13, -0.48, 0.04]}>
          <mesh scale={[1.05, 0.82, 0.72]}>
            <sphereGeometry args={[0.125, 24, 18]} />
            <meshStandardMaterial color={skinColor} roughness={0.55} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export function CartoonSignAvatar({ currentGloss, isSpeaking = false }: CartoonSignAvatarProps) {
  const avatarRef = useRef<Group>(null);
  const headGroup = useRef<Group>(null);
  const torsoGroup = useRef<Group>(null);
  const leftUpperArm = useRef<Group>(null);
  const leftForeArm = useRef<Group>(null);
  const leftHand = useRef<Group>(null);
  const rightUpperArm = useRef<Group>(null);
  const rightForeArm = useRef<Group>(null);
  const rightHand = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const animation = currentGloss ? getAnimationForGloss(currentGloss) : "idle";
    const pulse = t * 5.2;
    const slow = t * 2.1;
    const breath = Math.sin(slow) * 0.025;
    const pose = poseFor(animation, pulse, slow, isSpeaking);

    if (avatarRef.current) {
      avatarRef.current.position.y = -0.92 + breath;
      avatarRef.current.rotation.y = Math.sin(slow * 0.45) * 0.025;
    }

    lerpGroup(torsoGroup.current, pose.torso, 0.12);
    lerpGroup(headGroup.current, pose.head, 0.14);
    lerpGroup(leftUpperArm.current, pose.leftUpper, 0.18);
    lerpGroup(leftForeArm.current, pose.leftFore, 0.2);
    lerpGroup(rightUpperArm.current, pose.rightUpper, 0.18);
    lerpGroup(rightForeArm.current, pose.rightFore, 0.2);

    const handPulse = isSpeaking || animation !== "idle" ? Math.sin(pulse) * 0.08 : 0;
    lerpGroup(leftHand.current, [handPulse, 0, -handPulse * 0.8], 0.2);
    lerpGroup(rightHand.current, [-handPulse, 0, handPulse * 0.8], 0.2);
  });

  const skin = "#f2c6a7";
  const hair = "#1f2937";
  const hoodie = "#38bdf8";
  const hoodieDark = "#0f766e";
  const eye = "#111827";

  return (
    <group ref={avatarRef} position={[0, -0.92, 0]} scale={1.22}>
      <group ref={torsoGroup}>
        <mesh position={[0, 0.47, 0]} scale={[0.78, 0.92, 0.42]}>
          <capsuleGeometry args={[0.42, 0.72, 12, 28]} />
          <meshStandardMaterial color={hoodie} roughness={0.78} metalness={0.03} />
        </mesh>
        <mesh position={[0, 0.86, 0.04]} scale={[0.84, 0.23, 0.46]}>
          <capsuleGeometry args={[0.26, 0.34, 10, 22]} />
          <meshStandardMaterial color={hoodieDark} roughness={0.76} />
        </mesh>
        <mesh position={[0, 1.14, 0]}>
          <cylinderGeometry args={[0.15, 0.17, 0.24, 28]} />
          <meshStandardMaterial color={skin} roughness={0.58} />
        </mesh>
        <mesh position={[-0.15, 0.45, 0.39]} rotation={[0.16, 0, -0.08]}>
          <cylinderGeometry args={[0.014, 0.014, 0.42, 10]} />
          <meshStandardMaterial color="#e0f2fe" roughness={0.7} />
        </mesh>
        <mesh position={[0.15, 0.45, 0.39]} rotation={[0.16, 0, 0.08]}>
          <cylinderGeometry args={[0.014, 0.014, 0.42, 10]} />
          <meshStandardMaterial color="#e0f2fe" roughness={0.7} />
        </mesh>
      </group>

      <Arm
        side="left"
        sleeveColor={hoodie}
        skinColor={skin}
        upperRef={leftUpperArm}
        foreRef={leftForeArm}
        handRef={leftHand}
      />
      <Arm
        side="right"
        sleeveColor={hoodie}
        skinColor={skin}
        upperRef={rightUpperArm}
        foreRef={rightForeArm}
        handRef={rightHand}
      />

      <group ref={headGroup} position={[0, 1.5, 0.03]}>
        <mesh scale={[0.9, 1.02, 0.86]}>
          <sphereGeometry args={[0.36, 36, 28]} />
          <meshStandardMaterial color={skin} roughness={0.54} />
        </mesh>
        <mesh position={[0, 0.21, -0.02]} scale={[0.94, 0.46, 0.9]}>
          <sphereGeometry args={[0.36, 32, 18]} />
          <meshStandardMaterial color={hair} roughness={0.82} />
        </mesh>
        <mesh position={[-0.25, 0.06, 0.05]} rotation={[0, 0, 0.34]} scale={[0.2, 0.08, 0.12]}>
          <sphereGeometry args={[0.3, 16, 10]} />
          <meshStandardMaterial color={hair} roughness={0.86} />
        </mesh>
        <mesh position={[0.25, 0.06, 0.05]} rotation={[0, 0, -0.34]} scale={[0.2, 0.08, 0.12]}>
          <sphereGeometry args={[0.3, 16, 10]} />
          <meshStandardMaterial color={hair} roughness={0.86} />
        </mesh>

        <mesh position={[-0.13, 0.04, 0.31]}>
          <sphereGeometry args={[0.046, 18, 14]} />
          <meshStandardMaterial color={eye} roughness={0.35} />
        </mesh>
        <mesh position={[0.13, 0.04, 0.31]}>
          <sphereGeometry args={[0.046, 18, 14]} />
          <meshStandardMaterial color={eye} roughness={0.35} />
        </mesh>
        <mesh position={[-0.13, 0.055, 0.345]}>
          <sphereGeometry args={[0.014, 10, 8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        <mesh position={[0.13, 0.055, 0.345]}>
          <sphereGeometry args={[0.014, 10, 8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>

        <mesh position={[-0.13, 0.14, 0.32]} rotation={[0, 0, 0.15]} scale={[0.17, 0.018, 0.018]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={hair} roughness={0.8} />
        </mesh>
        <mesh position={[0.13, 0.14, 0.32]} rotation={[0, 0, -0.15]} scale={[0.17, 0.018, 0.018]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={hair} roughness={0.8} />
        </mesh>

        <mesh position={[0, -0.02, 0.35]} scale={[0.055, 0.04, 0.03]}>
          <sphereGeometry args={[0.6, 12, 8]} />
          <meshStandardMaterial color="#d99b82" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.17, 0.33]} scale={[0.15, 0.025, 0.02]}>
          <sphereGeometry args={[0.5, 18, 8]} />
          <meshStandardMaterial color="#7f1d1d" roughness={0.62} />
        </mesh>
      </group>
    </group>
  );
}
