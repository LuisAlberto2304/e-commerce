// app/data/mockData.ts
import { CardProps } from "@/components/ProductCard";



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