import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ScanLine } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Encabezado } from "@/components/Encabezado";
import { EscanerCodigo } from "@/components/EscanerCodigo";
import { crearProducto } from "@/lib/bodega";

export const Route = createFileRoute("/registrar")({
  head: () => ({
    meta: [
      { title: "Registrar producto — Caja Bodega" },
      {
        name: "description",
        content: "Escanea el código de barras y guarda el nombre, precio y stock del producto.",
      },
      { property: "og:title", content: "Registrar producto — Caja Bodega" },
      {
        property: "og:description",
        content: "Agrega productos a tu bodega escaneando el código de barras.",
      },
    ],
  }),
  component: RegistrarPagina,
});

function RegistrarPagina() {
  const navigate = useNavigate();
  return (
    <main className="mx-auto min-h-screen w-full max-w-md pb-10">
      <Encabezado titulo="Registrar producto" />
      <div className="px-4 pt-5">
        <FormularioProducto
          onGuardado={() => {
            void navigate({ to: "/inventario" });
          }}
        />
      </div>
    </main>
  );
}

export function FormularioProducto({
  codigoInicial = "",
  onGuardado,
  textoBoton = "GUARDAR PRODUCTO",
}: {
  codigoInicial?: string;
  onGuardado: (producto: { id: string; nombre: string }) => void;
  textoBoton?: string;
}) {
  const [codigo, setCodigo] = useState(codigoInicial);
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [escaneando, setEscaneando] = useState(false);
  const queryClient = useQueryClient();

  const guardar = useMutation({
    mutationFn: () =>
      crearProducto({
        codigo_barras: codigo,
        nombre,
        precio: Number(precio.replace(",", ".")),
        stock: Number(stock || "0"),
      }),
    onSuccess: (producto) => {
      void queryClient.invalidateQueries({ queryKey: ["productos"] });
      toast.success(`${producto.nombre} guardado`);
      onGuardado(producto);
    },
    onError: (error: { code?: string; message?: string }) => {
      if (error?.code === "23505") {
        toast.error("Ese código ya está registrado");
        return;
      }
      toast.error("No se pudo guardar el producto");
    },
  });

  const listo = codigo.trim() !== "" && nombre.trim() !== "" && precio.trim() !== "";

  return (
    <form
      className="space-y-4"
      onSubmit={(evento) => {
        evento.preventDefault();
        if (!listo || guardar.isPending) return;
        guardar.mutate();
      }}
    >
      <div>
        <label className="etiqueta" htmlFor="codigo">
          Código de barras
        </label>
        <div className="flex gap-2">
          <input
            id="codigo"
            value={codigo}
            onChange={(evento) => setCodigo(evento.target.value)}
            inputMode="numeric"
            autoComplete="off"
            placeholder="Escanea o escribe"
            className="campo flex-1"
          />
          <button
            type="button"
            onClick={() => setEscaneando(true)}
            aria-label="Escanear código"
            className="flex size-15 shrink-0 items-center justify-center rounded-lg bg-info text-info-foreground active:brightness-95"
          >
            <ScanLine className="size-8" />
          </button>
        </div>
      </div>

      <div>
        <label className="etiqueta" htmlFor="nombre">
          Nombre del producto
        </label>
        <input
          id="nombre"
          value={nombre}
          onChange={(evento) => setNombre(evento.target.value)}
          placeholder="Ej. Inca Kola 500 ml"
          className="campo"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="etiqueta" htmlFor="precio">
            Precio (S/)
          </label>
          <input
            id="precio"
            value={precio}
            onChange={(evento) => setPrecio(evento.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            className="campo"
          />
        </div>
        <div>
          <label className="etiqueta" htmlFor="stock">
            Stock inicial
          </label>
          <input
            id="stock"
            value={stock}
            onChange={(evento) => setStock(evento.target.value)}
            inputMode="numeric"
            placeholder="0"
            className="campo"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!listo || guardar.isPending}
        className="boton-grande bg-primary text-primary-foreground disabled:opacity-40"
      >
        {guardar.isPending ? "Guardando…" : textoBoton}
      </button>

      <EscanerCodigo
        abierto={escaneando}
        onCerrar={() => setEscaneando(false)}
        onCodigo={(valor) => {
          setCodigo(valor);
          setEscaneando(false);
        }}
        titulo="Escanear código nuevo"
      />
    </form>
  );
}