// app/components/ProductCard.tsx
'use client'
import React, { memo, useCallback } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import Image from "next/image";

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
  priority?: boolean; // 🔹 Nueva prop para imágenes prioritarias
};

// 🔹 Componente de estrellas memoizado
const StarRating = memo(({ rating, reviewCount }: { rating: number; reviewCount: number }) => (
  <div className="flex items-center space-x-1 mb-2">
    {[1, 2, 3, 4, 5].map(star => (
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
));

StarRating.displayName = 'StarRating';

// 🔹 Componente de imagen optimizado
const ProductImage = memo(({ 
  imageUrl, 
  title, 
  label,
  priority = false 
}: { 
  imageUrl?: string; 
  title: string; 
  label?: string;
  priority?: boolean;
}) => (
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
        width={300}  // 🔹 Reducido para mejor performance
        height={300}
        className="w-full h-full object-cover rounded-lg transition-transform hover:scale-105"
        placeholder="blur" // 🔹 Mejor experiencia de carga
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaUMkQ8TcjUgfBbJfe4b6oZIA6J3aT/2Q=="
        priority={priority} // 🔹 Solo para imágenes above the fold
        loading={priority ? "eager" : "lazy"}
      />
    ) : (
      <div 
        className="flex items-center justify-center bg-gray-100 w-full h-full rounded-lg"
        role="img"
        aria-label={`${title} - Sin imagen disponible`}
      >
        <span className="text-gray-400 text-sm">Sin imagen</span>
      </div>
    )}
  </div>
));

ProductImage.displayName = 'ProductImage';

// 🔹 Componente de precio memoizado
const PriceDisplay = memo(({ price, originalPrice }: { price?: string; originalPrice?: number }) => {
  if (!price) return null;
  
  return (
    <div className="flex items-center space-x-2 mb-3">
      <span className="card-price">{price}</span>
      {originalPrice && originalPrice > parseFloat(price.replace(/[^0-9.]/g, '')) && (
        <span className="text-sm text-gray-500 line-through">
          ${originalPrice.toFixed(2)}
        </span>
      )}
    </div>
  );
});

PriceDisplay.displayName = 'PriceDisplay';

export const ProductCard: React.FC<CardProps> = memo(({
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
  className = "",
  priority = false
}) => {

  // 🔹 Handler memoizado para evitar re-renders
  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.();
  }, [onAddToCart]);

  // 🔹 Truncar descripción muy larga
  const truncatedDescription = description.length > 100 
    ? `${description.substring(0, 100)}...` 
    : description;

  return (
    <Link 
      href={`/products/${id}`} 
      className="block w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
      prefetch={false} // 🔹 Controlar prefetch según necesidad
    >
      {/* Contenedor principal */}
      <div className={`card ${className}`}>
        
        {/* Imagen optimizada */}
        <ProductImage 
          imageUrl={imageUrl} 
          title={title} 
          label={label}
          priority={priority}
        />

        {/* Contenido */}
        <div className="card-body">
          {rating > 0 && (
            <StarRating rating={rating} reviewCount={reviewCount} />
          )}
          
          <h2 className="card-title line-clamp-2" title={title}>
            {title}
          </h2>
          
          <p className="card-description text-gray-600" title={description}>
            {truncatedDescription}
          </p>

          <PriceDisplay price={price} originalPrice={originalPrice} />

          <button
            onClick={handleAddToCart}
            className="button button--primary w-full transition-colors duration-200 hover:bg-blue-600 active:bg-blue-700"
            aria-label={`Agregar ${title} al carrito`}
          >
            Comprar
          </button>
        </div>

        {footerText && (
          <div className="card-footer text-xs text-gray-500">
            {footerText}
          </div>
        )}
      </div>
    </Link>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;