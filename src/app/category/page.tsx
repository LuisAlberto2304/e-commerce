import { ProductCard } from '../../components/ProductCard'

type Price = {
  amount: number;
  currency_code: string;
};

type ProductImage = {
  id: string;
  url: string;
};

type Variant = {
  id: string;
  title: string;
  sku?: string;
  prices?: Price[];
};

type Product = {
  id: string;
  title: string;
  description: string;
  variants?: Variant[];
  images?: ProductImage[];
};

interface PageProps {
  searchParams?: { page?: string };
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const page = parseInt(searchParams?.page || "1");
  const limit = 3;
  const offset = (page - 1) * limit;

  //Fetch para mostrar los productos de la plataforma Medusa
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/products?limit=${limit}&offset=${offset}`,
      {
        headers: {
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_API_KEY!,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(`Error fetching products: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    return (
      <>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {data.products.map((p: Product) => (
            <ProductCard
              key={p.id}
              title={p.title}
              description={p.description}
              imageUrl={p.images?.[0]?.url}
              price={
                p.variants?.[0]?.prices?.[0]
                  ? `$${p.variants[0].prices[0].amount / 100} ${p.variants[0].prices[0].currency_code.toUpperCase()}`
                  : undefined
              }
              label="Nuevo" 
            />
          ))}
        </div>

        {/* Paginación */}
        <div className="flex justify-center mt-6 gap-4">
          {page > 1 && (
            <a
              href={`?page=${page - 1}`}
              className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md 
             hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 
             transition"
            >
              Anterior
            </a>
          )}
          {data.count > page * limit && (
            <a
              href={`?page=${page + 1}`}
              className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md 
             hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 
             transition"
            >
              Siguiente
            </a>
          )}
        </div>
      </>
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return <div>Error cargando productos. Revisa la consola.</div>;
  }
}
