// pages/api/firebase/products.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { admin } from '../../../lib/firebaseAdmin'; // Tu configuración de Firebase Admin
import admin
import db
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { medusaId, title, description, thumbnail, storeName, sellerId, createdAt, status, variantsCount } = req.body;

    // Guardar en Firestore
    const docRef = await admin.firestore().collection('products').add({
      medusaId,
      title,
      description,
      thumbnail,
      storeName,
      sellerId,
      createdAt,
      status,
      variantsCount,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({ id: docRef.id, success: true });
  } catch (error) {
    console.error('Error saving product to Firebase:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}