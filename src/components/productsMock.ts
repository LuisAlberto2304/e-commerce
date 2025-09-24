// productsMock.ts
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
export const mockProducts: Product[] = [
  {
    id: "prod_1",
    title: "Camiseta Básica Roja",
    description: "Camiseta de algodón 100% de alta calidad, perfecta para uso diario.",
    variants: [
      {
        id: "var_1_1",
        title: "S",
        sku: "CAM-ROJA-S",
        prices: [
          { amount: 2500, currency_code: "usd" }
        ]
      },
      {
        id: "var_1_2",
        title: "M",
        sku: "CAM-ROJA-M",
        prices: [
          { amount: 2500, currency_code: "usd" }
        ]
      }
    ],
    images: [
      {
        id: "img_1",
        url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"
      }
    ]
  },
  {
    id: "prod_2",
    title: "Pantalón Jeans Azul",
    description: "Jeans clásicos de corte recto, ideales para looks casuales.",
    variants: [
      {
        id: "var_2_1",
        title: "M",
        sku: "JEANS-AZUL-M",
        prices: [
          { amount: 4500, currency_code: "usd" }
        ]
      },
      {
        id: "var_2_2",
        title: "L",
        sku: "JEANS-AZUL-L",
        prices: [
          { amount: 4500, currency_code: "usd" }
        ]
      }
    ],
    images: [
      {
        id: "img_2",
        url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400"
      }
    ]
  },
  {
    id: "prod_3",
    title: "Zapatos Deportivos Negros",
    description: "Zapatillas cómodas para running y actividades deportivas.",
    variants: [
      {
        id: "var_3_1",
        title: "40",
        sku: "ZAP-NEGRO-40",
        prices: [
          { amount: 8900, currency_code: "usd" }
        ]
      },
      {
        id: "var_3_2",
        title: "42",
        sku: "ZAP-NEGRO-42",
        prices: [
          { amount: 8900, currency_code: "usd" }
        ]
      }
    ],
    images: [
      {
        id: "img_3",
        url: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400"
      }
    ]
  },
  {
    id: "prod_4",
    title: "Sudadera con Capucha Roja",
    description: "Sudadera abrigada perfecta para climas fríos.",
    variants: [
      {
        id: "var_4_1",
        title: "L",
        sku: "SUD-ROJA-L",
        prices: [
          { amount: 5500, currency_code: "usd" }
        ]
      },
      {
        id: "var_4_2",
        title: "XL",
        sku: "SUD-ROJA-XL",
        prices: [
          { amount: 5500, currency_code: "usd" }
        ]
      }
    ],
    images: [
      {
        id: "img_4",
        url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400"
      }
    ]
  },
  {
    id: "prod_5",
    title: "Camisa Formal Azul",
    description: "Camisa de vestir para ocasiones formales y de oficina.",
    variants: [
      {
        id: "var_5_1",
        title: "M",
        sku: "CAM-AZUL-M",
        prices: [
          { amount: 3500, currency_code: "usd" }
        ]
      },
      {
        id: "var_5_2",
        title: "L",
        sku: "CAM-AZUL-L",
        prices: [
          { amount: 3500, currency_code: "usd" }
        ]
      }
    ],
    images: [
      {
        id: "img_5",
        url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400"
      }
    ]
  },
  {
    id: "prod_6",
    title: "Short Deportivo Negro",
    description: "Short ligero para entrenamiento y actividades físicas.",
    variants: [
      {
        id: "var_6_1",
        title: "S",
        sku: "SHORT-NEGRO-S",
        prices: [
          { amount: 2200, currency_code: "usd" }
        ]
      },
      {
        id: "var_6_2",
        title: "M",
        sku: "SHORT-NEGRO-M",
        prices: [
          { amount: 2200, currency_code: "usd" }
        ]
      }
    ],
    images: [
      {
        id: "img_6",
        url: "https://www.ameshop.com.mx/medias/AS-CAASH524102BK1-1.jpg?context=bWFzdGVyfGltYWdlc3w5NzEzOXxpbWFnZS9qcGVnfGFXMWhaMlZ6TDJoak15OW9PRFF2TVRJME1UWTBOamsxT1RneU16Z3VhbkJufDY1MjBmMGI3NzM0MzNhMWZhZGIwOWUyNGRmMjVjYTA5Yjc2OTNiOWUxZmIxOTVjOGFmMTFkYmVjNDMwMzIwY2I"
      }
    ]
  }
];

// Función para simular la API con filtros
export const mockFetchProducts = async (params: URLSearchParams): Promise<{products: Product[]}> => {
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let filteredProducts = [...mockProducts];
  
  // Filtrar por categoría (simulado)
  const category = params.get("collection_id");
  if (category) {
    if (category === "cat_123") { // Ropa
      filteredProducts = filteredProducts.filter(p => 
        p.title.toLowerCase().includes("camiseta") || 
        p.title.toLowerCase().includes("pantalón") ||
        p.title.toLowerCase().includes("sudadera") ||
        p.title.toLowerCase().includes("camisa") ||
        p.title.toLowerCase().includes("short")
      );
    } else if (category === "cat_456") { // Zapatos
      filteredProducts = filteredProducts.filter(p => 
        p.title.toLowerCase().includes("zapatos")
      );
    }
  }
  
  // Filtrar por precio
  const minPrice = params.get("price[gt]");
  const maxPrice = params.get("price[lt]");
  if (minPrice || maxPrice) {
    filteredProducts = filteredProducts.filter(p => {
      const price = p.variants?.[0]?.prices?.[0]?.amount || 0;
      const meetsMin = !minPrice || price >= parseInt(minPrice);
      const meetsMax = !maxPrice || price <= parseInt(maxPrice);
      return meetsMin && meetsMax;
    });
  }
  
  // Filtrar por tamaño (simulado)
  const size = params.get("variant_option.size");
  if (size) {
    filteredProducts = filteredProducts.filter(p => 
      p.variants?.some((v: { title: string; }) => v.title === size)
    );
  }
  
  // Filtrar por color (simulado)
  const color = params.get("variant_option.color");
  if (color) {
    filteredProducts = filteredProducts.filter(p => 
      p.title.toLowerCase().includes(color.toLowerCase())
    );
  }
  
  // Ordenar
  const order = params.get("order");
  if (order === "price_asc") {
    filteredProducts.sort((a, b) => {
      const priceA = a.variants?.[0]?.prices?.[0]?.amount || 0;
      const priceB = b.variants?.[0]?.prices?.[0]?.amount || 0;
      return priceA - priceB;
    });
  } else if (order === "price_desc") {
    filteredProducts.sort((a, b) => {
      const priceA = a.variants?.[0]?.prices?.[0]?.amount || 0;
      const priceB = b.variants?.[0]?.prices?.[0]?.amount || 0;
      return priceB - priceA;
    });
  }
  
  // Paginación
  const limit = parseInt(params.get("limit") || "6");
  const offset = parseInt(params.get("offset") || "0");
  const paginatedProducts = filteredProducts.slice(offset, offset + limit);
  
  return {
    products: paginatedProducts
  };
};