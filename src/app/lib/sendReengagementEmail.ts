/* eslint-disable @typescript-eslint/no-explicit-any */
export async function sendReengagementEmail(email: string, name: string) {
  const subject = "👋 ¡Te extrañamos en E-Tianguis!";
  const html = `
    <h2>Hola ${name || ""} 👋</h2>
    <p>Hace varios días que no te vemos por <b>E-Tianguis</b>.</p>
    <p>Tenemos nuevas ofertas y productos que podrían interesarte 😍</p>
    <a href="${process.env.NEXT_PUBLIC_BASE_URL}/" 
       style="background:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:8px;">
       Volver a E-Tianguis
    </a>
    <p>¡No dejes pasar las novedades de esta semana!</p>
  `;

  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/sendEmail`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to: email, subject, html }),
  });
}
