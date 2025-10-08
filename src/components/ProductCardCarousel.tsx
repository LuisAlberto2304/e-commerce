/* eslint-disable @typescript-eslint/no-explicit-any */
// app/components/ProductCard.tsx
'use client'
import React from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import Image from "next/image";

export type CardProps = {
  images: any;
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  footerText?: string;
  price?: number; 
  originalPrice?: number; 
  onAddToCart?: () => void;
  label?: string;
  rating?: number;
  reviewCount?: number;
  className?: string;
};

export const ProductCardCarousel: React.FC<CardProps> = ({
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
      {/* Contenedor principal con clases actualizadas */}
      <div className={`card-carousel ${className}`}>
        
        {/* Contenedor de imagen */}
        <div className="relative w-full aspect-[1/1] overflow-hidden">
          {label && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow z-10">
              {label}
            </span>
          )}

          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              width={500}
              height={500}
              className="w-full h-full object-cover rounded-lg transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center bg-gray-200 w-full h-full rounded-lg">
              <span className="text-gray-500">Sin imagen</span>
            </div>
          )}
        </div>

        {/* Contenido con clases actualizadas */}
        <div className="card-body-carousel">
          {rating > 0 && renderStars()}
          <h2 className="card-title-carousel">{title}</h2>
          <p className="card-description-carousel">{description}</p>

          <div className="flex items-center space-x-2 mb-3">
            <span className="card-price-carousel">{price}</span>
            {originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                ${originalPrice}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            className="button-carousel button--primary-carousel w-full mt-auto"
          >
            Comprar
          </button>
        </div>

        {footerText && <div className="card-footer-carousel">{footerText}</div>}
      </div>
    </Link>
  );
};

export default ProductCardCarousel;