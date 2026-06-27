import { getGestureForGloss, type AvatarGesture } from "@/features/deaf/data/gestureMap";

type Avatar2DProps = {
  currentGloss: string | null;
  isSpeaking?: boolean;
};

type LimbPose = {
  leftUpper: string;
  leftFore: string;
  leftHand: string;
  rightUpper: string;
  rightFore: string;
  rightHand: string;
  head: string;
  eyebrow: string;
  mouthClass: string;
};

const idlePose: LimbPose = {
  leftUpper: "rotate(12 190 184)",
  leftFore: "rotate(8 160 240)",
  leftHand: "translate(0 0)",
  rightUpper: "rotate(-12 290 184)",
  rightFore: "rotate(-8 320 240)",
  rightHand: "translate(0 0)",
  head: "translate(0 0) rotate(0 240 108)",
  eyebrow: "translate(0 0)",
  mouthClass: "avatar2d-mouth-idle",
};

function getPose(gesture: AvatarGesture): LimbPose {
  if (gesture === "speaking") {
    return {
      ...idlePose,
      leftUpper: "rotate(4 190 184)",
      leftFore: "rotate(-18 160 240)",
      rightUpper: "rotate(-4 290 184)",
      rightFore: "rotate(18 320 240)",
      head: "translate(0 -2) rotate(1.5 240 108)",
      mouthClass: "avatar2d-mouth-speaking",
    };
  }

  if (gesture === "wave") {
    return {
      ...idlePose,
      rightUpper: "rotate(-108 290 184)",
      rightFore: "rotate(-22 320 240)",
      rightHand: "translate(0 -8)",
      head: "translate(0 -1) rotate(-4 240 108)",
      mouthClass: "avatar2d-mouth-smile",
    };
  }

  if (gesture === "point") {
    return {
      ...idlePose,
      rightUpper: "rotate(-72 290 184)",
      rightFore: "rotate(-52 320 240)",
      rightHand: "translate(18 -12)",
      head: "rotate(-5 240 108)",
      mouthClass: "avatar2d-mouth-small",
    };
  }

  if (gesture === "hands") {
    return {
      ...idlePose,
      leftUpper: "rotate(-38 190 184)",
      leftFore: "rotate(-44 160 240)",
      leftHand: "translate(46 -44)",
      rightUpper: "rotate(38 290 184)",
      rightFore: "rotate(44 320 240)",
      rightHand: "translate(-46 -44)",
      head: "translate(0 -1)",
      mouthClass: "avatar2d-mouth-speaking",
    };
  }

  if (gesture === "explain") {
    return {
      ...idlePose,
      leftUpper: "rotate(42 190 184)",
      leftFore: "rotate(18 160 240)",
      leftHand: "translate(-20 -14)",
      rightUpper: "rotate(-42 290 184)",
      rightFore: "rotate(-18 320 240)",
      rightHand: "translate(20 -14)",
      mouthClass: "avatar2d-mouth-speaking",
    };
  }

  if (gesture === "write") {
    return {
      ...idlePose,
      leftUpper: "rotate(20 190 184)",
      leftFore: "rotate(10 160 240)",
      rightUpper: "rotate(-48 290 184)",
      rightFore: "rotate(36 320 240)",
      rightHand: "translate(-36 -18)",
      head: "translate(0 2) rotate(-3 240 108)",
      mouthClass: "avatar2d-mouth-small",
    };
  }

  if (gesture === "show") {
    return {
      ...idlePose,
      leftUpper: "rotate(58 190 184)",
      leftFore: "rotate(-4 160 240)",
      leftHand: "translate(-28 -24)",
      rightUpper: "rotate(-58 290 184)",
      rightFore: "rotate(4 320 240)",
      rightHand: "translate(28 -24)",
      head: "translate(0 -1)",
      mouthClass: "avatar2d-mouth-smile",
    };
  }

  if (gesture === "question") {
    return {
      ...idlePose,
      leftUpper: "rotate(-72 190 184)",
      leftFore: "rotate(-16 160 240)",
      leftHand: "translate(18 -66)",
      rightUpper: "rotate(72 290 184)",
      rightFore: "rotate(16 320 240)",
      rightHand: "translate(-18 -66)",
      head: "rotate(4 240 108)",
      eyebrow: "translate(0 -8)",
      mouthClass: "avatar2d-mouth-question",
    };
  }

  if (gesture === "emphasis") {
    return {
      ...idlePose,
      leftUpper: "rotate(-26 190 184)",
      leftFore: "rotate(-54 160 240)",
      leftHand: "translate(38 -16)",
      rightUpper: "rotate(26 290 184)",
      rightFore: "rotate(54 320 240)",
      rightHand: "translate(-38 -16)",
      head: "translate(0 -3)",
      eyebrow: "translate(0 -4)",
      mouthClass: "avatar2d-mouth-small",
    };
  }

  if (gesture === "chest") {
    return {
      ...idlePose,
      leftUpper: "rotate(8 190 184)",
      leftFore: "rotate(-12 160 240)",
      rightUpper: "rotate(42 290 184)",
      rightFore: "rotate(62 320 240)",
      rightHand: "translate(-72 -48)",
      head: "translate(0 -1)",
      mouthClass: "avatar2d-mouth-smile",
    };
  }

  return idlePose;
}

export function Avatar2D({ currentGloss, isSpeaking = false }: Avatar2DProps) {
  const gesture = getGestureForGloss(currentGloss, isSpeaking);
  const pose = getPose(gesture);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#312E81] shadow-2xl">
      <div className="absolute inset-x-8 bottom-4 h-24 rounded-[999px] bg-cyan-300/10 blur-2xl" />
      <svg
        className={`avatar2d-svg avatar2d-${gesture}`}
        role="img"
        aria-label={`Avatar 2D interpretando ${currentGloss ?? "en espera"}`}
        viewBox="0 0 480 360"
      >
        <defs>
          <filter id="avatar2dShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="16" stdDeviation="12" floodColor="#020617" floodOpacity="0.28" />
          </filter>
        </defs>

        <g filter="url(#avatar2dShadow)">
          <g className="avatar2d-limb" transform={pose.leftUpper}>
            <line x1="190" y1="184" x2="162" y2="238" stroke="#2563EB" strokeWidth="30" strokeLinecap="round" />
            <g className="avatar2d-limb" transform={pose.leftFore}>
              <line x1="162" y1="238" x2="142" y2="292" stroke="#F2C6A0" strokeWidth="24" strokeLinecap="round" />
              <g className="avatar2d-hand" transform={pose.leftHand}>
                <ellipse cx="139" cy="298" rx="19" ry="16" fill="#F2C6A0" />
                <circle cx="126" cy="292" r="5" fill="#F2C6A0" />
              </g>
            </g>
          </g>

          <g className="avatar2d-limb" transform={pose.rightUpper}>
            <line x1="290" y1="184" x2="318" y2="238" stroke="#2563EB" strokeWidth="30" strokeLinecap="round" />
            <g className="avatar2d-limb avatar2d-write-hand" transform={pose.rightFore}>
              <line x1="318" y1="238" x2="338" y2="292" stroke="#F2C6A0" strokeWidth="24" strokeLinecap="round" />
              <g className="avatar2d-hand avatar2d-wave-hand" transform={pose.rightHand}>
                <ellipse cx="341" cy="298" rx="19" ry="16" fill="#F2C6A0" />
                <circle cx="354" cy="292" r="5" fill="#F2C6A0" />
              </g>
            </g>
          </g>

          <g>
            <rect x="178" y="174" width="124" height="126" rx="42" fill="#2563EB" />
            <path d="M196 180 C214 208 266 208 284 180 L296 198 C276 232 204 232 184 198 Z" fill="#1D4ED8" />
            <rect x="224" y="146" width="32" height="38" rx="14" fill="#F2C6A0" />
            <path d="M211 226 C230 238 250 238 269 226" fill="none" stroke="#DBEAFE" strokeWidth="5" strokeLinecap="round" />
          </g>

          <g className="avatar2d-head" transform={pose.head}>
            <ellipse cx="240" cy="108" rx="55" ry="61" fill="#F2C6A0" />
            <path d="M187 101 C190 52 222 35 258 42 C290 48 304 72 295 111 C274 95 238 91 207 109 Z" fill="#1E293B" />
            <path d="M205 96 C213 62 247 51 288 71 C267 43 212 42 193 83 Z" fill="#334155" opacity="0.45" />
            <g className="avatar2d-eyebrows" transform={pose.eyebrow}>
              <path d="M211 103 L231 99" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
              <path d="M249 99 L269 103" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
            </g>
            <circle cx="222" cy="119" r="8" fill="#0F172A" />
            <circle cx="258" cy="119" r="8" fill="#0F172A" />
            <circle cx="225" cy="116" r="2.5" fill="#FFFFFF" />
            <circle cx="261" cy="116" r="2.5" fill="#FFFFFF" />
            <ellipse cx="240" cy="133" rx="7" ry="5" fill="#D89A78" />
            <path className={pose.mouthClass} d="M226 147 Q240 158 254 147" fill="none" stroke="#7F1D1D" strokeWidth="6" strokeLinecap="round" />
          </g>
        </g>
      </svg>

      <style>{`
        .avatar2d-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .avatar2d-limb,
        .avatar2d-hand,
        .avatar2d-head,
        .avatar2d-eyebrows {
          transition: transform 420ms cubic-bezier(.2,.9,.2,1);
        }

        .avatar2d-speaking .avatar2d-head {
          animation: avatar2d-head-talk 1.15s ease-in-out infinite;
        }

        .avatar2d-wave .avatar2d-wave-hand {
          animation: avatar2d-wave 620ms ease-in-out infinite alternate;
        }

        .avatar2d-write .avatar2d-write-hand {
          animation: avatar2d-write 680ms ease-in-out infinite alternate;
        }

        .avatar2d-emphasis .avatar2d-hand {
          animation: avatar2d-emphasis 520ms ease-in-out infinite alternate;
        }

        .avatar2d-mouth-speaking {
          animation: avatar2d-mouth 520ms ease-in-out infinite alternate;
        }

        .avatar2d-mouth-smile {
          stroke-width: 6;
        }

        .avatar2d-mouth-small {
          transform: scaleY(.65);
          transform-origin: 240px 150px;
        }

        .avatar2d-mouth-question {
          d: path("M233 149 Q240 145 247 149");
        }

        @keyframes avatar2d-mouth {
          from { d: path("M226 147 Q240 158 254 147"); }
          to { d: path("M226 148 Q240 168 254 148"); }
        }

        @keyframes avatar2d-head-talk {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        @keyframes avatar2d-wave {
          from { transform: translateY(-8px) rotate(-8deg); }
          to { transform: translateY(-12px) rotate(11deg); }
        }

        @keyframes avatar2d-write {
          from { transform: translate(0, 0); }
          to { transform: translate(-10px, 6px); }
        }

        @keyframes avatar2d-emphasis {
          from { transform: translateY(0); }
          to { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
