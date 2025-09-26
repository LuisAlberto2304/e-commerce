'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import ProductCard, { CardProps } from './ProductCard';

interface ProductCarouselProps {
  products: CardProps[];
  title: string;
  className?: string;
}

const ProductCarousel = ({ products, title, className = '' }: ProductCarouselProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = 320; // ajusta al ancho de tu ProductCard
    const newScrollLeft =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
  };

  if (products.length === 0) return null;

  return (
    <section className={`relative mt-16 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
          {title}
        </h2>
      </div>

      {/* Botones flotantes */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md p-3 rounded-full hover:bg-gray-100 hover:scale-105 transition-all"
        aria-label="Productos anteriores"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md p-3 rounded-full hover:bg-gray-100 hover:scale-105 transition-all"
        aria-label="Siguientes productos"
      >
        <ChevronRight size={22} />
      </button>

      {/* Carrusel */}
      <div
        ref={scrollContainerRef}
        className="flex space-x-6 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="flex-none w-72 snap-start transition-transform duration-300 hover:scale-105 hover:shadow-lg rounded-2xl"
          >
            <ProductCard {...product} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductCarousel;
