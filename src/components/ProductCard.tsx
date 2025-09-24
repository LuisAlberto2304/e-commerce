'use client'
import React from "react";
import '../styles/globals.css'
import Link from "next/link";

export type CardProps = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  footerText?: string;
  price?: string;
  onAddToCart?: () => void;
  label?: string;
};

export const ProductCard: React.FC<CardProps> = ({
  id,
  title,
  description,
  imageUrl,
  footerText,
  price = "$0.00",
  label,
  onAddToCart,
}) => {
  return (
    <Link href={`/products/${id}`}>
      
      <div className={'card cursor-pointers'}>
        {label && (
        <span className="card-label">
          {label}
        </span>
      )}
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
    </Link>
  );
};
