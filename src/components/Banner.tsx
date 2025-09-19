"use client";
import React from "react";

type BannerProps = {
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonAction?: () => void;
  imageUrl?: string;
};

export const Banner: React.FC<BannerProps> = ({
  title,
  subtitle,
  buttonText = "Comprar ahora",
  buttonAction,
  imageUrl,
}) => {
  return (
    <section className="banner">
        <div className="banner-container">
            <div>
            <h1 className="banner-title">{title}</h1>
            <p className="banner-subtitle">{subtitle}</p>
            <button className="button button--primary button--large">{buttonText}</button>
            </div>

            {imageUrl && (
            <div className="flex justify-center md:justify-end">
                <img src={imageUrl} alt={title} className="banner-img" />
            </div>
            )}
        </div>
    </section>
  );
};
