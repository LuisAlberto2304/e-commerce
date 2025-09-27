import { Button } from '../components/Button'
import {ProductCard} from '../components/ProductCard'
import { BannerCarousel } from '../components/Banner'
import { div } from 'framer-motion/client';

export default function HomePage() {
  const products = [
    { title: 'Producto 1', description: 'Descripción corta', price: '$10', img: 'https://d1fufvy4xao6k9.cloudfront.net/feed/img/woman_shirt/1134135/folded.png'},
    { title: 'Producto 2', description: 'Descripción corta', price: '$20', img: 'https://d1fufvy4xao6k9.cloudfront.net/feed/img/woman_shirt/1134135/folded.png' },
    { title: 'Producto 3', description: 'Descripción corta', price: '$30', img: 'https://d1fufvy4xao6k9.cloudfront.net/feed/img/woman_shirt/1134135/folded.png' },
  ]

  const banners = [
  {
    title: "Oferta Especial",
    subtitle: "Aprovecha un 30% de descuento.",
    buttonText: "Comprar ahora",
    imageUrl: "https://png.pngtree.com/png-clipart/20231014/original/pngtree-heap-of-colorful-clothes-mountain-picture-image_13153143.png",
  },
  {
    title: "Nueva Colección",
    subtitle: "Ropa deportiva ya disponible.",
    buttonText: "Ver colección",
    imageUrl: "https://www.oxiclean.com/-/media/oxiclean/content/product-images/color-shirts.png",
  },
  {
    title: "Ropa para el trabajo",
    subtitle: "Para la chamba",
    buttonText: "Descubrir",
    imageUrl: "https://www.lakeland.com/wp-content/uploads/hi-vis-vest.png",
  },
];

  return (
    <section>

      <BannerCarousel items={banners} />

      <h2 className="text-6xl text-center font-heading text-text mb-10 mt-10">
        Productos destacados
      </h2>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Sección 1 */}
        <div className="bg-amber-50 p-6 rounded-2xl mx-0 justify-items-center"> {/* mx-0 para eliminar márgenes horizontales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 justify-items-center">
            {products.map((product) => (
              <div key={product.id} className="w-full max-w-[280px] ">
                <ProductCard
                  id={product.id}
                  title={product.title}
                  description={product.description}
                  price={product.price}
                  imageUrl={product.img}
                />
              </div>
            ))}
          </div>
        </div>

        <br />

        {/* Sección 2 */}
        <div className="bg-blue-500 p-6 rounded-2xl mx-0 justify-items-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 justify-items-center">
            {products.map((product) => (
              <div key={product.id} className="w-full max-w-[280px]">
                <ProductCard
                  id={product.id}
                  title={product.title}
                  description={product.description}
                  price={product.price}
                  imageUrl={product.img}
                />
              </div>
            ))}
          </div>
        </div>

        <br />

        {/* Sección 3 */}
        <div className="bg-red-200 p-6 rounded-2xl mx-0 justify-items-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 justify-items-center">
            {products.map((product) => (
              <div key={product.id} className="w-full max-w-[280px]">
                <ProductCard
                  id={product.id}
                  title={product.title}
                  description={product.description}
                  price={product.price}
                  imageUrl={product.img}
                />
              </div>
            ))}
          </div>
        </div>

        <br />

        {/* Sección 4 */}
        <div className="bg-fuchsia-300 p-6 rounded-2xl mx-0 justify-items-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 justify-items-center">
            {products.map((product) => (
              <div key={product.id} className="w-full max-w-[280px]">
                <ProductCard
                  id={product.id}
                  title={product.title}
                  description={product.description}
                  price={product.price}
                  imageUrl={product.img}
                />
              </div>
            ))}
          </div>
        </div>

      </div>
      <p className="mt-6 text-text-secondary text-center">
        ¡Explora nuestra colección completa para encontrar más productos increíbles!
      </p>
    </section>
  )
}