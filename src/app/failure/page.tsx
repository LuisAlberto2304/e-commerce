"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function FailurePage() {
  const [errorInfo, setErrorInfo] = useState<{ step: string; message: string } | null>(null);

  useEffect(() => {
    const savedError = localStorage.getItem("paymentError");
    if (savedError) {
      setErrorInfo(JSON.parse(savedError));
      localStorage.removeItem("paymentError"); // limpiar después de mostrar
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-red-600 mb-2">Pago fallido</h1>
      <p className="text-gray-700 mb-4">
        Hubo un problema al procesar tu pago o crear tu pedido.
      </p>

      {errorInfo ? (
        <div className="border border-red-300 bg-red-50 p-4 rounded-lg w-full max-w-md text-left">
          <p className="font-semibold text-red-700">Etapa del error:</p>
          <p className="text-gray-700 mb-2">{errorInfo.step}</p>
          <p className="font-semibold text-red-700">Detalles:</p>
          <p className="text-gray-700">{errorInfo.message}</p>
        </div>
      ) : (
        <p className="text-gray-500">No se encontró información detallada del error.</p>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mt-6">
        <Link
          href="/checkout"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Intentar de nuevo
        </Link>
        <Link
          href="/"
          className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
