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
  price?: string; 
  originalPrice?: number; 
  onAddToCart?: () => void;
  label?: string;
  rating?: number;
  reviewCount?: number;
  className?: string;
};

export const ProductCard: React.FC<CardProps> = ({
  id,
  title,
  description,
  imageUrl,
  footerText,
  price,
  originalPrice,
  label,
  rating = 0,
  reviewCount = 0,
  onAddToCart,
  className = ""
}) => {

  const renderStars = () => (
    <div className="flex items-center space-x-1 mb-2">
      {[1,2,3,4,5].map(star => (
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.();
  };

  return (
    <Link href={`/products/${id}`} className="block w-full">
      {/* Añade max-w-none para resetear el max-width */}
      <div className={`card max-w-none cursor-pointer hover:shadow-lg transition-shadow duration-300 mx-auto ${className}`}>
        
        {/* Imagen */}
        <div className="relative w-full aspect-[1/1] overflow-hidden">
          {label && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
              {label}
            </span>
          )}

          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center bg-gray-200 w-full h-full">
              <span className="text-gray-500">Sin imagen</span>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="card-body flex flex-col items-center flex-grow">
          {rating > 0 && renderStars()}
          <h2 className="card-title line-clamp-2 text-center">{title}</h2>
          <p className="card-description line-clamp-2 text-center">{description}</p>

          <div className="flex items-center space-x-2 mb-3">
            <span className="card-price text-lg font-bold text-green-600">{price}</span>
          </div>

          <button
            onClick={handleAddToCart}
            className="button button--primary w-full"
            aria-label={`Agregar ${title} al carrito`}
          >
            Comprar
          </button>
        </div>

        {footerText && <div className="card-footer text-center">{footerText}</div>}
      </div>
    </Link>
  );
};

export default ProductCard;
