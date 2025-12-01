/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/medusa/store-products/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');

    if (!sellerId) {
      return NextResponse.json(
        { error: "Missing sellerId parameter" },
        { status: 400 }
      );
    }

    console.log('🔄 Obteniendo productos para seller:', sellerId);

    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing Authorization header" },
        { status: 401 }
      );
    }

    // Usar tu endpoint existente que ya funciona
    const sellerProductsResponse = await fetch(`${request.nextUrl.origin}/api/medusa/seller-products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
    });

    if (!sellerProductsResponse.ok) {
      const errorData = await sellerProductsResponse.json();
      return NextResponse.json(
        { 
          error: "Error obteniendo productos",
          details: errorData,
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
        const matches = productSellerId === sellerId;
        
        if (matches) {
          console.log(`✅ Producto coincide: "${product.title}"`);
        }
        
        return matches;
      });
    }

    console.log(`🎯 ${filteredProducts.length} productos filtrados para seller ${sellerId}`);

    return NextResponse.json({
      products: filteredProducts,
      count: filteredProducts.length,
      seller_id: sellerId,
      total_products: allProductsData.products?.length || 0
    }, { status: 200 });

  } catch (error: any) {
    console.error('💥 Error obteniendo productos del store:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}