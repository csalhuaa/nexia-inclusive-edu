import { useClassroom } from "@/hooks/useClassroom";
import { useToast } from "@/hooks/useToast";
import { ConnectionBadge } from "@/components/classroom/ConnectionBadge";
import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";

export function SessionBar() {
  const { session } = useClassroom();
  const { showToast } = useToast();

  if (!session) return null;

  const slide = session.slides[session.slideIndex];
  const connectedCount = Array.from(
    new Map(
      session.participants
        .filter((participant) => participant.isOnline)
        .map((participant) => [participant.id, participant]),
    ).values(),
  ).length;
  const copyCode = async () => {
    await navigator.clipboard.writeText(session.code);
    showToast(`Código ${session.code} copiado`, "success");
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/70 bg-white/75 px-gutter py-3 shadow-sm backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-3">
        <ConnectionBadge />
        <div>
          <p className="font-headline text-headline-md text-on-surface">{session.title}</p>
          {slide && (
            <p className="font-body text-label-sm text-on-surface-variant">{slide.topic}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void copyCode()}
          title="Copiar código de clase"
          aria-label={`Copiar código de clase ${session.code}`}
          className="inline-flex min-h-touch-target-min items-center gap-2 rounded-full border border-primary/20 bg-primary-fixed/85 px-3 py-1.5 font-body text-label-sm font-semibold text-on-primary-fixed shadow-sm transition-colors hover:bg-primary-fixed focus-visible:ring-3 focus-visible:ring-primary"
        >
          <Icon name="content_copy" size={14} />
          Código: <strong>{session.code}</strong>
        </button>
        <StatusChip
          label={`${connectedCount} conectados`}
          icon={<Icon name="groups" size={14} />}
        />
      </div>
    </div>
  );
}
