/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/gtag.ts

// 🔹 Tu ID de medición GA4 desde el entorno
export const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

/**
 * Inicializa Google Analytics manualmente (solo si aún no se ha cargado).
 * Esto evita que gtag() falle si se llama antes de que Analytics se haya montado.
 */
export const initGA = () => {
  if (typeof window === 'undefined') return;
  
  // Verificar consentimiento antes de inicializar
  const storedConsent = localStorage.getItem('cookieConsent');
  if (storedConsent) {
    try {
      const consent = JSON.parse(storedConsent);
      if (!consent.analytics) {
        console.log('🚫 GA not initialized - analytics not consented');
        return;
      }
    } catch (error) {
      console.error('Error parsing consent for GA init:', error);
    }
  }

  if (!window.dataLayer) window.dataLayer = [];
  if (!window.gtag) {
    window.gtag = function (...args: any[]) {
      window.dataLayer.push(args);
    };
  }
  
  if (GA_ID) {
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      page_path: window.location.pathname,
      anonymize_ip: true
    });
    console.log('✅ GA initialized successfully');
  } else {
    console.warn('⚠️ No se encontró NEXT_PUBLIC_GA_MEASUREMENT_ID');
  }
};

/**
 * Envía un evento a GA4 de forma segura.
 * Ahora verifica el consentimiento antes de enviar.
 */
export const gtagEvent = (action: string, params: Record<string, any>) => {
  if (typeof window === 'undefined') return;
  
  // Verificar consentimiento para analytics
  const storedConsent = localStorage.getItem('cookieConsent');
  if (storedConsent) {
    try {
      const consent = JSON.parse(storedConsent);
      if (!consent.analytics) {
        console.log(`🚫 GA event "${action}" blocked - analytics not consented`);
        return;
      }
    } catch (error) {
      console.error('Error parsing consent for GA event:', error);
    }
  }

  if (!window.gtag) {
    console.warn(`⚠️ gtag no está disponible para el evento "${action}"`);
    return;
  }

  window.gtag('event', action, params);
  console.log(`📤 Enviado evento GA4: ${action}`, params);
};

/**
 * Función para verificar si GA está disponible y con consentimiento
 */
export const isGAAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Verificar consentimiento
  const storedConsent = localStorage.getItem('cookieConsent');
  if (storedConsent) {
    try {
      const consent = JSON.parse(storedConsent);
      if (!consent.analytics) return false;
    } catch (error) {
      return false;
    }
  } else {
    return false; // No hay consentimiento guardado
  }

  return typeof window.gtag === 'function';
};