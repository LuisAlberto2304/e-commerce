/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import medusaClient from '@/app/lib/medusa-client';

export async function POST(request: NextRequest) {
  try {
    const cart = await medusaClient.carts.create();
    
    return NextResponse.json({ 
      success: true, 
      cart: cart.cart 
    });
  } catch (error: any) {
    console.error('Error creating Medusa cart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create cart' },
      { status: 500 }
    );
  }
}