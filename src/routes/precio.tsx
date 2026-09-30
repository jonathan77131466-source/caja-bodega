import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ScanLine, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Encabezado } from "@/components/Encabezado";
import { EscanerCodigo } from "@/components/EscanerCodigo";
import { listarProductos, soles, type Producto } from "@/lib/bodega";

export const Route = createFileRoute("/precio")({
  head: () => ({
    meta: [
      { title: "Consultar precio — Caja Bodega" },
      {
        name: "description",
        content: "Busca por nombre o escanea el código para ver el precio y el stock al instante.",
      },
      { property: "og:title", content: "Consultar precio — Caja Bodega" },
      {
        property: "og:description",
        content: "Consulta el precio de cualquier producto sin iniciar una venta.",
      },
    ],
  }),
  component: PrecioPagina,
});

function PrecioPagina() {
  const [texto, setTexto] = useState("");
  const [escaneando, setEscaneando] = useState(false);
  const [seleccionado, setSeleccionado] = useState<Producto | null>(null);

  const { data: productos = [], isLoading } = useQuery({
    queryKey: ["productos"],
    queryFn: listarProductos,
  });

  const resultados = useMemo(() => {
    const busqueda = texto.trim().toLowerCase();
    if (!busqueda) return [];
    return productos
      .filter(
        (producto) =>
          producto.nombre.toLowerCase().includes(busqueda) ||
          producto.codigo_barras.includes(busqueda),
      )
      .slice(0, 20);
  }, [productos, texto]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-md pb-10">
      <Encabezado titulo="Consultar precio" />

      <div className="space-y-4 px-4 pt-5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" />
            <input
              value={texto}
              onChange={(evento) => {
                setTexto(evento.target.value);
                setSeleccionado(null);
              }}
              placeholder="Nombre o código"
              className="campo pl-12"
            />
          </div>
          <button
            type="button"
            onClick={() => setEscaneando(true)}
            aria-label="Escanear código"
            className="flex size-15 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground active:brightness-95"
          >
            <ScanLine className="size-8" />
          </button>
        </div>

        {seleccionado ? (
          <TarjetaPrecio producto={seleccionado} />
        ) : (
          <>
            {texto.trim() !== "" && resultados.length === 0 && !isLoading && (
              <p className="rounded-xl bg-card p-4 text-center text-lg font-bold text-muted-foreground">
                No encontramos ese producto.
              </p>
            )}
            <ul className="space-y-2">
              {resultados.map((producto) => (
                <li key={producto.id}>
                  <button
                    type="button"
                    onClick={() => setSeleccionado(producto)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border-2 border-border bg-card p-4 text-left active:brightness-95"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-lg font-extrabold">
                        {producto.nombre}
                      </span>
                      <span className="text-sm font-bold text-muted-foreground">
                        Stock: {producto.stock}
                      </span>
                    </span>
                    <span className="text-xl font-extrabold text-primary">
                      {soles(producto.precio)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <EscanerCodigo
        abierto={escaneando}
        onCerrar={() => setEscaneando(false)}
        onCodigo={(codigo) => {
          const encontrado = productos.find((producto) => producto.codigo_barras === codigo);
          setEscaneando(false);
          if (encontrado) {
            setSeleccionado(encontrado);
            setTexto(encontrado.nombre);
          } else {
            setSeleccionado(null);
            setTexto(codigo);
          }
        }}
        titulo="Escanear para ver precio"
      />
    </main>
  );
}

function TarjetaPrecio({ producto }: { producto: Producto }) {
  return (
    <section className="rounded-2xl border-2 border-primary bg-card p-5 text-center">
      <h2 className="text-2xl font-extrabold leading-tight">{producto.nombre}</h2>
      <p className="mt-3 text-6xl font-extrabold tracking-tight text-primary">
        {soles(producto.precio)}
      </p>
      <p className="mt-3 text-xl font-extrabold">
        Stock: <span className={producto.stock > 0 ? "" : "text-destructive"}>{producto.stock}</span>
      </p>
      <p className="mt-1 text-sm font-bold text-muted-foreground">
        Código {producto.codigo_barras}
      </p>
    </section>
  );
}