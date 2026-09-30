import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingCart, Tag, PackagePlus, Boxes } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Caja Bodega — Vender, precios e inventario" },
      {
        name: "description",
        content:
          "Caja registradora simple para bodegas: vende escaneando, consulta precios y controla el stock.",
      },
      { property: "og:title", content: "Caja Bodega — Vender, precios e inventario" },
      {
        property: "og:description",
        content: "Vende escaneando, consulta precios y controla el stock de tu bodega.",
      },
    ],
  }),
  component: Inicio,
});

const opciones = [
  {
    to: "/vender" as const,
    titulo: "VENDER",
    detalle: "Escanea y cobra",
    icono: ShoppingCart,
    clases: "bg-primary text-foreground",
  },
  {
    to: "/precio" as const,
    titulo: "CONSULTAR PRECIO",
    detalle: "Sin tocar el stock",
    icono: Tag,
    clases: "bg-accent text-accent-foreground",
  },
  {
    to: "/registrar" as const,
    titulo: "REGISTRAR PRODUCTO",
    detalle: "Agregar al catálogo",
    icono: PackagePlus,
    clases: "bg-info text-foreground",
  },
  {
    to: "/inventario" as const,
    titulo: "INVENTARIO",
    detalle: "Precios y stock",
    icono: Boxes,
    clases: "bg-foreground text-background",
  },
];

function Inicio() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-10 pt-8">
      <div className="mb-6 flex items-center gap-3">
        <img src="/icono-192.png" alt="" width={56} height={56} className="size-14 rounded-xl" />
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Caja Bodega</h1>
          <p className="text-base font-bold text-muted-foreground">Toca una opción</p>
        </div>
      </div>

      <div className="space-y-4">
        {opciones.map((opcion) => (
          <Link key={opcion.to} to={opcion.to} className={`boton-grande ${opcion.clases}`}>
            <opcion.icono className="size-9 shrink-0" />
            <span className="flex flex-col items-start leading-tight">
              <span className="text-2xl font-extrabold">{opcion.titulo}</span>
              <span className="text-sm font-bold opacity-85">{opcion.detalle}</span>
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}