import { supabase } from "@/integrations/supabase/client";

export type Producto = {
  id: string;
  codigo_barras: string;
  nombre: string;
  precio: number;
  stock: number;
};

export type ItemCarrito = {
  producto_id: string;
  codigo_barras: string;
  nombre: string;
  precio: number;
  cantidad: number;
};

export function soles(valor: number) {
  return `S/ ${Number(valor || 0).toFixed(2)}`;
}

export async function listarProductos(): Promise<Producto[]> {
  const { data, error } = await supabase
    .from("productos")
    .select("id, codigo_barras, nombre, precio, stock")
    .order("nombre", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(normalizar);
}

export async function buscarPorCodigo(codigo: string): Promise<Producto | null> {
  const { data, error } = await supabase
    .from("productos")
    .select("id, codigo_barras, nombre, precio, stock")
    .eq("codigo_barras", codigo.trim())
    .maybeSingle();
  if (error) throw error;
  return data ? normalizar(data) : null;
}

export async function crearProducto(entrada: {
  codigo_barras: string;
  nombre: string;
  precio: number;
  stock: number;
}): Promise<Producto> {
  const { data, error } = await supabase
    .from("productos")
    .insert({
      codigo_barras: entrada.codigo_barras.trim(),
      nombre: entrada.nombre.trim(),
      precio: entrada.precio,
      stock: entrada.stock,
    })
    .select("id, codigo_barras, nombre, precio, stock")
    .single();
  if (error) throw error;
  return normalizar(data);
}

export async function actualizarProducto(
  id: string,
  cambios: { nombre: string; precio: number; stock: number; codigo_barras: string },
): Promise<void> {
  const { error } = await supabase
    .from("productos")
    .update({
      nombre: cambios.nombre.trim(),
      precio: cambios.precio,
      stock: cambios.stock,
      codigo_barras: cambios.codigo_barras.trim(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function registrarVenta(
  items: ItemCarrito[],
  pagado: number | null,
): Promise<{ total: number; vuelto: number | null }> {
  const total = items.reduce((suma, item) => suma + item.precio * item.cantidad, 0);
  const vuelto = pagado != null ? Number((pagado - total).toFixed(2)) : null;

  const { data: venta, error: errorVenta } = await supabase
    .from("ventas")
    .insert({ total, pagado, vuelto })
    .select("id")
    .single();
  if (errorVenta) throw errorVenta;

  const { error: errorDetalle } = await supabase.from("detalle_ventas").insert(
    items.map((item) => ({
      venta_id: venta.id,
      producto_id: item.producto_id,
      nombre: item.nombre,
      codigo_barras: item.codigo_barras,
      precio_unitario: item.precio,
      cantidad: item.cantidad,
      subtotal: Number((item.precio * item.cantidad).toFixed(2)),
    })),
  );
  if (errorDetalle) throw errorDetalle;

  // Descontar stock producto por producto.
  for (const item of items) {
    const actual = await buscarPorCodigo(item.codigo_barras);
    if (!actual) continue;
    const { error } = await supabase
      .from("productos")
      .update({ stock: actual.stock - item.cantidad })
      .eq("id", actual.id);
    if (error) throw error;
  }

  return { total, vuelto };
}

export type VentaResumen = {
  id: string;
  total: number;
  pagado: number | null;
  vuelto: number | null;
  created_at: string;
};

export async function ultimasVentas(): Promise<VentaResumen[]> {
  const { data, error } = await supabase
    .from("ventas")
    .select("id, total, pagado, vuelto, created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []).map((venta) => ({
    ...venta,
    total: Number(venta.total),
    pagado: venta.pagado == null ? null : Number(venta.pagado),
    vuelto: venta.vuelto == null ? null : Number(venta.vuelto),
  }));
}

function normalizar(row: {
  id: string;
  codigo_barras: string;
  nombre: string;
  precio: number | string;
  stock: number;
}): Producto {
  return {
    id: row.id,
    codigo_barras: row.codigo_barras,
    nombre: row.nombre,
    precio: Number(row.precio),
    stock: Number(row.stock),
  };
}