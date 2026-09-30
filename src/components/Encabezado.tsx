import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function Encabezado({ titulo, accion }: { titulo: string; accion?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card px-3 py-3">
      <Link
        to="/"
        aria-label="Volver al inicio"
        className="flex size-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground active:brightness-95"
      >
        <ChevronLeft className="size-7" />
      </Link>
      <h1 className="flex-1 truncate text-xl font-extrabold tracking-tight">{titulo}</h1>
      {accion}
    </header>
  );
}