/* eslint-disable @typescript-eslint/no-explicit-any */
export default function OrderSummary({
  cartItems,
  subtotal,
  tax,
  shipping,
  total,
  country,
  shippingDetails,
}: {
  cartItems: any[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  country?: string;
  shippingDetails?: { zone?: string; estimatedDays?: number };
}) {
  return (
    <div className="border rounded-xl p-4 shadow-md bg-white">
      <h2 className="text-lg font-semibold mb-3">Resumen del pedido</h2>

      <ul className="divide-y">
        {cartItems.map((item) => (
          <li key={item.id} className="py-2 flex justify-between">
            <span>{item.title}</span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </li>
        ))}
      </ul>

      <hr className="my-3" />

      <div className="flex justify-between text-gray-600">
        <span>Subtotal</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-gray-600">
        <span>Impuestos</span>
        <span>${tax.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-gray-600">
        <span>Envío</span>
        <span>{shipping === 0 ? "Gratis" : `$${shipping.toFixed(2)}`}</span>
      </div>

       <div className="flex justify-between text-gray-600">
        <span>Envío ({shippingDetails?.zone ?? "estándar"})</span>
        <span>{shipping === 0 ? "Gratis" : `$${shipping.toFixed(2)}`}</span>
      </div>

      {shippingDetails?.estimatedDays && (
        <p className="text-sm text-gray-500 text-right">
          Tiempo estimado: {shippingDetails.estimatedDays} días
        </p>
      )}

      <div className="flex justify-between font-bold text-lg border-t pt-2 mt-3">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>

      {country && (
        <p className="text-sm text-gray-500 mt-2 text-right">
          País: {country}
        </p>
      )}
    </div>
  );
}

