// utils/cart.ts

interface User {
  email?: string;
}

export const createCartWithAuth = async (
  regionId?: string,
  medusaToken?: string,
  user?: User
) => {
  try {
    const cartData: Record<string, unknown> = {
      region_id: regionId || process.env.NEXT_PUBLIC_MEDUSA_DEFAULT_REGION
    };

    // Si hay usuario autenticado, agregar información
    if (user && medusaToken) {
      cartData.email = user.email;
    }

    const response = await fetch('/api/medusa/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(medusaToken && { 'Authorization': `Bearer ${medusaToken}` })
      },
      body: JSON.stringify(cartData)
    });

    if (!response.ok) {
      throw new Error('Failed to create cart');
    }

    const data = await response.json();
    return data.cart;

  } catch (error) {
    console.error('Error creating cart:', error);
    throw error;
  }
};

export const addToCart = async (
  cartId: string,
  variantId: string,
  quantity: number = 1,
  medusaToken?: string
) => {
  try {
    const response = await fetch('/api/medusa/cart-item', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(medusaToken && { 'Authorization': `Bearer ${medusaToken}` })
      },
      body: JSON.stringify({
        cartId,
        variantId,
        quantity
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add item');
    }

    const data = await response.json();
    return data.cart;

  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};