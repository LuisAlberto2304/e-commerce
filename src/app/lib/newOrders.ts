/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/firebase/orders.ts
import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebaseClient';

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  status: string;
  addedAt: any;
}

export interface Order {
  id: string;
  userId: string;
  email: string;
  status: string;
  total: number;
  items: OrderItem[];
  createdAt: any;
  updatedAt: any;
}

export const ordersService = {
  // Verificar si el usuario ha comprado un producto específico
  async hasUserPurchasedProduct(userId: string, productId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        where('status', '==', 'paid'), // Solo órdenes pagadas
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      for (const doc of querySnapshot.docs) {
        const order = doc.data() as Order;
        
        // Verificar si el producto está en los items de la orden
        const hasProduct = order.items.some(item => 
          item.productId === productId && item.status === 'active'
        );
        
        if (hasProduct) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking user purchase:', error);
      return false;
    }
  },

  // Obtener todas las órdenes del usuario (útil para mostrar historial)
  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const orders: Order[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.(),
          updatedAt: data.updatedAt?.toDate?.(),
        } as Order);
      });
      
      return orders;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }
  },

  // Obtener productos comprados por el usuario
  async getUserPurchasedProducts(userId: string): Promise<OrderItem[]> {
    try {
      const orders = await this.getUserOrders(userId);
      const purchasedProducts: OrderItem[] = [];
      
      orders.forEach(order => {
        if (order.status === 'paid') {
          order.items.forEach(item => {
            if (item.status === 'active') {
              purchasedProducts.push(item);
            }
          });
        }
      });
      
      return purchasedProducts;
    } catch (error) {
      console.error('Error fetching purchased products:', error);
      return [];
    }
  }
};