"use client";
import MetricsCard from "@/components/dashboard/MetricsCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { TrendingUp, ShoppingCart, CreditCard, Percent, Users, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useEffect } from "react";

export default function DashboardPage() {
  const metrics = useDashboardMetrics();
    useEffect(() => {
    if (!metrics.loading) {
      console.log("🎯 MÉTRICAS FINALES:", {
        totalUsers: metrics.totalUsers,
        usersWithCart: metrics.usersWithCart, 
        abandonmentRate: metrics.abandonmentRate,
        revenueBySource: metrics.revenueBySource
      });
    }
  }, [metrics.loading]);
  // Estado de loading
  if (metrics.loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="animate-pulse">
          {/* Skeleton para el título */}
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          
          {/* Skeleton para las métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          
          {/* Skeleton para la gráfica */}
          <div className="h-80 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Estado de error
  if (metrics.error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error al cargar el dashboard</h2>
          <p className="text-red-600">{metrics.error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard de E-Tianguis</h1>
        <p className="text-gray-600">Resumen general de métricas y desempeño</p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard 
          title="Tasa de Conversión" 
          value={`${metrics.conversionRate.toFixed(2)}%`}
          subtitle={`${metrics.usersWithOrders} de ${metrics.totalUsers} usuarios`}
          icon={<TrendingUp className="h-6 w-6" />} 
          color="text-green-600"
         // Podrías agregar esta prop para mostrar tendencias
        />
        
        <MetricsCard 
          title="Valor Promedio (AOV)" 
          value={`$${metrics.AOV.toFixed(2)}`}
          subtitle={`${metrics.totalOrders} órdenes procesadas`}
          icon={<CreditCard className="h-6 w-6" />} 
          color="text-blue-600"
        />
        
        <MetricsCard 
          title="Abandono de Carrito" 
          value={`${metrics.abandonmentRate.toFixed(1)}%`}
          subtitle={`Carritos activos sin compra`}
          icon={<Percent className="h-6 w-6" />} 
          color="text-red-600"
        />
        
        <MetricsCard 
          title="Ingresos Totales" 
          value={metrics.totalRevenue.toLocaleString("es-MX", { 
            style: "currency", 
            currency: "MXN",
            minimumFractionDigits: 0
          })}
          subtitle="Ingresos totales generados"
          icon={<DollarSign className="h-6 w-6" />} 
          color="text-yellow-600"
        />
      </div>

      {/* Segunda fila de métricas adicionales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricsCard 
          title="Total de Órdenes" 
          value={metrics.totalOrders.toLocaleString()}
          subtitle="Órdenes completadas"
          icon={<ShoppingCart className="h-5 w-5" />} 
          color="text-purple-600"
        />
        
        <MetricsCard 
          title="Usuarios Registrados" 
          value={metrics.totalUsers.toLocaleString()}
          subtitle="Total de usuarios en la plataforma"
          icon={<Users className="h-5 w-5" />} 
          color="text-indigo-600"
        />
        
        <MetricsCard 
          title="Tasa de Éxito" 
          value={`${(100 - metrics.abandonmentRate).toFixed(1)}%`}
          subtitle="Conversión efectiva"
          icon={<TrendingUp className="h-5 w-5" />} 
          color="text-green-600"
        />
      </div>

      {/* Gráfica de ingresos por fuente */}
      <Card className="p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Ingresos por Fuente de Pago</h2>
            <p className="text-gray-600 text-sm mt-1">
              Distribución de ingresos según método de pago
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Total: {metrics.totalRevenue.toLocaleString("es-MX", { 
              style: "currency", 
              currency: "MXN" 
            })}
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={metrics.revenueBySource} 
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="source" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={(value) => 
                value.toLocaleString("es-MX", { 
                  style: "currency", 
                  currency: "MXN",
                  minimumFractionDigits: 0
                })
              }
            />
            <Tooltip 
              formatter={(value: number) => [
                value.toLocaleString("es-MX", { 
                  style: "currency", 
                  currency: "MXN" 
                }),
                "Ingresos"
              ]}
              labelFormatter={(label) => `Fuente: ${label}`}
              contentStyle={{ 
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar 
              dataKey="value" 
              name="Ingresos (MXN)" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
        
        {/* Leyenda de estadísticas */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Fuente principal:</span>{' '}
              {metrics.revenueBySource[0]?.source || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Total de fuentes:</span>{' '}
              {metrics.revenueBySource.length}
            </div>
            <div>
              <span className="font-medium">Órdenes promedio:</span>{' '}
              {metrics.totalOrders > 0 ? (metrics.totalRevenue / metrics.totalOrders).toFixed(2) : '0'}
            </div>
          </div>
        </div>
      </Card>

      {/* Resumen general */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Resumen de Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Ratio Conversión:</span>
            <div className={`font-semibold ${metrics.conversionRate > 10 ? 'text-green-600' : metrics.conversionRate > 5 ? 'text-yellow-600' : 'text-red-600'}`}>
              {metrics.conversionRate.toFixed(2)}%
            </div>
          </div>
          <div>
            <span className="font-medium text-gray-700">Valor por Orden:</span>
            <div className="font-semibold text-gray-800">
              ${metrics.AOV.toFixed(2)}
            </div>
          </div>
          <div>
            <span className="font-medium text-gray-700">Abandono:</span>
            <div className={`font-semibold ${metrics.abandonmentRate < 20 ? 'text-green-600' : metrics.abandonmentRate < 40 ? 'text-yellow-600' : 'text-red-600'}`}>
              {metrics.abandonmentRate.toFixed(1)}%
            </div>
          </div>
          <div>
            <span className="font-medium text-gray-700">Eficiencia:</span>
            <div className={`font-semibold ${(100 - metrics.abandonmentRate) > 80 ? 'text-green-600' : (100 - metrics.abandonmentRate) > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {(100 - metrics.abandonmentRate).toFixed(1)}%
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}