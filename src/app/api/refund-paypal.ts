import fetch from 'node-fetch';

const PAYPAL_BASE = process.env.PAYPAL_API || 'https://api-m.sandbox.paypal.com';

interface PayPalRefundResult {
  id: string;
  provider: 'paypal';
  status: string;
}

/**
 * Obtiene un access token de PayPal
 */
async function getAccessToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization:
        'Basic ' +
        Buffer.from(
          `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
        ).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error('Error obteniendo token de PayPal: ' + text);
  }

  const data = await res.json();
  return data.access_token;
}

export async function refundPayPal(
  captureId: string | undefined,
  amount: number
): Promise<PayPalRefundResult> {
  if (!captureId) {
    throw new Error('No se proporcionó capture_id para esta orden PayPal');
  }

  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v2/payments/captures/${captureId}/refund`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: {
        value: amount.toFixed(2),
        currency_code: 'MXN', // Ajusta si necesitas otra moneda
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error('Error haciendo refund PayPal: ' + text);
  }

  const data = await res.json();

  return {
    id: data.id,
    provider: 'paypal',
    status: data.status,
  };
}
