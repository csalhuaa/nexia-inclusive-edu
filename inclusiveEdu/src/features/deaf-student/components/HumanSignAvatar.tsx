import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { Bone, Group, Object3D } from "three";
import { MathUtils } from "three";
import { getAnimationForGloss } from "@/features/deaf-student/data/glossAnimationMap";

const DEFAULT_AVATAR_URL = "/avatar/avatar.glb";
const BONE_NAMES = {
  leftArm: ["LeftArm", "mixamorigLeftArm"],
  rightArm: ["RightArm", "mixamorigRightArm"],
  leftForeArm: ["LeftForeArm", "mixamorigLeftForeArm"],
  rightForeArm: ["RightForeArm", "mixamorigRightForeArm"],
  leftHand: ["LeftHand", "mixamorigLeftHand"],
  rightHand: ["RightHand", "mixamorigRightHand"],
  head: ["Head", "mixamorigHead"],
  neck: ["Neck", "mixamorigNeck"],
  spine: ["Spine", "mixamorigSpine"],
};

type HumanSignAvatarProps = {
  currentGloss: string | null;
};

type RigBones = {
  leftArm?: Bone;
  rightArm?: Bone;
  leftForeArm?: Bone;
  rightForeArm?: Bone;
  leftHand?: Bone;
  rightHand?: Bone;
  head?: Bone;
  neck?: Bone;
  spine?: Bone;
};

function findBone(scene: Object3D, names: string[]) {
  let found: Bone | undefined;
  scene.traverse((object) => {
    if (found) return;
    if (names.includes(object.name) && "isBone" in object) {
      found = object as Bone;
    }
  });
  return found;
}

function lerpRotation(bone: Bone | undefined, x: number, y: number, z: number, speed = 0.18) {
  if (!bone) return;
  bone.rotation.x = MathUtils.lerp(bone.rotation.x, x, speed);
  bone.rotation.y = MathUtils.lerp(bone.rotation.y, y, speed);
  bone.rotation.z = MathUtils.lerp(bone.rotation.z, z, speed);
}

export function HumanSignAvatar({ currentGloss }: HumanSignAvatarProps) {
  const groupRef = useRef<Group>(null);
  const warnedNoRigRef = useRef(false);
  const loggedBonesRef = useRef(false);
  const gltf = useGLTF(DEFAULT_AVATAR_URL);

  const bones = useMemo<RigBones>(() => {
    const scene = gltf.scene;
    return {
      leftArm: findBone(scene, BONE_NAMES.leftArm),
      rightArm: findBone(scene, BONE_NAMES.rightArm),
      leftForeArm: findBone(scene, BONE_NAMES.leftForeArm),
      rightForeArm: findBone(scene, BONE_NAMES.rightForeArm),
      leftHand: findBone(scene, BONE_NAMES.leftHand),
      rightHand: findBone(scene, BONE_NAMES.rightHand),
      head: findBone(scene, BONE_NAMES.head),
      neck: findBone(scene, BONE_NAMES.neck),
      spine: findBone(scene, BONE_NAMES.spine),
    };
  }, [gltf.scene]);

  const hasRig = Boolean(
    bones.leftArm ||
      bones.rightArm ||
      bones.leftForeArm ||
      bones.rightForeArm ||
      bones.leftHand ||
      bones.rightHand,
  );

  useEffect(() => {
    if (!loggedBonesRef.current) {
      loggedBonesRef.current = true;
      const foundBones = Object.entries(bones)
        .filter(([, bone]) => Boolean(bone))
        .map(([label, bone]) => `${label}: ${bone?.name}`);

      console.info(
        "[InclusiveEDU][SignAvatar] GLB cargado desde /avatar/avatar.glb. Huesos detectados:",
        foundBones.length ? foundBones : "ninguno",
      );
    }

    if (!hasRig && !warnedNoRigRef.current) {
      warnedNoRigRef.current = true;
      console.warn(
        "[InclusiveEDU][SignAvatar] No se encontraron brazos/manos comunes en el GLB; se animará el modelo completo.",
      );
    }
  }, [bones, hasRig]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const animation = currentGloss ? getAnimationForGloss(currentGloss) : "idle";
    const pulse = Math.sin(t * 5);
    const slow = Math.sin(t * 2.2);

    if (groupRef.current) {
      groupRef.current.position.y = -1.25 + slow * 0.025;
      groupRef.current.rotation.y = slow * 0.035;
    }

    if (!hasRig) {
      if (groupRef.current) {
        groupRef.current.rotation.z = animation === "idle" ? slow * 0.015 : pulse * 0.035;
      }
      return;
    }

    lerpRotation(bones.leftArm, 0.25, 0.05, 0.65);
    lerpRotation(bones.rightArm, 0.25, -0.05, -0.65);
    lerpRotation(bones.leftForeArm, -0.25, 0, 0.15);
    lerpRotation(bones.rightForeArm, -0.25, 0, -0.15);
    lerpRotation(bones.leftHand, 0, 0, 0);
    lerpRotation(bones.rightHand, 0, 0, 0);
    lerpRotation(bones.head, slow * 0.025, slow * 0.035, 0, 0.08);
    lerpRotation(bones.neck, slow * 0.015, slow * 0.02, 0, 0.08);
    lerpRotation(bones.spine, 0, 0, slow * 0.015, 0.08);

    if (animation === "wave") {
      lerpRotation(bones.rightArm, -1.05 + pulse * 0.18, -0.15, -0.25);
      lerpRotation(bones.rightForeArm, -0.7 + pulse * 0.2, 0.2, 0.1);
      lerpRotation(bones.rightHand, 0.15, 0.1, pulse * 0.35);
    }
    if (animation === "point") {
      lerpRotation(bones.rightArm, -0.45, -0.95, -1.05);
      lerpRotation(bones.rightForeArm, -0.25, -0.45, -0.15);
    }
    if (animation === "chest") {
      lerpRotation(bones.leftArm, -0.45, 0.15, 0.25);
      lerpRotation(bones.rightArm, -0.45, -0.15, -0.25);
      lerpRotation(bones.leftForeArm, -0.95 + pulse * 0.05, 0.05, -0.25);
      lerpRotation(bones.rightForeArm, -0.95 - pulse * 0.05, -0.05, 0.25);
    }
    if (animation === "hands") {
      lerpRotation(bones.leftArm, -0.65, 0.2, 0.32 + pulse * 0.08);
      lerpRotation(bones.rightArm, -0.65, -0.2, -0.32 - pulse * 0.08);
      lerpRotation(bones.leftForeArm, -0.9, 0, -0.2);
      lerpRotation(bones.rightForeArm, -0.9, 0, 0.2);
    }
    if (animation === "explain") {
      lerpRotation(bones.leftArm, -0.2, 0.35, 1.05);
      lerpRotation(bones.rightArm, -0.2, -0.35, -1.05);
      lerpRotation(bones.leftForeArm, -0.35 + slow * 0.08, 0, 0.25);
      lerpRotation(bones.rightForeArm, -0.35 - slow * 0.08, 0, -0.25);
    }
    if (animation === "write") {
      lerpRotation(bones.rightArm, -0.75, -0.45, -0.48);
      lerpRotation(bones.rightForeArm, -0.55 + pulse * 0.18, -0.25, 0.08);
      lerpRotation(bones.rightHand, 0.1, 0.15, pulse * 0.18);
    }
    if (animation === "draw") {
      lerpRotation(bones.rightArm, -0.35, -0.75 + pulse * 0.18, -0.7);
      lerpRotation(bones.rightForeArm, -0.45, -0.15, 0.05);
    }
    if (animation === "question") {
      lerpRotation(bones.leftArm, -0.65, 0.1, 0.75);
      lerpRotation(bones.rightArm, -0.65, -0.1, -0.75);
      lerpRotation(bones.leftForeArm, -0.65 + slow * 0.08, 0, 0);
      lerpRotation(bones.rightForeArm, -0.65 - slow * 0.08, 0, 0);
    }
    if (animation === "emphasis") {
      lerpRotation(bones.leftArm, -0.75, 0.1, 0.45);
      lerpRotation(bones.rightArm, -0.75, -0.1, -0.45);
      lerpRotation(bones.leftForeArm, -0.65 - Math.abs(pulse) * 0.18, 0, -0.18);
      lerpRotation(bones.rightForeArm, -0.65 - Math.abs(pulse) * 0.18, 0, 0.18);
    }
    if (animation === "show") {
      lerpRotation(bones.leftArm, -0.08, 0.45, 1.2);
      lerpRotation(bones.rightArm, -0.08, -0.45, -1.2);
      lerpRotation(bones.leftForeArm, -0.25, 0, 0.2);
      lerpRotation(bones.rightForeArm, -0.25, 0, -0.2);
    }
  });

  return (
    <group ref={groupRef} position={[0, -1.2, 0]} scale={1.35}>
      <primitive object={gltf.scene} />
    </group>
  );
}

useGLTF.preload(DEFAULT_AVATAR_URL);
