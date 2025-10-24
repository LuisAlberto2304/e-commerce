/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/inventory/update/route.ts
import { NextRequest, NextResponse } from 'next/server';

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
const MEDUSA_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { variantId, quantity } = await request.json();

    if (!variantId) {
      return NextResponse.json({ error: 'Variant ID is required' }, { status: 400 });
    }

    console.log('🔄 Actualizando inventario manualmente:', { variantId, quantity });

    // NOTA: En una implementación real, necesitarías la API admin de Medusa
    // Esta es una solución temporal para desarrollo
    
    return NextResponse.json({
      success: true,
      variantId,
      newQuantity: quantity,
      note: 'En producción, esto actualizaría el inventario en Medusa Admin API'
    });

  } catch (error: any) {
    console.error('Error updating inventory:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update inventory' },
      { status: 500 }
    );
  }
}