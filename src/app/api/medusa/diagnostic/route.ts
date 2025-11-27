// app/api/medusa/diagnostic/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
    const ADMIN_KEY = process.env.MEDUSA_ADMIN_API_KEY;
    const PUBLIC_KEY = process.env.NEXT_PUBLIC_MEDUSA_API_KEY;

    // 1. Verificar configuración básica
    const config = {
      hasMedusaUrl: !!MEDUSA_URL,
      hasAdminKey: !!ADMIN_KEY,
      hasPublicKey: !!PUBLIC_KEY,
      medusaUrl: MEDUSA_URL,
      adminKeyPreview: ADMIN_KEY ? `${ADMIN_KEY.substring(0, 15)}...` : 'No configurada',
      publicKeyPreview: PUBLIC_KEY ? `${PUBLIC_KEY.substring(0, 15)}...` : 'No configurada'
    };

    // 2. Probar conexión con Medusa
    let connectionTest = null;
    try {
      const healthResponse = await fetch(`${MEDUSA_URL}/health`);
      connectionTest = {
        status: healthResponse.status,
        ok: healthResponse.ok,
        text: await healthResponse.text()
      };
    } catch (error) {
      connectionTest = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // 3. Probar autenticación con Admin Key
    let authTest = null;
    try {
      const authResponse = await fetch(`${MEDUSA_URL}/admin/products?limit=1`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      authTest = {
        status: authResponse.status,
        ok: authResponse.ok,
        contentType: authResponse.headers.get('content-type')
      };
    } catch (error) {
      authTest = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    return NextResponse.json({
      config,
      connectionTest,
      authTest,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Error en diagnóstico' },
      { status: 500 }
    );
  }
}