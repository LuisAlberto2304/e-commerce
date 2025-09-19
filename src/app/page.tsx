import { Button } from '../components/Button'
import {ProductCard} from '../components/ProductCard'
import { Banner} from '../components/Banner'

export default function HomePage() {
  const products = [
    { title: 'Producto 1', description: 'Descripción corta', price: '$10', img: 'https://d1fufvy4xao6k9.cloudfront.net/feed/img/woman_shirt/1134135/folded.png'},
    { title: 'Producto 2', description: 'Descripción corta', price: '$20', img: 'https://d1fufvy4xao6k9.cloudfront.net/feed/img/woman_shirt/1134135/folded.png' },
    { title: 'Producto 3', description: 'Descripción corta', price: '$30', img: 'https://d1fufvy4xao6k9.cloudfront.net/feed/img/woman_shirt/1134135/folded.png' },
    { title: 'Producto 4', description: 'Descripción corta', price: '$40', img: 'https://d1fufvy4xao6k9.cloudfront.net/feed/img/woman_shirt/1134135/folded.png' },
  ]

  return (
    <section >

      <Banner
        title="Ofertas en tendencia"
        subtitle="Hasta 50% de descuento en productos seleccionados"
        buttonText="Ver ofertas"
        imageUrl="/images/producto.png"
      />

      <h2 className="text-xl font-heading text-text mb-4">
        Nuestros productos destacados
      </h2>

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
      <p className="mt-6 text-text-secondary">
        ¡Explora nuestra colección completa para encontrar más productos increíbles!
      </p>
    </section>
  )
}
