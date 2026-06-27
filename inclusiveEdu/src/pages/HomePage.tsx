import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Footer } from "@/components/layout/Footer";
import { TopNavBar } from "@/components/layout/TopNavBar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ROUTES } from "@/constants/routes";

const stats = [
  {
    value: "3.2 millones",
    text: "personas con discapacidad viven en el Perú.",
    source: "CONADIS",
  },
  {
    value: "23.6%",
    text: "de personas con discapacidad no tiene nivel educativo o solo educación inicial.",
    source: "INEI",
  },
  {
    value: "1%",
    text: "de la matrícula en escuelas regulares corresponde a estudiantes con discapacidad.",
    source: "UNICEF Perú",
  },
  {
    value: "40.4%",
    text: "de estudiantes con discapacidad culmina la primaria.",
    source: "UNICEF Perú",
  },
];

const benefits = [
  {
    title: "Para estudiantes sordos",
    text: "Subtítulos en vivo y avatar 2D que simula gestos mediante glosas.",
    icon: "sign_language",
  },
  {
    title: "Para estudiantes ciegos",
    text: "Narración inteligente de pantalla, pizarra o diapositivas.",
    icon: "blind",
  },
  {
    title: "Para docentes",
    text: "Una sala tipo Meet con código único, micrófono, cámara y pantalla compartida.",
    icon: "school",
  },
];

const faqs = [
  {
    question: "¿Qué es InclusiveEdu?",
    answer:
      "InclusiveEdu es una plataforma educativa accesible tipo Meet que ayuda a estudiantes sordos y ciegos a participar en clases en vivo.",
  },
  {
    question: "¿Cómo ayuda a estudiantes sordos?",
    answer:
      "Convierte la voz del docente en subtítulos y glosas. Luego un avatar 2D simula gestos para facilitar la comprensión.",
  },
  {
    question: "¿Cómo ayuda a estudiantes ciegos?",
    answer:
      "El estudiante escucha el audio real del docente y además recibe una narración generada por IA sobre lo que aparece en la pantalla, pizarra o diapositivas.",
  },
  {
    question: "¿Necesita instalar algo?",
    answer: "No. Funciona desde el navegador mediante un código de sesión.",
  },
  {
    question: "¿Usa inteligencia artificial?",
    answer:
      "Sí. Usa IA para transcribir audio, describir contenido visual y generar apoyo accesible en tiempo real.",
  },
  {
    question: "¿La interpretación en señas es real?",
    answer:
      "En el MVP de hackatón es una simulación mediante glosas y gestos visuales. La integración con modelos avanzados como SignLLM queda para una versión futura.",
  },
];

export function HomePage() {
  return (
    <AppLayout>
      <TopNavBar variant="home" />

      <main className="edu-soft-grid relative overflow-hidden">
        <section className="relative mx-auto grid min-h-[calc(100vh-76px)] w-full max-w-7xl items-center gap-10 px-margin-mobile py-16 md:grid-cols-[1.05fr_0.95fr] md:px-margin-desktop md:py-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(37,72,199,0.16),transparent_30%),radial-gradient(circle_at_78%_42%,rgba(0,140,138,0.14),transparent_28%)]"
          />

          <div className="relative z-10 max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-white/80 px-4 py-2 font-body text-label-sm font-semibold text-secondary shadow-sm backdrop-blur-xl">
              <Icon name="diversity_3" size={18} />
              Tecnología para aulas inclusivas
            </div>
            <h1 className="font-display text-[clamp(2.7rem,7vw,5.25rem)] leading-tight text-on-surface">
              Educación accesible <span className="edu-gradient-text">en tiempo real</span>
            </h1>
            <p className="mt-6 max-w-2xl font-body text-body-lg text-on-surface-variant">
              InclusiveEdu ayuda a estudiantes sordos y ciegos a seguir una clase en vivo mediante
              transcripción, interpretación visual y narración inteligente.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to={ROUTES.createSession}>
                <Button>
                  <Icon name="add_circle" />
                  Crear sesión
                </Button>
              </Link>
              <Link to={ROUTES.joinSession}>
                <Button variant="outline">
                  <Icon name="login" />
                  Unirse a sesión
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative z-10 edu-glass rounded-3xl p-6">
            <div className="rounded-3xl bg-gradient-to-br from-primary to-[#312E81] p-6 text-white shadow-2xl">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="font-body text-label-sm text-white/70">Aula en vivo</p>
                  <p className="font-headline text-headline-md">Matemática inclusiva</p>
                </div>
                <span className="rounded-full bg-white/15 px-3 py-1 font-body text-label-sm">LIVE</span>
              </div>
              <div className="grid gap-3">
                {benefits.map((benefit) => (
                  <div key={benefit.title} className="flex items-center gap-3 rounded-2xl bg-white/12 p-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                      <Icon name={benefit.icon} size={24} />
                    </span>
                    <div>
                      <p className="font-headline text-label-lg">{benefit.title}</p>
                      <p className="font-body text-label-sm text-white/75">{benefit.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-margin-mobile py-16 md:px-margin-desktop">
          <div className="mb-8 max-w-3xl">
            <p className="font-body text-label-lg font-semibold text-primary">El problema</p>
            <h2 className="mt-2 font-headline text-headline-lg text-on-surface">
              La brecha educativa para estudiantes con discapacidad sigue siendo urgente.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <article key={stat.value} className="rounded-3xl border border-outline-variant bg-white p-6 shadow-[0_18px_48px_rgba(18,32,51,0.08)]">
                <p className="font-display text-[2.5rem] font-bold leading-none text-primary">{stat.value}</p>
                <p className="mt-4 font-body text-body-md text-on-surface">{stat.text}</p>
                <p className="mt-5 font-body text-label-sm font-semibold text-on-surface-variant">
                  Fuente: {stat.source}
                </p>
              </article>
            ))}
          </div>
          <p className="mt-4 font-body text-label-sm text-on-surface-variant">
            Referencias institucionales: Observatorio Nacional de la Discapacidad de CONADIS,
            INEI y UNICEF Perú.
          </p>
        </section>

        <section className="mx-auto w-full max-w-7xl px-margin-mobile py-16 md:px-margin-desktop">
          <div className="rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(18,32,51,0.08)] md:p-10">
            <div className="mb-8 max-w-3xl">
              <p className="font-body text-label-lg font-semibold text-secondary">La solución</p>
              <h2 className="mt-2 font-headline text-headline-lg text-on-surface">
                Una clase en vivo adaptada para aprender sin perder información clave.
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {benefits.map((benefit) => (
                <article key={benefit.title} className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-6">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-fixed text-primary">
                    <Icon name={benefit.icon} size={26} />
                  </div>
                  <h3 className="font-headline text-headline-md text-on-surface">{benefit.title}</h3>
                  <p className="mt-3 font-body text-body-md text-on-surface-variant">{benefit.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto w-full max-w-5xl scroll-mt-28 px-margin-mobile py-16 md:px-margin-desktop">
          <div className="mb-8 text-center">
            <p className="font-body text-label-lg font-semibold text-primary">FAQ</p>
            <h2 className="mt-2 font-headline text-headline-lg text-on-surface">
              Preguntas frecuentes
            </h2>
          </div>
          <div className="grid gap-4">
            {faqs.map((faq) => (
              <details key={faq.question} className="group rounded-3xl border border-outline-variant bg-white p-6 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-headline text-label-lg text-on-surface">
                  {faq.question}
                  <Icon name="expand_more" className="transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-4 font-body text-body-md text-on-surface-variant">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </AppLayout>
  );
}
