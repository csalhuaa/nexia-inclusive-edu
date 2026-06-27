import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ROUTES } from "@/constants/routes";

type SessionEndedNoticeProps = {
  message?: string;
};

export function SessionEndedNotice({
  message = "La sesión ha finalizado.",
}: SessionEndedNoticeProps) {
  return (
    <main className="flex flex-grow items-center justify-center p-gutter">
      <section className="edu-glass mx-auto flex max-w-xl flex-col items-center rounded-3xl p-8 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-fixed text-primary">
          <Icon name="check_circle" size={36} />
        </div>
        <h1 className="font-headline text-headline-lg text-on-surface">Sesión terminada</h1>
        <p className="mt-3 font-body text-body-lg text-on-surface-variant">{message}</p>
        <Link to={ROUTES.home} className="mt-6">
          <Button>
            <Icon name="home" />
            Volver al inicio
          </Button>
        </Link>
      </section>
    </main>
  );
}
