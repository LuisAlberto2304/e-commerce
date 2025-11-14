import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { to, subject, html } = await req.json();

    // ⚙️ Llama a Resend API (gratuito hasta cierto límite)
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "E-Tianguis <onboarding@resend.dev>",
        to: ["0323105921@ut-tijuana.edu.mx"],
        subject,
        html,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Error al enviar email:", data);
      return NextResponse.json({ error: data }, { status: 500 });
    }

    console.log(`✅ Correo enviado a ${to}`);
    return NextResponse.json({ message: "Correo enviado correctamente" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
