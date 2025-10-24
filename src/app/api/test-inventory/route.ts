/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/test-inventory/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!;
    const ADMIN_TOKEN = process.env.NEXT_PUBLIC_MEDUSA_API_KEY!;
    
    // Intentar obtener una variante
    const response = await axios.get(
      `${MEDUSA_URL}/admin/variants/variant_01K5HT9AX4GGPWMKYNF29ARM0A`,
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
        },
      }
    );
    
    return NextResponse.json({ 
      success: true, 
      message: '✅ API Key funciona correctamente',
      variant: response.data 
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.response?.data || error.message,
      message: '❌ API Key NO funciona'
    }, { status: 500 });
  }
}