"use client";
import React, { useState, useEffect } from "react";
import { Button } from "./Button";

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

export const BannerCarousel: React.FC<CarouselProps> = ({
  items,
  autoPlay = true,
  interval = 10000,
}) => {
  const [current, setCurrent] = useState(0);

  // Avanza automáticamente
  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % items.length);
    }, interval);
    return () => clearInterval(timer);
  }, [items.length, autoPlay, interval]);

  const next = () => setCurrent((prev) => (prev + 1) % items.length);
  const prev = () => setCurrent((prev) => (prev - 1 + items.length) % items.length);

  const { title, subtitle, buttonText, buttonAction, imageUrl } = items[current];

  return (
  <section className="relative w-full bg-emerald-400 py-16 overflow-hidden rounded-2xl">
    <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center px-6">
      {/* Texto */}
      <div className="space-y-2 text-center md:text-left animate-fadeIn">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight text-center">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-gray-700 max-w-lg mx-auto md:mx-0 text-center">
            {subtitle}
          </p>
        )}
        {buttonText && (
          <div className="text-center">
            <Button
              variant="primary"
              label={buttonText}
              onClick={buttonAction}
            />
          </div>
        )}
      </div>

      {/* Imagen */}
      {imageUrl && (
      <div className="flex justify-center md:justify-end">
        <div className="w-80 h-64 md:h-80 overflow-hidden rounded-2xl shadow-xl ring-1 ">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    )}
    </div>

    {/* Controles */}
    <div className="absolute bottom-6 w-full flex flex-col items-center gap-3">
      {/* Botones */}
      <div className="flex gap-6">
        <button
          onClick={prev}
          aria-label="Anterior"
          className="bg-black/40 hover:bg-black/60 text-white p-3 rounded-full shadow-md transition cursor-pointer"
        >
          ◀
        </button>
        <button
          onClick={next}
          aria-label="Siguiente"
          className="bg-black/40 hover:bg-black/60 text-white p-3 rounded-full shadow-md transition cursor-pointer"
        >
          ▶
        </button>
      </div>

      {/* Indicadores */}
      <div className="flex justify-center gap-3">
        {items.map((_, i) => (
          <div
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-300 ${
              current === i ? "bg-blue-600 scale-125" : "bg-gray-300 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  </section>
);
};
