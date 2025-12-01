// app/components/ProductCard.tsx
'use client'
import React, { memo, useCallback } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useProductCardRating } from "@/hooks/useProductCardRating";

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
  rating?: number; // 🔹 Rating individual (puede venir del producto)
  reviewCount?: number; // 🔹 Contador de reviews individual
  className?: string;
  priority?: boolean; // 🔹 Nueva prop para imágenes prioritarias
  variants?: number;
  showRating?: boolean; // 🔹 Controla si se muestra el rating
  useFirebaseStats?: boolean; // 🔹 Si debe obtener stats desde Firebase
};

// 🔹 Componente de estrellas CORREGIDO
const StarRating = memo(({ 
  rating, 
  reviewCount,
  showReviewCount = true,
  showAverage = true 
}: { 
  rating: number;
  reviewCount: number;
  showReviewCount?: boolean;
  showAverage?: boolean;
}) => {
  // Validar que el rating esté entre 0-5
  const normalizedRating = Math.min(Math.max(rating, 0), 5);
  const roundedRating = Math.round(normalizedRating * 2) / 2; // Para medias estrellas
  
  return (
    <div className="flex items-center space-x-2 mb-2">
      {/* Estrellas */}
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            size={14}
            className={
              star <= roundedRating 
                ? "text-yellow-400 fill-current" 
                : star - 0.5 <= roundedRating 
                ? "text-yellow-400 fill-current opacity-80" 
                : "text-gray-300"
            }
          />
        ))}
      </div>
      
      {/* Información de rating */}
      <div className="flex items-center space-x-1">
        {showAverage && normalizedRating > 0 && (
          <span className="text-sm font-medium text-gray-900">
            {normalizedRating.toFixed(1)}
          </span>
        )}
        {showReviewCount && reviewCount > 0 && (
          <span className="text-xs text-gray-600">
            ({reviewCount})
          </span>
        )}
        
        {/* 🔹 Mostrar mensaje si no hay reviews */}
        {showReviewCount && reviewCount === 0 && (
          <span className="text-xs text-gray-400">
            Sin reseñas
          </span>
        )}
      </div>
    </div>
  );
});

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
        placeholder="blur" 
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaUMkQ8TcjUgfBbJfe4b6oZIA6J3aT/2Q=="
        loading={priority ? "eager" : "lazy"}
      />
    ) : (
      <div 
        className="flex items-center justify-center bg-white w-full h-full rounded-lg"
        role="img"
        aria-label={`${title} - Sin imagen disponible`}
      >
        <span className="text-gray-400 text-sm">Sin imagen</span>
      </div>
    )}
  </div>
));

ProductImage.displayName = 'ProductImage';

// 🔹 Componente de precio memoizado - VERSIÓN MEJORADA
const PriceDisplay = memo(({ price, originalPrice }: { price?: string; originalPrice?: number }) => {

  
  if (!price) {
    return (
      <div className="mb-3">
        <span className="text-gray-500 text-sm">Precio no disponible</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center space-x-2 mb-3">
      <span className="card-price font-semibold text-lg text-gray-900">
        {price}
      </span>
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
  priority = false,
  variants,
  showRating = true, // 🔹 Nueva prop para controlar visibilidad
  useFirebaseStats = false, // 🔹 Nueva prop para usar Firebase stats
}) => {

  const { addToCart } = useCart();
  const { 
    rating: firebaseRating, 
    reviewCount: firebaseReviewCount,
    loading: ratingLoading 
  } = useProductCardRating(id, useFirebaseStats);

  // 🔹 Determinar qué datos de rating usar
  const displayRating = useFirebaseStats ? firebaseRating : rating;
  const displayReviewCount = useFirebaseStats ? firebaseReviewCount : reviewCount;

  // 🔹 Handler memoizado para evitar re-renders
    const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Lógica de carrito local
    addToCart({
      id,
      title,
      price: parseFloat(price?.replace(/[^0-9.]/g, "") || "0"),
      image: imageUrl || "",
      quantity: 1
    });

    // Si deseas conservar el callback externo, puedes dejarlo también
    onAddToCart?.();
  }, [addToCart, id, title, price, imageUrl, onAddToCart]);


  // 🔹 Truncar descripción muy larga
  const truncatedDescription = description.length > 100 
    ? `${description.substring(0, 100)}...` 
    : description;

    return (
    <Link
      href={`/products/${id}`}
      className="group block w-full focus:outline-none"
      prefetch={false}
    >
      <div
        className={`relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 ${className}`}
      >
        {/* Imagen */}
        <div className="relative overflow-hidden">
          <ProductImage imageUrl={imageUrl} title={title} label={label} priority={priority} />
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Contenido */}
        <div className="p-4 flex flex-col justify-between min-h-[200px]">
          {/* 🔹 Mostrar rating solo si showRating es true y hay datos */}
          {showRating && (
            <>
              {ratingLoading && useFirebaseStats ? (
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex space-x-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={14}
                        className="text-gray-200"
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">Cargando...</span>
                </div>
              ) : (
                <StarRating 
                  rating={displayRating} 
                  reviewCount={displayReviewCount} 
                  showReviewCount={true}
                  showAverage={true}
                />
              )}
            </>
          )}

          <h2 className="text-lg text-center font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-brown transition-colors">
            {title}
          </h2>

          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{truncatedDescription}</p>

          <div className="flex text-center items-center justify-between mt-auto">
            <PriceDisplay price={price} originalPrice={originalPrice} />
          </div>
        </div>
      </div>
    </Link>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;