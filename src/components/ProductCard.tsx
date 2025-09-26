// app/components/ProductCard.tsx
'use client'
import React from "react";
import Link from "next/link";
import { Star } from "lucide-react";

export type CardProps = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  footerText?: string;
  price?: number; // Cambiado a number para calcular formato
  originalPrice?: number; // Para mostrar descuentos
  onAddToCart?: () => void;
  label?: string;
  rating?: number; // Nueva prop para rating
  reviewCount?: number; // Nueva prop para contar reseñas
  className?: string; // Para estilos adicionales
};

export const ProductCard: React.FC<CardProps> = ({
  id,
  title,
  description,
  imageUrl,
  footerText,
  price = 0,
  originalPrice,
  label,
  rating = 0,
  reviewCount = 0,
  onAddToCart,
  className = ""
}) => {
  
  // Función para formatear precio
  const formatPrice = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  // Función para renderizar estrellas de rating
  const renderStars = () => {
    return (
      <div className="flex items-center space-x-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"}
          />
        ))}
        {reviewCount > 0 && (
          <span className="text-xs text-gray-600 ml-1">({reviewCount})</span>
        )}
      </div>
    );
  };

  // Calcular descuento si existe originalPrice
  const discount = originalPrice && originalPrice > price 
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevenir navegación al Link
    e.stopPropagation();
    onAddToCart?.();
  };

  return (
    <Link href={`/products/${id}`} className="block">
      <div className={`card cursor-pointer hover:shadow-lg transition-shadow duration-300 ${className}`}>
        {/* Etiqueta y descuento */}
        <div className="relative">
          {label && (
            <span className="card-label">
              {label}
            </span>
          )}
          {discount > 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              -{discount}%
            </span>
          )}
          
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="card-img"
            />
          ) : (
            <div className="card-img bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">Sin imagen</span>
            </div>
          )}
        </div>

        <div className="card-body">
          {/* Rating */}
          {rating > 0 && renderStars()}
          
          <h2 className="card-title line-clamp-2">{title}</h2>
          <p className="card-description line-clamp-2">{description}</p>
          
          {/* Precio */}
          <div className="flex items-center space-x-2 mb-3">
            <span className="card-price text-lg font-bold">
              {formatPrice(price)}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>

          {/* Botón de compra */}
          <button
            onClick={handleAddToCart}
            className="button button--primary w-full"
          >
            Comprar
          </button>
        </div>
        
        {footerText && (
          <div className="card-footer text-center">
            {footerText}
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;