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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);
  const [cardWidth, setCardWidth] = useState(250);

  const updateButtonVisibility = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    
    // Tolerancia más generosa para evitar falsos negativos
    const tolerance = 5; // px de tolerancia
    
    // Verificar si puede scroll a la izquierda
    setShowLeftButton(scrollLeft > tolerance);
    
    // Verificar si puede scroll a la derecha (cálculo más preciso)
    const maxScrollLeft = scrollWidth - clientWidth;
    setShowRightButton(scrollLeft < maxScrollLeft - tolerance);
    
    console.log('Scroll debug:', {
      scrollLeft,
      scrollWidth,
      clientWidth,
      maxScrollLeft,
      canScrollRight: scrollLeft < maxScrollLeft - tolerance
    });
  };

  const updateCardWidth = () => {
    if (!scrollContainerRef.current) return;

    const containerWidth = scrollContainerRef.current.clientWidth;
    
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
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8; // Usar ancho actual del contenedor
    
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Esperar a que el DOM se renderice completamente
    const timeoutId = setTimeout(() => {
      updateButtonVisibility();
      updateCardWidth();
    }, 100);

    const handleResize = () => {
      updateCardWidth();
      // Pequeño delay para asegurar que el resize ha terminado
      setTimeout(updateButtonVisibility, 50);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const handleScroll = () => {
      requestAnimationFrame(updateButtonVisibility);
    };

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [products.length]);

  // Efecto adicional para recalcular cuando cambian los productos
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateButtonVisibility();
      updateCardWidth();
    }, 200);
    
    return () => clearTimeout(timeoutId);
  }, [products]);

  if (products.length === 0) return null;

  return (
    <section className={`relative mt-8 sm:mt-12 lg:mt-16 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
          {title}
        </h2>
      </div>

      <div className="relative">
        {/* Botones de navegación */}
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

        {/* Carrusel */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto scroll-smooth pb-4 pl-14 pr-14 sm:pl-16 sm:pr-16 lg:pl-18 lg:pr-18 gap-4 sm:gap-6 lg:gap-8 snap-x snap-mandatory scrollbar-hide"
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-none snap-start transition-all duration-300 hover:scale-105 hover:shadow-xl rounded-2xl"
              style={{
                width: `${cardWidth}px`,
                minWidth: `${cardWidth}px`,
                flexShrink: 0
              }}
            >
              <ProductCardCarousel {...product} />
            </div>
          ))}
        </div>
      </div>

      {/* Indicadores de scroll para móvil */}
      <div className="flex justify-center mt-4 space-x-2 lg:hidden">
        {products.slice(0, Math.min(4, products.length)).map((_, index) => (
          <div
            key={index}
            className="w-2 h-2 rounded-full bg-gray-300 opacity-50"
          />
        ))}
      </div>
    </section>
  );
};

// CSS para ocultar scrollbar
const styles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default ProductCarousel;