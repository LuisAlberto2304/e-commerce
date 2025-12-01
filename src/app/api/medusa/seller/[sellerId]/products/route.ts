/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/medusa/seller/[sellerId]/products/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sellerId: string }> } // Cambiado a sellerId
) {
  try {
    // IMPORTANTE: await params en Next.js App Router
    const { sellerId } = await context.params; // Cambiado a sellerId
    
    // Si necesitas mantener la compatibilidad, puedes renombrar
    const store_id = sellerId;
    
    const medusaUrl = `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/seller/products`;
    
    console.log('🔄 Fetching from Medusa para seller:', store_id);
    console.log('📡 URL:', medusaUrl);

    const response = await fetch(medusaUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MEDUSA_TOKEN}`,
        'Content-Type': 'application/json',
        ...(process.env.NEXT_PUBLIC_MEDUSA_API_KEY && {
          'x-api-key': process.env.NEXT_PUBLIC_MEDUSA_API_KEY
        })
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Medusa API error:', response.status, errorText);
      
      return NextResponse.json(
        { 
          error: `Medusa API error: ${response.status}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Products fetched successfully for seller:', store_id);
    
    // Filtrar por seller_id
    let filteredProducts = [];
    if (data.products && Array.isArray(data.products)) {
      filteredProducts = data.products.filter((product: any) => {
        // Buscar en diferentes propiedades donde podría estar el seller_id
        const productSellerId = product.store_id || 
                               product.metadata?.store_id ||
                               product.store_id ||
                               product.profile_id;
        
        console.log(`🔍 Producto "${product.title}": store_id = ${productSellerId}, buscando: ${store_id}`);
        
        return productSellerId === store_id;
      });
    }
    
    console.log(`🎯 Resultado filtrado: ${filteredProducts.length} productos para seller ${store_id}`);
    
    return NextResponse.json({
      products: filteredProducts,
      count: filteredProducts.length,
      seller_id: store_id
    });

  } catch (error) {
    console.error('💥 Proxy API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}