/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import medusaClient from '@/app/lib/medusa-client';

export async function POST(request: NextRequest) {
  try {
    console.log('🛒 Creando carrito en Medusa...');
    
    const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
    const medusaApiKey = process.env.NEXT_PUBLIC_MEDUSA_API_KEY;
    
    if (!medusaUrl) {
      console.error('❌ NEXT_PUBLIC_MEDUSA_BACKEND_URL no está configurado');
      return NextResponse.json(
        { 
          success: false,
          error: 'Medusa backend URL not configured' 
        },
        { status: 500 }
      );
    }

    if (!medusaApiKey) {
      console.error('❌ NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY no está configurado');
      return NextResponse.json(
        { 
          success: false,
          error: 'Medusa API key not configured' 
        },
        { status: 500 }
      );
    }

    console.log('🔗 Conectando a Medusa...');
    
    const cart = await medusaClient.carts.create();
    
    console.log('✅ Carrito creado exitosamente:', cart.cart?.id);
    
    return NextResponse.json({ 
      success: true, 
      cart: cart.cart 
    });
  } catch (error: any) {
    console.error('❌ Error creating Medusa cart:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to create cart',
        details: 'Check Medusa API key and URL configuration'
      },
      { status: 500 }
    );
  }
}