"use client";
import React, { memo, useCallback } from "react";
import Image from "next/image";
import { Button } from "./Button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type BannerProps = {
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonAction?: () => void;
  imageUrl?: string;
};

type CarouselProps = {
  items: BannerProps[];
  autoPlay?: boolean;
  interval?: number;
};

// 🔹 Componente de imagen optimizado CORREGIDO
const OptimizedBannerImage = memo(({ 
  imageUrl, 
  title 
}: { 
  imageUrl: string; 
  title: string 
}) => (
  <div className="flex justify-center md:justify-end">
    <div className="w-80 h-64 md:h-80 overflow-hidden rounded-2xl shadow-xl ring-1 ring-gray-200/50 relative">
      <Image
        src={imageUrl}
        alt={title}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover"
        priority={true}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaUMkQ8TcjUgfBbJfe4b6oZIA6J3aT/2Q=="
        quality={85}
      />
    </div>
  </div>
));

OptimizedBannerImage.displayName = 'OptimizedBannerImage';

// 🔹 Componente de indicadores
const CarouselIndicators = memo(({ 
  count, 
  current, 
  onSelect 
}: { 
  count: number; 
  current: number; 
  onSelect: (index: number) => void 
}) => (
  <div className="flex justify-center gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <button
        key={i}
        onClick={() => onSelect(i)}
        aria-label={`Ir al slide ${i + 1}`}
        className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-300 ${
          current === i 
            ? "bg-blue-600 scale-125" 
            : "bg-gray-300 hover:bg-gray-400"
        }`}
      />
    ))}
  </div>
));

CarouselIndicators.displayName = 'CarouselIndicators';

// 🔹 Componente de controles
const CarouselControls = memo(({ 
  onPrev, 
  onNext 
}: { 
  onPrev: () => void; 
  onNext: () => void; 
}) => (
  <div className="flex gap-6">
    <button
      onClick={onPrev}
      aria-label="Slide anterior"
      className="bg-black/40 hover:bg-black/60 text-white p-3 rounded-full shadow-md transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95"
    >
      <ChevronLeft size={20} />
    </button>
    <button
      onClick={onNext}
      aria-label="Slide siguiente"
      className="bg-black/40 hover:bg-black/60 text-white p-3 rounded-full shadow-md transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95"
    >
      <ChevronRight size={20} />
    </button>
  </div>
));

CarouselControls.displayName = 'CarouselControls';

// 🔹 Hook useCarousel inline (si no tienes la carpeta hooks)
const useCarousel = (itemCount: number, autoPlay: boolean = true, interval: number = 5000) => {
  const [current, setCurrent] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  const next = useCallback(() => {
    if (itemCount === 0) return;
    setCurrent((prev) => (prev + 1) % itemCount);
  }, [itemCount]);

  const prev = useCallback(() => {
    if (itemCount === 0) return;
    setCurrent((prev) => (prev - 1 + itemCount) % itemCount);
  }, [itemCount]);

  const goToSlide = useCallback((index: number) => {
    if (itemCount === 0) return;
    setCurrent(index % itemCount);
  }, [itemCount]);

  // Auto-play
  React.useEffect(() => {
    if (!autoPlay || isPaused || itemCount <= 1) return;

    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, isPaused, next, itemCount]);

  return {
    current,
    isPaused,
    setIsPaused,
    next,
    prev,
    goToSlide
  };
};

export const BannerCarousel: React.FC<CarouselProps> = memo(({
  items,
  autoPlay = true,
  interval = 5000,
}) => {
  const { current, setIsPaused, next, prev, goToSlide } = useCarousel(
    items.length, 
    autoPlay, 
    interval
  );

  const handleMouseEnter = useCallback(() => setIsPaused(true), []);
  const handleMouseLeave = useCallback(() => setIsPaused(false), []);

  if (items.length === 0) return null;

  const { title, subtitle, buttonText, buttonAction, imageUrl } = items[current];

  return (
    <section 
      className="relative w-full bg-emerald-400 py-16 overflow-hidden rounded-2xl"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="region"
      aria-label="Carrusel de banners"
    >
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center px-6">
        {/* Contenido de texto */}
        <div className="space-y-4 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight text-center">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg md:text-xl text-gray-700 max-w-lg mx-auto md:mx-0 text-center leading-relaxed">
              {subtitle}
            </p>
          )}
          {buttonText && (
            <div className="text-center pt-2">
              {/* 🔹 SOLUCIÓN: Usar wrapper div en lugar de className en Button */}
              <div className="transform hover:scale-105 transition-transform duration-200 inline-block">
                <Button
                  variant="primary"
                  label={buttonText}
                  onClick={buttonAction}
                />
              </div>
            </div>
          )}
        </div>

        {/* Imagen optimizada */}
        {imageUrl && (
          <OptimizedBannerImage imageUrl={imageUrl} title={title} />
        )}
      </div>

      {items.length > 1 && (
        <div className="absolute bottom-6 w-full flex flex-col items-center gap-4">
          <CarouselControls onPrev={prev} onNext={next} />
          <CarouselIndicators 
            count={items.length} 
            current={current} 
            onSelect={goToSlide} 
          />
        </div>
      )}
    </section>
  );
});

BannerCarousel.displayName = 'BannerCarousel';

export default BannerCarousel;