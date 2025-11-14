/* eslint-disable @typescript-eslint/no-explicit-any */
// facebookPixel.ts
export const FACEBOOK_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ?? "";

// Declaramos el tipo de fbq global
declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

// Verificar si el Pixel ya está inicializado
export const isFacebookPixelInitialized = (): boolean => {
  return typeof window !== "undefined" && typeof window.fbq === "function";
};

// Inicializa el Pixel
export const initFacebookPixel = (FB_PIXEL_ID?: string) => {
  const pixelId = FB_PIXEL_ID || FACEBOOK_PIXEL_ID;
  
  if (typeof window === "undefined" || !pixelId) {
    console.warn('Facebook Pixel: Window not available or Pixel ID missing');
    return;
  }

  if (!pixelId) {
    console.error('Facebook Pixel: Pixel ID is missing. Check your NEXT_PUBLIC_FACEBOOK_PIXEL_ID environment variable');
    return;
  }

  // Si ya está inicializado, no hacer nada
  if (isFacebookPixelInitialized()) {
    console.log('Facebook Pixel: Already initialized');
    return;
  }

  // Inicializar la cola si no existe
  if (!window._fbq) {
    window._fbq = [];
  }

  // Definir fbq function
  window.fbq = function (...args: any[]) {
    window._fbq.push(args);
  };

  // Cargar el script del Pixel
  // Versión mejorada con más manejo de errores
  const loadPixelScript = () => {
    return new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector('script[src*="fbevents.js"]');
      if (existingScript) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      script.async = true;
      script.defer = true;
      
      // Añadir timeout
      const timeoutId = setTimeout(() => {
        reject(new Error('Facebook Pixel script loading timeout'));
      }, 10000); // 10 segundos timeout
      
      script.onload = () => {
        clearTimeout(timeoutId);
        resolve();
      };
      
      script.onerror = (error) => {
        clearTimeout(timeoutId);
        console.error('Facebook Pixel script error:', error);
        reject(new Error(`Failed to load Facebook Pixel script: ${error}`));
      };
      
      document.head.appendChild(script);
    });
  };

  // Inicializar Pixel después de cargar el script
  loadPixelScript()
    .then(() => {
      window.fbq("init", pixelId);
      window.fbq("track", "PageView");
      console.log('Facebook Pixel: Initialized successfully');
    })
    .catch((error) => {
      console.error('Facebook Pixel: Initialization failed', error);
    });
};

// Registrar eventos
export const fbqTrack = (event: string, data?: Record<string, any>) => {
  if (isFacebookPixelInitialized()) {
    window.fbq("track", event, data);
  } else {
    console.warn(`Facebook Pixel: Cannot track event "${event}" - Pixel not initialized`);
  }
};

// Track específicos comúnmente utilizados
export const fbqTrackCustom = (event: string, data?: Record<string, any>) => {
  if (isFacebookPixelInitialized()) {
    window.fbq("trackCustom", event, data);
  } else {
    console.warn(`Facebook Pixel: Cannot track custom event "${event}" - Pixel not initialized`);
  }
};

// Para eventos de conversión
export const fbqTrackConversion = (value?: number, currency: string = 'USD') => {
  if (isFacebookPixelInitialized()) {
    const data: Record<string, any> = { currency };
    if (value) {
      data.value = value;
    }
    window.fbq("track", "Purchase", data);
  }
};

// Reinicializar con un nuevo Pixel ID
export const reinitFacebookPixel = (newPixelId: string) => {
  if (typeof window !== "undefined" && isFacebookPixelInitialized()) {
    window.fbq("init", newPixelId);
    window.fbq("track", "PageView");
  }
};