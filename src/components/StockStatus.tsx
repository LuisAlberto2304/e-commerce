// app/components/StockStatus.tsx
'use client';

interface StockStatusProps {
  quantity: number;
  className?: string;
}

const StockStatus = ({ quantity, className = '' }: StockStatusProps) => {
  const getStockInfo = () => {
    if (quantity > 10) {
      return {
        text: "En stock",
        color: "text-green-600",
        bg: "bg-green-100",
        dot: "bg-green-500"
      };
    }
    if (quantity > 0) {
      return {
        text: "Últimas unidades",
        color: "text-orange-600",
        bg: "bg-orange-100",
        dot: "bg-orange-500"
      };
    }
    return {
      text: "Agotado",
      color: "text-red-600",
      bg: "bg-red-100",
      dot: "bg-red-500"
    };
  };

  const stockInfo = getStockInfo();

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${stockInfo.bg} ${stockInfo.color} ${className}`}>
      <div className={`w-2 h-2 rounded-full ${stockInfo.dot}`}></div>
      <span>{stockInfo.text}</span>
      {quantity > 0 && (
        <span className="text-xs opacity-75">({quantity} disponibles)</span>
      )}
    </div>
  );
};

export default StockStatus;