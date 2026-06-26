import { Icon } from "@/components/ui/Icon";

type CurrentSignBadgeProps = {
  currentGloss: string | null;
  isPlaying: boolean;
};

export function CurrentSignBadge({ currentGloss, isPlaying }: CurrentSignBadgeProps) {
  return (
    <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 font-body text-label-sm text-white backdrop-blur-md">
      <Icon name="sign_language" size={18} />
      {isPlaying && currentGloss ? `Interpretando: ${currentGloss}` : "Intérprete en espera"}
      {isPlaying && (
        <span className="ml-1 h-2 w-2 animate-pulse rounded-full bg-secondary-fixed" aria-hidden="true" />
      )}
    </div>
  );
}
