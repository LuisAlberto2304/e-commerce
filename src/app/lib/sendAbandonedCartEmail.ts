/* eslint-disable @typescript-eslint/no-explicit-any */
export async function sendAbandonedCartEmail(email: string, cartItems: any[]) {
  const itemsList = cartItems
    .map((i) => `• ${i.title} (${i.selectedOptions?.["Opción 1"] ?? ""}) - $${i.price}`)
    .join("<br>");

  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/sendEmail`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: email,
      subject: "🛒 ¡Aún tienes artículos en tu carrito!",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px; color: #333;">
          <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden;">
            <tr>
              <td style="background-color: #4f46e5; padding: 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px;">🛒 ¡Aún tienes artículos en tu carrito!</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 25px;">
                <h2 style="margin-top: 0;">Hola 👋</h2>
                <p style="font-size: 16px; line-height: 1.5;">
                  Notamos que dejaste algunos productos en tu carrito. ¡No te quedes sin ellos!
                </p>

                <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
                  ${itemsList}
                </div>

                <p style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL}/cart"
                    style="background-color: #4f46e5; color: white; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Volver a mi carrito
                  </a>
                </p>

                <p style="font-size: 14px; color: #6b7280;">
                  Completa tu compra antes de que se agoten 🕓
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} E-Tianguis. Todos los derechos reservados.
              </td>
            </tr>
          </table>
        </div>
      `
    }),
  });
}
