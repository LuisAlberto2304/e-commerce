'use client';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { ShoppingCart, Heart } from 'lucide-react';

const ProductoDetallePage = () => {
  const params = useParams(); 
  const { id } = params;

  // 🔹 Ejemplo de datos de producto
  const producto = {
    id,
    title: `Camiseta Oversize Premium`,
    description: "Camiseta unisex oversize de algodón orgánico 100%, ideal para un look casual con un toque moderno.",
    price: "$99.00",
    imageUrl: "https://png.pngtree.com/png-vector/20240807/ourmid/pngtree-plain-pink-t-shirt-mockup-png-image_13161627.png",
    features: [
      "Algodón 100% orgánico",
      "Corte oversize",
      "Disponible en varias tallas",
      "Lavar a máquina en frío",
    ],
    reviews: [
      { user: "Usuario", rating: 5, comment: "Excelente calidad, super cómoda." },
      { user: "Usuario", rating: 4, comment: "Muy buena, aunque la talla viene un poco grande." },
    ],
    related: [
      { id: "2", title: "Camiseta Básica", price: "$59.00", imageUrl: "https://w7.pngwing.com/pngs/448/813/png-transparent-coat-outerwear-pink-m-jacket-button-jacket-pink-m-barnes-noble-rtv-pink.png" },
      { id: "3", title: "Sudadera Minimal", price: "$149.00", imageUrl: "https://e7.pngegg.com/pngimages/884/903/png-clipart-jacket-pink-m-jacket-magenta-pink-m.png" },
    ],
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 🔹 Grid principal */}
      <div className="grid md:grid-cols-2 gap-10">
        
        {/* Imagen del producto */}
        <div className="flex items-center justify-center bg-gray-100 rounded-2xl p-6">
          <img
            src={producto.imageUrl}
            alt={producto.title}
            width={500}
            height={500}
            className="rounded-lg object-cover"
          />
        </div>

        {/* Información del producto */}
        <div>
          <h1 className="text-4xl font-bold">{producto.title}</h1>
          <p className="mt-4 text-gray-600">{producto.description}</p>
          <p className="mt-6 text-3xl font-semibold text-emerald-600">{producto.price}</p>

          {/* Botones */}
          <div className="mt-6 flex gap-4">
            <button className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition">
              <ShoppingCart size={20} /> Añadir al carrito
            </button>
            <button className="flex items-center gap-2 border border-gray-300 px-6 py-3 rounded-xl hover:bg-gray-100 transition">
              <Heart size={20} /> Guardar
            </button>
          </div>

          {/* Características */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-3">Características</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {producto.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 🔹 Opiniones */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Opiniones de clientes</h2>
        <div className="space-y-4">
          {producto.reviews.map((review, i) => (
            <div key={i} className="p-4 border rounded-lg bg-gray-50">
              <p className="font-semibold">{review.user} ⭐ {review.rating}/5</p>
              <p className="text-gray-600">{review.comment}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 🔹 Productos relacionados */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">También te puede interesar</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {producto.related.map((r) => (
            <div key={r.id} className="border rounded-lg p-4 hover:shadow-lg transition">
              <img
                src={r.imageUrl}
                alt={r.title}
                width={300}
                height={300}
                className="rounded-md mb-3"
              />
              <h3 className="font-semibold">{r.title}</h3>
              <p className="text-emerald-600 font-semibold">{r.price}</p>
              <button className="mt-2 w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700">
                Ver producto
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductoDetallePage;
