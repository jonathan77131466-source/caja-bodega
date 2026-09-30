import { useEffect, useRef, useState } from "react";
import { Camera, X, Keyboard } from "lucide-react";

type Props = {
  abierto: boolean;
  onCerrar: () => void;
  onCodigo: (codigo: string) => void;
  titulo?: string;
};

type DetectorCodigo = {
  detect: (fuente: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
};

/** Escáner de código de barras con la cámara del celular, con respaldo manual. */
export function EscanerCodigo({ abierto, onCerrar, onCodigo, titulo = "Escanear producto" }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [estado, setEstado] = useState<"iniciando" | "activo" | "sin-soporte" | "error">(
    "iniciando",
  );
  const [manual, setManual] = useState("");

  useEffect(() => {
    if (!abierto) return;
    let detenido = false;
    let stream: MediaStream | null = null;
    let temporizador: ReturnType<typeof setInterval> | null = null;

    async function iniciar() {
      const ventana = window as unknown as {
        BarcodeDetector?: new (opciones?: { formats?: string[] }) => DetectorCodigo;
      };
      if (!ventana.BarcodeDetector || !navigator.mediaDevices?.getUserMedia) {
        setEstado("sin-soporte");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
        if (detenido) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const detector = new ventana.BarcodeDetector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf"],
        });
        setEstado("activo");
        temporizador = setInterval(async () => {
          if (!videoRef.current || detenido) return;
          try {
            const codigos = await detector.detect(videoRef.current);
            const valor = codigos[0]?.rawValue?.trim();
            if (valor) {
              detenido = true;
              onCodigo(valor);
            }
          } catch {
            // Un fotograma sin lectura no es un error real.
          }
        }, 400);
      } catch {
        setEstado("error");
      }
    }

    void iniciar();
    return () => {
      detenido = true;
      if (temporizador) clearInterval(temporizador);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [abierto, onCodigo]);

  useEffect(() => {
    if (!abierto) setManual("");
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-foreground/95 p-4">
      <div className="flex items-center justify-between text-background">
        <h2 className="text-xl font-extrabold">{titulo}</h2>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar escáner"
          className="rounded-full bg-background/15 p-3"
        >
          <X className="size-6" />
        </button>
      </div>

      <div className="mt-4 flex-1 overflow-hidden rounded-2xl bg-black/60">
        {estado === "sin-soporte" || estado === "error" ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-background">
            <Camera className="size-12 opacity-70" />
            <p className="text-lg font-bold">
              {estado === "error"
                ? "No se pudo abrir la cámara"
                : "Este navegador no puede escanear"}
            </p>
            <p className="text-sm opacity-80">Escribe el código con el teclado.</p>
          </div>
        ) : (
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        )}
      </div>

      <form
        className="mt-4 space-y-3"
        onSubmit={(evento) => {
          evento.preventDefault();
          const valor = manual.trim();
          if (valor) onCodigo(valor);
        }}
      >
        <label className="flex items-center gap-2 text-sm font-bold text-background">
          <Keyboard className="size-5" /> Escribir código
        </label>
        <input
          value={manual}
          onChange={(evento) => setManual(evento.target.value)}
          inputMode="numeric"
          autoComplete="off"
          placeholder="Ej. 7750670001234"
          className="h-16 w-full rounded-xl bg-background px-4 text-2xl font-bold tracking-wide text-foreground"
        />
        <button
          type="submit"
          className="h-16 w-full rounded-xl bg-primary text-xl font-extrabold text-primary-foreground active:brightness-95"
        >
          Usar este código
        </button>
      </form>
    </div>
  );
}