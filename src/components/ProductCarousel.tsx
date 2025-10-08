'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import ProductCardCarousel, { CardProps } from './ProductCardCarousel';

interface ProductCarouselProps {
  products: CardProps[];
  title: string;
  className?: string;
}

const ProductCarousel = ({ products, title, className = '' }: ProductCarouselProps) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);
  const [cardWidth, setCardWidth] = useState(250);

  const updateButtonVisibility = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const tolerance = 5;
    const maxScrollLeft = scrollWidth - clientWidth;

    setShowLeftButton(scrollLeft > tolerance);
    setShowRightButton(scrollLeft < maxScrollLeft - tolerance);
  };

  const updateCardWidth = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const containerWidth = container.clientWidth;

    if (containerWidth < 640) {
      setCardWidth(containerWidth * 0.75);
    } else if (containerWidth < 768) {
      setCardWidth(containerWidth * 0.45);
    } else if (containerWidth < 1024) {
      setCardWidth(containerWidth * 0.35);
    } else {
      setCardWidth(Math.min(320, containerWidth * 0.25));
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // añadir estilos para ocultar scrollbar (solo cliente)
    const styles = `
      .scrollbar-hide::-webkit-scrollbar { display: none; }
      .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    const styleTag = document.createElement('style');
    styleTag.innerText = styles;
    document.head.appendChild(styleTag);

    // Init
    updateCardWidth();
    updateButtonVisibility();

    const handleResize = () => {
      updateCardWidth();
      // delay to let layout settle
      setTimeout(updateButtonVisibility, 50);
    };

    const handleScroll = () => requestAnimationFrame(updateButtonVisibility);

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (styleTag.parentNode) styleTag.parentNode.removeChild(styleTag);
    };
  }, [products.length]);

  // recalcular cuando cambian los productos
  useEffect(() => {
    const t = setTimeout(() => {
      updateCardWidth();
      updateButtonVisibility();
    }, 150);
    return () => clearTimeout(t);
  }, [products]);

  if (!products || products.length === 0) return null;

  return (
    <section className={`relative mt-8 sm:mt-12 lg:mt-16 ${className}`}>
      <div className="flex items-center justify-between mb-6 sm:mb-8 px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
          {title}
        </h2>
      </div>

      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 bg-white/95 backdrop-blur-sm shadow-lg p-3 rounded-full hover:bg-white hover:scale-105 transition-all duration-200 border border-gray-200 ${
            showLeftButton ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
          aria-label="Productos anteriores"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={() => scroll('right')}
          className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 bg-white/95 backdrop-blur-sm shadow-lg p-3 rounded-full hover:bg-white hover:scale-105 transition-all duration-200 border border-gray-200 ${
            showRightButton ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
          aria-label="Siguientes productos"
        >
          <ChevronRight size={20} />
        </button>

        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto scroll-smooth pb-4 pl-14 pr-14 sm:pl-16 sm:pr-16 gap-4 sm:gap-6 lg:gap-8 snap-x snap-mandatory scrollbar-hide"
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-none snap-start transition-all duration-300 hover:scale-105 hover:shadow-xl rounded-2xl"
              style={{
                width: `${cardWidth}px`,
                minWidth: `${cardWidth}px`,
                flexShrink: 0,
              }}
            >
              <ProductCardCarousel
                id={product.id}
                title={product.title || 'Producto sin nombre'}
                description={product.description || ''}
                imageUrl={product.imageUrl || product.images?.[0]?.url || '/placeholder-image.jpg'}
                price={product.price}
                originalPrice={product.originalPrice}
                label={product.label}
                rating={product.rating ?? 0}
                reviewCount={product.reviewCount ?? 0}
                images={product.images ?? []}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-4 space-x-2 lg:hidden">
        {products.slice(0, Math.min(4, products.length)).map((_, index) => (
          <div key={index} className="w-2 h-2 rounded-full bg-gray-300 opacity-50" />
        ))}
      </div>
    </section>
  );
};

export default ProductCarousel;
