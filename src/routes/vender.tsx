import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, ScanLine, Trash2, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Encabezado } from "@/components/Encabezado";
import { EscanerCodigo } from "@/components/EscanerCodigo";
import { FormularioProducto } from "./registrar";
import {
  listarProductos,
  registrarVenta,
  soles,
  type ItemCarrito,
  type Producto,
} from "@/lib/bodega";

export const Route = createFileRoute("/vender")({
  head: () => ({
    meta: [
      { title: "Vender — Caja Bodega" },
      {
        name: "description",
        content: "Escanea los productos, mira el total y calcula el vuelto automáticamente.",
      },
      { property: "og:title", content: "Vender — Caja Bodega" },
      {
        property: "og:description",
        content: "Cobra rápido: escanea, revisa el total y el vuelto sale solo.",
      },
    ],
  }),
  component: VenderPagina,
});

function VenderPagina() {
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [escaneando, setEscaneando] = useState(false);
  const [codigoDesconocido, setCodigoDesconocido] = useState<string | null>(null);
  const [pagaCon, setPagaCon] = useState("");
  const queryClient = useQueryClient();

  const { data: productos = [] } = useQuery({
    queryKey: ["productos"],
    queryFn: listarProductos,
  });

  const total = useMemo(
    () => carrito.reduce((suma, item) => suma + item.precio * item.cantidad, 0),
    [carrito],
  );
  const pagado = pagaCon.trim() === "" ? null : Number(pagaCon.replace(",", "."));
  const vuelto = pagado != null && !Number.isNaN(pagado) ? pagado - total : null;

  const agregar = useCallback((producto: Producto) => {
    setCarrito((actual) => {
      const existe = actual.find((item) => item.codigo_barras === producto.codigo_barras);
      if (existe) {
        return actual.map((item) =>
          item.codigo_barras === producto.codigo_barras
            ? { ...item, cantidad: item.cantidad + 1 }
            : item,
        );
      }
      return [
        ...actual,
        {
          producto_id: producto.id,
          codigo_barras: producto.codigo_barras,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: 1,
        },
      ];
    });
  }, []);

  const finalizar = useMutation({
    mutationFn: () => registrarVenta(carrito, pagado != null && !Number.isNaN(pagado) ? pagado : null),
    onSuccess: (resultado) => {
      void queryClient.invalidateQueries({ queryKey: ["productos"] });
      toast.success(
        resultado.vuelto != null
          ? `Venta de ${soles(resultado.total)} · Vuelto ${soles(resultado.vuelto)}`
          : `Venta de ${soles(resultado.total)} registrada`,
      );
      setCarrito([]);
      setPagaCon("");
    },
    onError: () => toast.error("No se pudo registrar la venta"),
  });

  function manejarCodigo(codigo: string) {
    const encontrado = productos.find((producto) => producto.codigo_barras === codigo);
    setEscaneando(false);
    if (encontrado) {
      agregar(encontrado);
      toast.success(`${encontrado.nombre} agregado`);
    } else {
      setCodigoDesconocido(codigo);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md pb-72">
      <Encabezado titulo="Vender" />

      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={() => setEscaneando(true)}
          className="boton-grande bg-primary text-primary-foreground"
        >
          <ScanLine className="size-9" /> ESCANEAR PRODUCTO
        </button>

        {carrito.length === 0 ? (
          <p className="mt-6 rounded-xl bg-card p-5 text-center text-lg font-bold text-muted-foreground">
            Escanea el primer producto para empezar la venta.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {carrito.map((item) => (
              <li key={item.codigo_barras} className="rounded-xl border-2 border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-extrabold">{item.nombre}</p>
                    <p className="text-sm font-bold text-muted-foreground">
                      {soles(item.precio)} c/u
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Quitar ${item.nombre}`}
                    onClick={() =>
                      setCarrito((actual) =>
                        actual.filter((fila) => fila.codigo_barras !== item.codigo_barras),
                      )
                    }
                    className="rounded-lg bg-destructive/10 p-3 text-destructive"
                  >
                    <Trash2 className="size-6" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="Quitar una unidad"
                      onClick={() =>
                        setCarrito((actual) =>
                          actual.flatMap((fila) =>
                            fila.codigo_barras === item.codigo_barras
                              ? fila.cantidad <= 1
                                ? []
                                : [{ ...fila, cantidad: fila.cantidad - 1 }]
                              : [fila],
                          ),
                        )
                      }
                      className="flex size-12 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"
                    >
                      <Minus className="size-6" />
                    </button>
                    <span className="min-w-8 text-center text-2xl font-extrabold">
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      aria-label="Agregar una unidad"
                      onClick={() =>
                        setCarrito((actual) =>
                          actual.map((fila) =>
                            fila.codigo_barras === item.codigo_barras
                              ? { ...fila, cantidad: fila.cantidad + 1 }
                              : fila,
                          ),
                        )
                      }
                      className="flex size-12 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"
                    >
                      <Plus className="size-6" />
                    </button>
                  </div>
                  <span className="text-xl font-extrabold">
                    {soles(item.precio * item.cantidad)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-md border-t-2 border-border bg-card px-4 pb-5 pt-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xl font-extrabold text-muted-foreground">TOTAL</span>
          <span className="text-5xl font-extrabold tracking-tight text-primary">
            {soles(total)}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 items-end gap-3">
          <div>
            <label className="etiqueta" htmlFor="paga">
              Paga con (S/)
            </label>
            <input
              id="paga"
              value={pagaCon}
              onChange={(evento) => setPagaCon(evento.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="campo"
            />
          </div>
          <div className="rounded-lg bg-accent/25 px-3 py-2">
            <p className="text-sm font-bold text-muted-foreground">VUELTO</p>
            <p
              className={`text-3xl font-extrabold ${vuelto != null && vuelto < 0 ? "text-destructive" : ""}`}
            >
              {vuelto == null || Number.isNaN(vuelto) ? "—" : soles(vuelto)}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={carrito.length === 0 || finalizar.isPending}
          onClick={() => finalizar.mutate()}
          className="boton-grande mt-3 bg-foreground text-background disabled:opacity-40"
        >
          {finalizar.isPending ? "Guardando…" : "FINALIZAR VENTA"}
        </button>
      </div>

      <EscanerCodigo
        abierto={escaneando}
        onCerrar={() => setEscaneando(false)}
        onCodigo={manejarCodigo}
        titulo="Escanear para vender"
      />

      {codigoDesconocido && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background p-4">
          <div className="mx-auto w-full max-w-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold">Producto no registrado</h2>
                <p className="mt-1 text-base font-bold text-muted-foreground">
                  Código {codigoDesconocido}. Regístralo y se agrega a esta misma venta.
                </p>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setCodigoDesconocido(null)}
                className="rounded-full bg-secondary p-3"
              >
                <X className="size-6" />
              </button>
            </div>
            <div className="mt-5">
              <FormularioProducto
                key={codigoDesconocido}
                codigoInicial={codigoDesconocido}
                textoBoton="GUARDAR Y AGREGAR A LA VENTA"
                onGuardado={async () => {
                  const productosActualizados = await queryClient.fetchQuery({
                    queryKey: ["productos"],
                    queryFn: listarProductos,
                  });
                  const nuevo = productosActualizados.find(
                    (producto) => producto.codigo_barras === codigoDesconocido,
                  );
                  if (nuevo) agregar(nuevo);
                  setCodigoDesconocido(null);
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => setCodigoDesconocido(null)}
              className="boton-grande mt-4 bg-secondary text-secondary-foreground"
            >
              Seguir sin registrar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}