import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PackagePlus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Encabezado } from "@/components/Encabezado";
import { actualizarProducto, listarProductos, soles, type Producto } from "@/lib/bodega";

export const Route = createFileRoute("/inventario")({
  head: () => ({
    meta: [
      { title: "Inventario — Caja Bodega" },
      {
        name: "description",
        content: "Lista de productos de la bodega con precio, stock y edición rápida.",
      },
      { property: "og:title", content: "Inventario — Caja Bodega" },
      {
        property: "og:description",
        content: "Revisa y edita el precio y el stock de todos tus productos.",
      },
    ],
  }),
  component: InventarioPagina,
});

function InventarioPagina() {
  const [texto, setTexto] = useState("");
  const [editando, setEditando] = useState<Producto | null>(null);

  const { data: productos = [], isLoading } = useQuery({
    queryKey: ["productos"],
    queryFn: listarProductos,
  });

  const lista = useMemo(() => {
    const busqueda = texto.trim().toLowerCase();
    if (!busqueda) return productos;
    return productos.filter(
      (producto) =>
        producto.nombre.toLowerCase().includes(busqueda) ||
        producto.codigo_barras.includes(busqueda),
    );
  }, [productos, texto]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-md pb-10">
      <Encabezado
        titulo="Inventario"
        accion={
          <Link
            to="/registrar"
            aria-label="Registrar producto"
            className="flex size-12 items-center justify-center rounded-xl bg-info text-info-foreground"
          >
            <PackagePlus className="size-7" />
          </Link>
        }
      />

      <div className="px-4 pt-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" />
          <input
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            placeholder="Buscar producto"
            className="campo pl-12"
          />
        </div>

        {isLoading && (
          <p className="mt-6 text-center text-lg font-bold text-muted-foreground">Cargando…</p>
        )}

        <ul className="mt-4 space-y-2">
          {lista.map((producto) => (
            <li key={producto.id}>
              <button
                type="button"
                onClick={() => setEditando(producto)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border-2 border-border bg-card p-4 text-left active:brightness-95"
              >
                <span className="min-w-0">
                  <span className="block truncate text-lg font-extrabold">{producto.nombre}</span>
                  <span className="text-sm font-bold text-muted-foreground">
                    {producto.codigo_barras}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-xl font-extrabold text-primary">
                    {soles(producto.precio)}
                  </span>
                  <span
                    className={`text-sm font-extrabold ${producto.stock > 0 ? "text-muted-foreground" : "text-destructive"}`}
                  >
                    Stock {producto.stock}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {!isLoading && lista.length === 0 && (
          <p className="mt-6 rounded-xl bg-card p-5 text-center text-lg font-bold text-muted-foreground">
            No hay productos con ese nombre.
          </p>
        )}
      </div>

      {editando && <EditarProducto producto={editando} onCerrar={() => setEditando(null)} />}
    </main>
  );
}

function EditarProducto({ producto, onCerrar }: { producto: Producto; onCerrar: () => void }) {
  const [nombre, setNombre] = useState(producto.nombre);
  const [codigo, setCodigo] = useState(producto.codigo_barras);
  const [precio, setPrecio] = useState(producto.precio.toFixed(2));
  const [stock, setStock] = useState(String(producto.stock));
  const queryClient = useQueryClient();

  const guardar = useMutation({
    mutationFn: () =>
      actualizarProducto(producto.id, {
        nombre,
        codigo_barras: codigo,
        precio: Number(precio.replace(",", ".")),
        stock: Number(stock || "0"),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["productos"] });
      toast.success("Producto actualizado");
      onCerrar();
    },
    onError: () => toast.error("No se pudo guardar el cambio"),
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background p-4">
      <div className="mx-auto w-full max-w-md">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold">Editar producto</h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onCerrar}
            className="rounded-full bg-secondary p-3"
          >
            <X className="size-6" />
          </button>
        </div>

        <form
          className="mt-5 space-y-4"
          onSubmit={(evento) => {
            evento.preventDefault();
            if (!guardar.isPending) guardar.mutate();
          }}
        >
          <div>
            <label className="etiqueta" htmlFor="editar-nombre">
              Nombre
            </label>
            <input
              id="editar-nombre"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              className="campo"
            />
          </div>
          <div>
            <label className="etiqueta" htmlFor="editar-codigo">
              Código de barras
            </label>
            <input
              id="editar-codigo"
              value={codigo}
              onChange={(evento) => setCodigo(evento.target.value)}
              inputMode="numeric"
              className="campo"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="etiqueta" htmlFor="editar-precio">
                Precio (S/)
              </label>
              <input
                id="editar-precio"
                value={precio}
                onChange={(evento) => setPrecio(evento.target.value)}
                inputMode="decimal"
                className="campo"
              />
            </div>
            <div>
              <label className="etiqueta" htmlFor="editar-stock">
                Stock
              </label>
              <input
                id="editar-stock"
                value={stock}
                onChange={(evento) => setStock(evento.target.value)}
                inputMode="numeric"
                className="campo"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={guardar.isPending}
            className="boton-grande bg-primary text-primary-foreground disabled:opacity-40"
          >
            {guardar.isPending ? "Guardando…" : "GUARDAR CAMBIOS"}
          </button>
        </form>
      </div>
    </div>
  );
}