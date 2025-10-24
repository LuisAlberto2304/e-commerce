// utils/medusaClient.ts
import { useAuth } from '@/context/userContext';

export const useMedusaClient = () => {
  const { medusaToken } = useAuth();
  
  const medusaFetch = async (endpoint: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Agregar token de Medusa si está disponible
    if (medusaToken) {
      headers['Authorization'] = `Bearer ${medusaToken}`;
    }

    const response = await fetch(`/api/medusa${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  return { medusaFetch };
};