// app/data/mockData.ts
import { CardProps } from "@/components/ProductCard";

export const mockRecommendedProducts: CardProps[] = [
  {
    id: 'prod_1',
    title: 'Camiseta Deportiva Premium',
    description: 'Camiseta técnica para deporte de alto rendimiento con tecnología de secado rápido.',
    imageUrl: 'https://adivor.com.mx/wp-content/uploads/2024/10/placeholder-1-1.png',
    price: 2999, // $29.99
    originalPrice: 3999, // $39.99
    rating: 4.5,
    reviewCount: 24,
    label: 'Nuevo'
  },
  {
    id: 'prod_2', 
    title: 'Pantalón Deportivo Tech',
    description: 'Pantalón deportivo con tejido elástico y bolsillos seguros.',
    imageUrl: 'https://adivor.com.mx/wp-content/uploads/2024/10/placeholder-1-1.png',
    price: 4599,
    rating: 4.2,
    reviewCount: 18,
    label: 'Popular'
  },
  {
    id: 'prod_3',
    title: 'Zapatillas Running Elite',
    description: 'Zapatillas profesionales para running con amortiguación avanzada.',
    imageUrl: 'https://adivor.com.mx/wp-content/uploads/2024/10/placeholder-1-1.png',
    price: 8999,
    originalPrice: 9999,
    rating: 4.8,
    reviewCount: 32
  },
  {
    id: 'prod_4',
    title: 'Chaqueta Impermeable',
    description: 'Chaqueta resistente al agua ideal para actividades al aire libre.',
    imageUrl: 'https://adivor.com.mx/wp-content/uploads/2024/10/placeholder-1-1.png',
    price: 6599,
    rating: 4.3,
    reviewCount: 15
  },
  {
    id: 'prod_5',
    title: 'Gorra Deportiva',
    description: 'Gorra ajustable con protección UV y diseño ergonómico.',
    imageUrl: 'https://adivor.com.mx/wp-content/uploads/2024/10/placeholder-1-1.png',
    price: 1599,
    rating: 4.0,
    reviewCount: 8,
    label: 'Oferta'
  },
  {
    id: 'prod_6',
    title: 'Mochila Deportiva',
    description: 'Mochila espaciosa con compartimentos especializados para equipo deportivo.',
    imageUrl: 'https://adivor.com.mx/wp-content/uploads/2024/10/placeholder-1-1.png',
    price: 3499,
    originalPrice: 4299,
    rating: 4.6,
    reviewCount: 21
  }
];

export const mockReviews = [
  {
    id: 'rev_1',
    user: 'María González',
    rating: 5,
    comment: '¡Excelente producto! La calidad superó mis expectativas. Muy cómodo y duradero.',
    date: '2025-01-15',
    verified: true
  },
  {
    id: 'rev_2',
    user: 'Carlos Rodríguez',
    rating: 4,
    comment: 'Buen producto en general. El color es exacto al de la foto. La talla me quedó perfecta.',
    date: '2025-01-10',
    verified: true
  },
  {
    id: 'rev_3', 
    user: 'Ana Martínez',
    rating: 3,
    comment: 'Es aceptable por el precio. La tela podría ser de mejor calidad pero cumple su función.',
    date: '2025-01-05',
    verified: false
  }
];