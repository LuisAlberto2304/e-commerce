'use client'
import React from "react";
import styles from './ProductCard.module.css'

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
    <div className={styles['storybook-card']}>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={title}
          className={styles['storybook-card-img']}
        />
      )}
      <div className={styles['storybook-card-body']}>
        <h2 className={styles['storybook-card-title']}>{title}</h2>
        <p className={styles['storybook-card-description']}>{description}</p>
        <p className={styles['storybook-card-price']}>{price}</p>
        <button
          onClick={onAddToCart}
          className={`${styles['storybook-button']} ${styles['storybook-button--primary']}`}
        >
          Comprar
        </button>
      </div>
      {footerText && <div className={styles['storybook-card-footer']}>{footerText}</div>}
    </div>
  );
};
