// app/components/ProductReviews.tsx
'use client';

import { useState } from 'react';
import { Star, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
  verified?: boolean;
}

interface ProductReviewsProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

const ProductReviews = ({ reviews, averageRating, totalReviews }: ProductReviewsProps) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    rating: 0,
    name: '',
    email: '',
    comment: '',
  });
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para enviar la reseña
    console.log('Reseña enviada:', formData);
    alert('¡Reseña enviada! (esto es una simulación)');
    setFormData({ rating: 0, name: '', email: '', comment: '' });
    setShowForm(false);
  };

  const StarRating = ({ rating, onRate, onHover }: { 
    rating: number; 
    onRate?: (rating: number) => void;
    onHover?: (rating: number) => void;
  }) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={onRate ? "button" : "button"}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => onHover?.(star)}
          onMouseLeave={() => onHover?.(0)}
          className={`text-2xl ${
            star <= (hoverRating || rating) 
              ? "text-yellow-400 fill-current" 
              : "text-gray-300"
          } ${onRate ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
          disabled={!onRate}
        >
          ★
        </button>
      ))}
    </div>
  );

  return (
    <section className="mt-16 border-t border-gray-200 pt-10">
    <h2 className="text-3xl font-bold mb-8 text-gray-900">Opiniones de Clientes</h2>

    {/* Resumen de calificaciones */}
    <div className="grid md:grid-cols-2 gap-10 mb-10">
        {/* Promedio */}
        <div className="flex flex-col items-center justify-center">
        <div className="text-6xl font-extrabold text-emerald-600 drop-shadow-sm">
            {averageRating.toFixed(1)}
        </div>
        <StarRating rating={averageRating} />
        <div className="text-gray-600 mt-2">{totalReviews} reseñas en total</div>
        </div>

        {/* Distribución */}
        <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((stars, index) => {
            const count = reviews.filter(r => r.rating === stars).length;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

            return (
            <motion.div
                key={stars}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
            >
                <span className="text-sm w-8 font-medium">{stars}★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div
                    className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                />
                </div>
                <span className="text-sm text-gray-600 w-12">({count})</span>
            </motion.div>
            );
        })}
        </div>
    </div>

    {/* Botón */}
    <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-md hover:bg-emerald-700 transition-all mb-10"
    >
        Escribir una Opinión
    </button>

    {/* Formulario */}
    {showForm && (
        <form onSubmit={handleSubmit} className="bg-white shadow-lg p-6 rounded-xl mb-10 border border-gray-200">
        <h3 className="text-xl font-semibold mb-4 text-gray-900">Tu experiencia</h3>

        <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700">Calificación</label>
            <StarRating
            rating={formData.rating}
            onRate={(rating) => setFormData({ ...formData, rating })}
            onHover={setHoverRating}
            />
        </div>

        <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700">Comentario</label>
            <textarea
            required
            rows={4}
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Escribe tu opinión sobre este producto..."
            />
        </div>

        <div className="flex gap-4">
            <button
            type="submit"
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 shadow-sm transition-all"
            >
            Enviar
            </button>
            <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all"
            >
            Cancelar
            </button>
        </div>
        </form>
    )}

    {/* Lista de reseñas */}
    <div className="space-y-6">
  {reviews.map((review, index) => (
    <motion.div
      key={review.id}
      className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
            {review.user.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{review.user}</div>
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} />
              {review.verified && (
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  ✓ Verificado
                </span>
              )}
            </div>
          </div>
        </div>
        <span className="text-sm text-gray-500">{review.date}</span>
      </div>
      <p className="text-gray-800 leading-relaxed">{review.comment}</p>
    </motion.div>
  ))}
</div>
    </section>
  );
};

export default ProductReviews;