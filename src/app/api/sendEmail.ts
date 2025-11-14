import nodemailer from "nodemailer";
import type { NextApiRequest, NextApiResponse } from "next";

// --- Configurar transporte ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// --- Enviar correo ---
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { to, subject, message, html } = req.body;

  if (!to || !subject || (!message && !html)) {
    return res.status(400).json({ message: "Datos incompletos" });
  }

  try {
    await transporter.sendMail({
      from: `"Tu Tienda 🛍️" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text: message,
      html,
    });

    return res.status(200).json({ success: true, message: "Correo enviado correctamente" });
  } catch (error) {
    console.error("Error enviando correo:", error);
    return res.status(500).json({ success: false, message: "Error enviando correo" });
  }
}
