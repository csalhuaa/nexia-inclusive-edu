import { useClassroom } from "@/hooks/useClassroom";
import { ConnectionBadge } from "@/components/classroom/ConnectionBadge";
import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";

export function SessionBar() {
  const { session } = useClassroom();

  if (!session) return null;

  const slide = session.slides[session.slideIndex];
  const copyCode = async () => {
    await navigator.clipboard.writeText(session.code);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-gutter py-3">
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
          className="inline-flex min-h-touch-target-min items-center gap-2 rounded-full bg-primary-fixed px-3 py-1.5 font-body text-label-sm text-on-primary-fixed transition-colors hover:bg-primary-fixed/80 focus-visible:ring-3 focus-visible:ring-primary"
        >
          <Icon name="content_copy" size={14} />
          Código: <strong>{session.code}</strong>
        </button>
        <StatusChip
          label={`${session.participants.filter((p) => p.isOnline).length} conectados`}
          icon={<Icon name="groups" size={14} />}
        />
      </div>
    </div>
  );
}
