'use client'
import React from "react";
import '../styles/globals.css'

export type CardProps = {
  title: string;
  description: string;
  imageUrl?: string;
  footerText?: string;
  price?: string;
  onAddToCart?: () => void;
};

export const ProductCard: React.FC<CardProps> = ({
  title,
  description,
  imageUrl,
  footerText,
  price = "$0.00",
  onAddToCart,
}) => {
  return (
    <div className={'card'}>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={title}
          className={'card-img'}
        />
      )}
      <div className={'card-body'}>
        <h2 className={'scard-title'}>{title}</h2>
        <p className={'card-description'}>{description}</p>
        <p className={'card-price'}>{price}</p>
        <button
          onClick={onAddToCart}
          className={`${'button'} ${'button--primary'}`}
        >
          Comprar
        </button>
      </div>
      {footerText && <div className={'card-footer'}>{footerText}</div>}
    </div>
  );
};
