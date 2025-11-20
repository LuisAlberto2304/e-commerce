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

  return (
    <Link href={`/products/${id}`} className="block w-full group">
      <div
        className={`rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 min-h-[430px] flex flex-col ${className}`}
      >
        
        {/* Imagen */}
        <div className="relative w-full aspect-[1/1] overflow-hidden rounded-t-2xl bg-gray-50">
          {label && (
            <span className="absolute top-3 left-3 bg-gray-900 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md">
              {label}
            </span>
          )}

          {imageUrl ? (
            <div className="relative w-full h-full">
              <Image
                src={imageUrl}
                alt={title}
                width={500}
                height={500}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-400">
              📷
            </div>
          )}
        </div>

        {/* Contenido */}
         <div className="p-4 flex flex-col">
          {/* Rating */}
          {rating > 0 && (
            <div className="flex items-center mb-1">
              {renderStars()}
              <span className="text-xs text-gray-500 ml-1">({rating})</span>
            </div>
          )}

          {/* Título */}
          <h2 className="text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-brown transition-colors">
            {title}
          </h2>

          {/* Descripción sutil */}
          <p className="text-gray-500 text-sm mt-1 mb-3 line-clamp-2">
            {description}
          </p>

          {/* Precios */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold text-gray-900">{price}</span>
              {originalPrice && (
                <span className="text-sm text-gray-400 line-through">
                  ${originalPrice}
                </span>
              )}
            </div>
          </div>

          {/* Envío */}
          <span className="inline-block text-xs bg-blue-50 text-brown px-2 py-1 rounded-full">
            Envío gratis
          </span>
        </div>

        {/* Footer */}
        {footerText && (
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 rounded-b-2xl mt-auto">
            <span className="text-xs text-gray-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V5z"
                  clipRule="evenodd"
                />
              </svg>
              {footerText}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCardCarousel;