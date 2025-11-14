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
  title,
  className
}: { 
  imageUrl: string; 
  title: string;
  className: string
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
            ? "bg-brown scale-125" 
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
      className="relative mx-auto mt-6 w-[90%] md:w-[70%] bg-white py-20 overflow-hidden rounded-3xl shadow-lg border border-gray-200"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="region"
      aria-label="Carrusel de banners"
    >
      {/* Fondo decorativo con blur */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-100px] left-[-100px] w-72 h-72 bg-white rounded-full blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-[-100px] right-[-100px] w-72 h-72 bg-white rounded-full blur-3xl opacity-30 animate-pulse delay-200" />
      </div>

      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center px-6 md:px-10">
        {/* Texto principal */}
        <div className="space-y-6 text-center md:text-left">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            <span className="bg-gradient-to-r bg-black bg-clip-text text-transparent">
              {title}
            </span>
          </h1>

          {subtitle && (
            <p className="text-lg md:text-xl text-gray-600 max-w-md mx-auto md:mx-0 leading-relaxed">
              {subtitle}
            </p>
          )}

          {buttonText && (
            <div className="pt-4">
              <div className="inline-block transform hover:scale-105 transition-transform duration-200">
                <Button
                  variant="primary"
                  label={buttonText}
                  onClick={buttonAction}
                />
              </div>
            </div>
          )}
        </div>

        {/* Imagen con efecto flotante */}
        {imageUrl && (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
            <OptimizedBannerImage
              imageUrl={imageUrl}
              title={title}
              className="rounded-3xl shadow-xl transform transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        )}
      </div>

      {/* Controles del carrusel */}
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