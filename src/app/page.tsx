import { Button } from '../components/Button'
import {ProductCard} from '../components/ProductCard'
import { BannerCarousel } from '../components/Banner'

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
    <section >

      <BannerCarousel items={banners} />

      <h2 className="text-6xl text-center font-heading text-text mb-10 mt-10">
        Productos destacados
      </h2>

      <div className="bg-amber-50 p-10 rounded-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.title}
              title={product.title}
              description={product.description}
              price={product.price}
              imageUrl={product.img}
            />
          ))}
        </div>
      </div>
      <br />
      <div className="bg-blue-500 p-10 rounded-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.title}
              title={product.title}
              description={product.description}
              price={product.price}
              imageUrl={product.img}
            />
          ))}
        </div>
      </div>
      <br />
      <div className="bg-red-200 p-10 rounded-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.title}
              title={product.title}
              description={product.description}
              price={product.price}
              imageUrl={product.img}
            />
          ))}
        </div>
      </div>
      <br />
      <div className="bg-fuchsia-300 p-10 rounded-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.title}
              title={product.title}
              description={product.description}
              price={product.price}
              imageUrl={product.img}
            />
          ))}
        </div>
      </div>
      <p className="mt-6 text-text-secondary text-center">
        ¡Explora nuestra colección completa para encontrar más productos increíbles!
      </p>
    </section>
  )
}
