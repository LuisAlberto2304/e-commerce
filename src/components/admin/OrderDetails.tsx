/* eslint-disable @typescript-eslint/no-explicit-any */
// components/admin/OrderDetails.tsx
import { Order } from '@/app/types/order';
import { Timestamp } from 'firebase/firestore';

interface OrderDetailsProps {
  order: Order | null;
  onClose: () => void;
}

const OrderDetails = ({ order, onClose }: OrderDetailsProps) => {
  if (!order) return null;

  const formatDate = (timestamp: any): string => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return new Date(timestamp).toLocaleString('es-ES');
  };

  const getStatusConfig = (status: string) => {
    const config = {
      paid: { 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
        label: 'Pagado',
        icon: '✓'
      },
      pending: { 
        color: 'bg-amber-50 text-amber-700 border-amber-200', 
        label: 'Pendiente',
        icon: '⏳'
      },
      refunded: { 
        color: 'bg-blue-50 text-blue-700 border-blue-200', 
        label: 'Reembolsado',
        icon: '↩️'
      },
      cancelled: { 
        color: 'bg-rose-50 text-rose-700 border-rose-200', 
        label: 'Cancelado',
        icon: '✕'
      }
    };
    return config[status as keyof typeof config] || { 
      color: 'bg-gray-50 text-gray-700 border-gray-200', 
      label: status,
      icon: '📦'
    };
  };

  const statusConfig = getStatusConfig(order.status);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Orden #{order.id?.substring(0, 8)}</h2>
                <p className="text-gray-600 mt-1">Creada el {formatDate(order.createdAt)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          {/* Tarjetas de información */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Estado de la orden */}
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${statusConfig.color.replace('bg-', 'bg-').split(' ')[0]}`}>
                  <span className="text-sm font-medium">{statusConfig.icon}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Estado</h3>
                  <p className="text-sm text-gray-600">Estado actual</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>

            {/* Información de pago */}
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 6v1m0-1v1" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Pago</h3>
                  <p className="text-sm text-gray-600">Método de pago</p>
                </div>
              </div>
              <p className="text-sm text-gray-900 capitalize">{order.payment_method?.replace('_', ' ')}</p>
              {order.paypal_capture_id && (
                <p className="text-xs text-gray-500 mt-1 font-mono">ID: {order.paypal_capture_id}</p>
              )}
            </div>

            {/* Total */}
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 6v1m0-1v1" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Total</h3>
                  <p className="text-sm text-gray-600">Monto total</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">${order.total}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Información del cliente */}
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Información del Cliente
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Nombre completo</p>
                      <p className="font-medium text-gray-900">{order?.address?.first_name} {order?.address?.last_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{order.email}</p>
                    </div>
                  </div>
                  {order?.address?.phone && (
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Teléfono</p>
                        <p className="font-medium text-gray-900">{order?.address?.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dirección de envío */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Dirección de Envío
                </h3>
                <div className="space-y-2 text-gray-700">
                  <p className="font-medium">{order?.address?.address_1}</p>
                  <p>{order?.address?.city}, {order?.address?.province}</p>
                  <p className="text-gray-600">Código postal: {order?.address?.postal_code}</p>
                </div>
              </div>
            </div>

            {/* Productos y resumen */}
            <div className="space-y-6">
              {/* Productos */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Productos ({order.items?.length || 0})
                </h3>
                <div className="space-y-4">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{item.title}</h4>
                        {item.variantDescription && (
                          <p className="text-sm text-gray-600 mt-1">{item.variantDescription}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span>Cantidad: {item.quantity}</span>
                          <span>•</span>
                          <span>${item.price} c/u</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen del pedido */}
              <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Pedido</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${(order.total - order.shippingCost).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Envío ({order.shippingMethod})</span>
                    <span className="font-medium">${order.shippingCost}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-gray-900">${order.total}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;