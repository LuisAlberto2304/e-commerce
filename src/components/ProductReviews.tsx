// app/components/ProductReviews.tsx
'use client';

import { useState, useEffect } from 'react';
import { Star, User, Loader2, LogIn, ShoppingBag, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProductReviews } from '@/hooks/useProductReviews';
import { useAuth } from '@/context/userContext';
import Link from 'next/link';

// Actualiza la interfaz Review
interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
  verified?: boolean;
  userEmail?: string;
  userId?: string;
}

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { user } = useAuth();
  const { 
    reviews, 
    averageRating, 
    totalReviews, 
    loading, 
    error, 
    addReview,
    eligibility,
    checkReviewEligibility
  } = useProductReviews(productId);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    rating: 0,
    name: '',
    email: '',
    comment: '',
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Auto-completar datos del usuario si está logueado
  useEffect(() => {
    if (user && !formData.name && !formData.email) {
      setFormData(prev => ({
        ...prev,
        name: user.displayName || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  // Verificar elegibilidad cuando el usuario cambie
  useEffect(() => {
    if (user) {
      checkReviewEligibility(user.uid);
    } else {
      checkReviewEligibility(null);
    }
  }, [user, productId]);

  // Verificar si el usuario ya reseñó este producto
  const userAlreadyReviewed = reviews.some(review => 
    review.userId === user?.uid
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar que el usuario esté autenticado
    if (!user) {
      alert('Debes iniciar sesión para escribir una reseña');
      return;
    }

    // Verificar que el usuario pueda reseñar
    if (!eligibility.canReview) {
      alert(eligibility.reason || 'No puedes reseñar este producto');
      return;
    }

    // Verificar que el usuario no haya reseñado antes
    if (userAlreadyReviewed) {
      alert('Ya has escrito una reseña para este producto');
      return;
    }
    
    if (!formData.rating || !formData.comment || !formData.name || !formData.email) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setSubmitting(true);
    
    const success = await addReview({
      rating: formData.rating,
      comment: formData.comment,
      userName: formData.name,
      userEmail: formData.email,
      userId: user.uid
    });

    if (success) {
      setFormData({ rating: 0, name: '', email: '', comment: '' });
      setShowForm(false);
      alert('¡Reseña enviada con éxito!');
    }
    
    setSubmitting(false);
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
          disabled={!onRate || submitting}
        >
          ★
        </button>
      ))}
    </div>
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Renderizar estado de elegibilidad
  const renderReviewButton = () => {
    if (!user) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-10 text-center">
          <LogIn className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-blue-900 mb-2">
            Inicia sesión para escribir una reseña
          </h3>
          <p className="text-blue-700 mb-4">
            Debes tener una cuenta y haber comprado este producto para compartir tu experiencia.
          </p>
          <Link 
            href="/login"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full shadow-md hover:bg-blue-700 transition-all"
          >
            <LogIn className="w-4 h-4" />
            Iniciar Sesión
          </Link>
        </div>
      );
    }

    if (eligibility.loading) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-10 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600">Verificando elegibilidad para reseñar...</p>
        </div>
      );
    }

    if (userAlreadyReviewed) {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-10 text-center">
          <CheckCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-amber-900 mb-2">
            Ya escribiste una reseña para este producto
          </h3>
          <p className="text-amber-700">
            Solo puedes escribir una reseña por producto. Gracias por tu opinión.
          </p>
        </div>
      );
    }

    if (!eligibility.canReview) {
      return (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-10 text-center">
          <ShoppingBag className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-orange-900 mb-2">
            Compra este producto para reseñarlo
          </h3>
          <p className="text-orange-700 mb-4">
            {eligibility.reason || 'Debes comprar este producto antes de poder escribir una reseña.'}
          </p>
        </div>
      );
    }

    return (
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-md hover:bg-emerald-700 transition-all mb-10"
        disabled={submitting}
      >
        <Star className="w-4 h-4" />
        Escribir una Opinión
      </button>
    );
  };

  if (loading) {
    return (
      <section className="mt-16 border-t border-gray-200 pt-10">
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="ml-2 text-gray-600">Cargando reseñas...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-16 border-t border-gray-200 pt-10">
      <h2 className="text-3xl font-bold mb-8 text-gray-900">Opiniones de Clientes</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

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

      {/* Botón para escribir reseña - Con lógica de autenticación y compra */}
      {renderReviewButton()}

      {/* Formulario - Solo visible para usuarios autenticados que puedan reseñar */}
      {showForm && user && eligibility.canReview && !userAlreadyReviewed && (
        <form onSubmit={handleSubmit} className="bg-white shadow-lg p-6 rounded-xl mb-10 border border-gray-200">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Tu experiencia</h3>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-700 text-sm font-medium">
                ¡Eres elegible para reseñar este producto!
              </p>
            </div>
            <p className="text-green-600 text-sm mt-1">
              <strong>Reseñando como:</strong> {user.displayName || user.email}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700">Calificación *</label>
            <StarRating
              rating={formData.rating}
              onRate={(rating) => setFormData({ ...formData, rating })}
              onHover={setHoverRating}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Nombre *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700">Comentario *</label>
            <textarea
              required
              rows={4}
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Comparte tu experiencia con este producto..."
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 shadow-sm transition-all disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Enviando...' : 'Enviar Reseña'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              disabled={submitting}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de reseñas */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Aún no hay reseñas para este producto. ¡Sé el primero en opinar!
          </div>
        ) : (
          reviews.map((review: Review, index: number) => (
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
                    {review.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{review.userName}</div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} />
                      {review.verified && (
                        <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          ✓ Comprador Verificado
                        </span>
                      )}
                      {review.userId === user?.uid && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          Tu reseña
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
              </div>
              <p className="text-gray-800 leading-relaxed">{review.comment}</p>
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
};

export default ProductReviews;