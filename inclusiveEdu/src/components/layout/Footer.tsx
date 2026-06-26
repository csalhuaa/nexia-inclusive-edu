import { FOOTER_LINKS } from "@/constants/navigation";

export function Footer() {
  return (
    <footer
      role="contentinfo"
      aria-label="Pie de página"
      className="mt-auto flex w-full flex-col items-center justify-between border-t-2 border-outline-variant bg-surface-container-highest px-margin-desktop py-gutter md:flex-row"
    >
      <div className="mb-4 text-center md:mb-0 md:text-left">
        <span className="mb-2 block font-headline text-headline-md text-primary">
          Inclusive EDU
        </span>
        <p className="font-body text-label-lg text-on-surface">
          © 2024 Inclusive EDU. All rights reserved.
        </p>
      </div>

      <nav aria-label="Enlaces de pie de página" className="flex flex-wrap justify-center gap-6">
        {FOOTER_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.to}
            aria-label={link.ariaLabel}
            className="rounded-sm px-2 py-1 font-body text-label-lg text-on-surface-variant transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
