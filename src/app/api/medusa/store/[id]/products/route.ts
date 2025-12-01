/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/medusa/store/[id]/products/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params; // Este es el Medusa Seller ID
    const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;

    if (!MEDUSA_URL) {
      return NextResponse.json(
        { error: "Missing Medusa configuration" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing Authorization header" },
        { status: 401 }
      );
    }

    console.log('🔄 Obteniendo productos para Medusa Seller ID:', id);

    // Usar el endpoint existente que funciona
    const sellerProductsResponse = await fetch(`${MEDUSA_URL}/seller/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
    });

    if (!sellerProductsResponse.ok) {
      const errorText = await sellerProductsResponse.text();
      console.error('❌ Error obteniendo productos:', sellerProductsResponse.status, errorText);
      return NextResponse.json(
        { 
          error: "Error obteniendo productos de Medusa",
          status: sellerProductsResponse.status 
        },
        { status: sellerProductsResponse.status }
      );
    }

    const allProductsData = await sellerProductsResponse.json();
    
    console.log(`📦 Total de productos obtenidos: ${allProductsData.products?.length || 0}`);

    // Filtrar productos por metadata.seller_id
    let filteredProducts = [];
    if (allProductsData.products && Array.isArray(allProductsData.products)) {
      filteredProducts = allProductsData.products.filter((product: any) => {
        const productSellerId = product.metadata?.seller_id;
        const matches = productSellerId === id;
        
        if (matches) {
          console.log(`✅ Producto coincide: "${product.title}" (${product.status})`);
        }
        
        return matches;
      });
    }

    console.log(`🎯 ${filteredProducts.length} productos encontrados para Medusa Seller ID: ${id}`);

    // Solo productos publicados
    const publishedProducts = filteredProducts.filter((product: any) => 
      product.status === 'published'
    );

    return NextResponse.json({
      products: publishedProducts,
      count: publishedProducts.length,
      seller_id: id,
      total_products: allProductsData.products?.length || 0,
      store_info: {
        medusa_seller_id: id
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('💥 Error obteniendo productos del store:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}