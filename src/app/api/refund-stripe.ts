/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

export async function refundStripe(paymentIntentId: string, amount: number) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(amount * 100), // centavos
    });

    return {
      id: refund.id,
      provider: 'stripe',
      status: refund.status,
    };
  } catch (err: any) {
    console.error('Stripe refund error:', err);
    throw new Error(err.message);
  }
}
