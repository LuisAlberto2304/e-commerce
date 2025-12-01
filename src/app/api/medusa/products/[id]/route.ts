import { NextRequest, NextResponse } from "next/server";

export async function POST(
req: NextRequest,
{ params }: { params: { id: string } }
) {
try {
const ADMIN_KEY = process.env.MEDUSA_ADMIN_API_KEY;
const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL;


if (!ADMIN_KEY) {
  return NextResponse.json(
    { error: "MEDUSA_ADMIN_API_KEY no está configurada" },
    { status: 500 }
  );
}

if (!MEDUSA_URL) {
  return NextResponse.json(
    { error: "MEDUSA_BACKEND_URL no está configurada" },
    { status: 500 }
  );
}

const id = params.id;

if (!id) {
  return NextResponse.json(
    { error: "ID de producto requerido" },
    { status: 400 }
  );
}

const body = await req.json();

// 👉 Enviar al endpoint correcto: /admin/products/:id
const response = await fetch(`${MEDUSA_URL}/products/${id}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${ADMIN_KEY}`,
  },
  body: JSON.stringify(body),
});

const data = await response.json();

if (!response.ok) {
  return NextResponse.json(
    { error: "Error desde Medusa", details: data },
    { status: response.status }
  );
}

return NextResponse.json({ success: true, product: data });


} catch (error) {
console.error("Error agregando variantes:", error);
return NextResponse.json(
{ error: "Error interno del servidor" },
{ status: 500 }
);
}
}
