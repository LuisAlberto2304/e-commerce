import { Button } from '../components/Button'
import {ProductCard} from '../components/ProductCard'

export default function HomePage() {
  const products = [
    { title: 'Producto 1', description: 'Descripción corta', price: '10' },
    { title: 'Producto 2', description: 'Descripción corta', price: '20' },
    { title: 'Producto 3', description: 'Descripción corta', price: '30' },
  ]

  return (
    <section >
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
          />
        ))}
      </div>
      <p className="mt-6 text-text-secondary">
        ¡Explora nuestra colección completa para encontrar más productos increíbles!
      </p>
    </section>
  )
}
