/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: string;
}

// ✅ Recibir el Pixel ID como prop
interface CookieBannerProps {
  facebookPixelId?: string;
  gaMeasurementId?: string;
}

const CookieBanner: React.FC<CookieBannerProps> = ({ 
  facebookPixelId, 
  gaMeasurementId 
}) => {
  const [showBanner, setShowBanner] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [preferences, setPreferences] = useState({
    analytics: false,
    marketing: false,
    preferences: false
  });

  useEffect(() => {
    console.log('🔧 COOKIE BANNER - Props received:');
    console.log('   - Facebook Pixel ID:', facebookPixelId || '❌ NOT PROVIDED');
    console.log('   - GA Measurement ID:', gaMeasurementId || '❌ NOT PROVIDED');
  }, [facebookPixelId, gaMeasurementId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('🔍 Checking for existing cookie consent...');
    const storedConsent = localStorage.getItem('cookieConsent');
    
    if (!storedConsent) {
      console.log('🎯 No consent found - showing banner');
      setShowBanner(true);
    } else {
      try {
        const parsedConsent: CookieConsent = JSON.parse(storedConsent);
        console.log('🎯 Found existing consent:', parsedConsent);
        
        setPreferences({
          analytics: parsedConsent.analytics,
          marketing: parsedConsent.marketing,
          preferences: parsedConsent.preferences
        });

        // Inicializar scripts basado en el consentimiento existente
        initializeTrackingScripts(parsedConsent);
      } catch (error) {
        console.error('❌ Error parsing stored consent:', error);
        setShowBanner(true);
      }
    }
  }, []);

  const acceptAll = () => {
    console.log('✅ Accepting ALL cookies');
    const consent: CookieConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
      timestamp: new Date().toISOString(),
    };
    
    saveConsentAndInitialize(consent);
  };

  const acceptNecessary = () => {
    console.log('✅ Accepting ONLY necessary cookies');
    const consent: CookieConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
      timestamp: new Date().toISOString(),
    };
    
    saveConsent(consent);
  };

  const savePreferences = () => {
    console.log('💾 Saving custom preferences:', preferences);
    const consent: CookieConsent = {
      necessary: true,
      analytics: preferences.analytics,
      marketing: preferences.marketing,
      preferences: preferences.preferences,
      timestamp: new Date().toISOString(),
    };
    
    saveConsentAndInitialize(consent);
  };

  const saveConsent = (consent: CookieConsent) => {
    localStorage.setItem('cookieConsent', JSON.stringify(consent));
    setShowBanner(false);
    setPreferencesOpen(false);
  };

  const saveConsentAndInitialize = (consent: CookieConsent) => {
    saveConsent(consent);
    initializeTrackingScripts(consent);
  };

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const initializeTrackingScripts = (consent: CookieConsent) => {
    console.log('🚀 INITIALIZING TRACKING SCRIPTS - START');
    console.log('   - Consent:', consent);
    console.log('   - FB Pixel ID available:', !!facebookPixelId);
    console.log('   - GA ID available:', !!gaMeasurementId);

    // Facebook Pixel - CON MÁS LOGGING
    if (consent.marketing) {
      console.log('📱 Facebook Pixel - Marketing consented, proceeding...');
      if (facebookPixelId) {
        console.log('🎯 Facebook Pixel - ID available, calling loadFacebookPixel...');
        loadFacebookPixel();
      } else {
        console.error('❌ Facebook Pixel - MISSING PIXEL ID');
      }
    } else {
      console.log('🚫 Facebook Pixel - marketing not consented');
    }

    // Google Analytics
    if (consent.analytics && gaMeasurementId) {
      console.log('📊 Google Analytics - Initializing...');
      loadGoogleAnalytics();
    } else {
      console.log('🚫 Google Analytics - not consented or missing ID');
    }
    
    console.log('🚀 INITIALIZING TRACKING SCRIPTS - END');
  };

  const loadGoogleAnalytics = () => {
    if (typeof window.gtag !== 'undefined') {
      console.log('ℹ️ Google Analytics already loaded');
      return;
    }

    console.log('📦 Loading Google Analytics script...');
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;
    
    script.onload = () => {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', gaMeasurementId, {
        anonymize_ip: true,
      });
      console.log('✅ Google Analytics initialized successfully');
    };

    script.onerror = () => {
      console.error('❌ Failed to load Google Analytics script');
    };

    document.head.appendChild(script);
  };

// En CookieBanner.tsx - REEMPLAZA la función loadFacebookPixel
  const loadFacebookPixel = () => {
    console.log('🔧 loadFacebookPixel() called - START');
    console.log('   - facebookPixelId:', facebookPixelId);
    console.log('   - Current fbq:', typeof window.fbq);
    console.log('   - Current _fbq:', window._fbq);

    if (typeof window.fbq !== 'undefined') {
      console.log('ℹ️ Facebook Pixel already loaded');
      return;
    }

    console.log('📦 Initializing Facebook Pixel queue...');
    
    // Inicializar cola de forma más robusta
    if (!window._fbq) {
      window._fbq = [];
      console.log('   - _fbq queue created');
    }
    
    // Definir fbq de forma más segura
    if (typeof window.fbq === 'undefined') {
      window.fbq = function(...args: any[]) {
        console.log('🎯 fbq called with:', args);
        if (window._fbq) {
          window._fbq.push(args);
        }
      };
      console.log('   - fbq function defined');
    }

    console.log('🔄 Creating script element...');
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('✅ Facebook Pixel script loaded successfully');
      console.log('   - fbq now:', typeof window.fbq);
      console.log('   - _fbq now:', window._fbq);
      
      if (facebookPixelId && typeof window.fbq === 'function') {
        console.log('🎯 Initializing Pixel with ID:', facebookPixelId);
        try {
          window.fbq('init', facebookPixelId);
          window.fbq('track', 'PageView');
          console.log('✅ Facebook Pixel FULLY INITIALIZED');
          
          // Verificación final
          console.log('🔍 POST-INIT CHECK:');
          console.log('   - fbq type:', typeof window.fbq);
          console.log('   - _fbq length:', window._fbq?.length);
        } catch (error) {
          console.error('❌ Error during Pixel initialization:', error);
        }
      } else {
        console.error('❌ Cannot initialize - missing Pixel ID or fbq not function');
        console.log('   - Pixel ID available:', !!facebookPixelId);
        console.log('   - fbq is function:', typeof window.fbq === 'function');
      }
    };

    script.onerror = (error) => {
      console.error('❌ FAILED to load Facebook Pixel script:', error);
      console.log('   - Script src:', script.src);
      console.log('   - Error details:', error);
    };

    script.onabort = () => {
      console.error('❌ Facebook Pixel script loading ABORTED');
    };

    console.log('📤 Appending script to head...');
    try {
      document.head.appendChild(script);
      console.log('✅ Script appended to head');
    } catch (error) {
      console.error('❌ Failed to append script:', error);
    }
  };

  if (!showBanner) {
    console.log('🎯 Banner not showing (already consented or not needed)');
    return null;
  }

  return (
    <>
      {preferencesOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[1001]"
          onClick={() => setPreferencesOpen(false)}
        />
      )}

      {/* Banner Principal */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-5 shadow-lg z-[9999]">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <h3 className="text-lg font-bold text-gray-900 m-0">
            Gestión de Cookies
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed m-0">
            Usamos cookies para mejorar tu experiencia.
          </p>

          <div className="flex gap-3 flex-wrap">
            <button
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              onClick={acceptNecessary}
            >
              Solo necesarias
            </button>
            <button
              className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              onClick={() => setPreferencesOpen(true)}
            >
              Preferencias
            </button>
            <button
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              onClick={acceptAll}
            >
              Aceptar todas
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Preferencias */}
      {preferencesOpen && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-0 max-w-2xl w-[90%] max-h-[80vh] overflow-y-auto z-[1002] shadow-2xl">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 m-0">
              Preferencias de Cookies
            </h3>
            <button
              className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700"
              onClick={() => setPreferencesOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="p-6">
            {/* Cookies Necesarias */}
            <div className="flex justify-between items-start py-4 border-b border-gray-100">
              <div className="flex-1 mr-4">
                <h4 className="text-base font-semibold text-gray-900 mb-1">Cookies necesarias</h4>
                <p className="text-sm text-gray-600 m-0">Siempre activas</p>
              </div>
              <div className="w-12 h-6 bg-blue-500 rounded-full cursor-not-allowed">
                <span className="block w-4 h-4 bg-white rounded-full mt-1 ml-1 translate-x-6" />
              </div>
            </div>

            {/* Cookies Analíticas */}
            <div className="flex justify-between items-start py-4 border-b border-gray-100">
              <div className="flex-1 mr-4">
                <h4 className="text-base font-semibold text-gray-900 mb-1">Cookies analíticas</h4>
                <p className="text-sm text-gray-600 m-0">Para análisis del sitio</p>
              </div>
              <button
                onClick={() => togglePreference('analytics')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  preferences.analytics ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`block w-4 h-4 bg-white rounded-full transition-transform ${
                    preferences.analytics ? 'translate-x-6' : 'translate-x-1'
                  } mt-1`}
                />
              </button>
            </div>

            {/* Cookies de Marketing */}
            <div className="flex justify-between items-start py-4 border-b border-gray-100">
              <div className="flex-1 mr-4">
                <h4 className="text-base font-semibold text-gray-900 mb-1">Cookies de marketing</h4>
                <p className="text-sm text-gray-600 m-0">Para publicidad</p>
              </div>
              <button
                onClick={() => togglePreference('marketing')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  preferences.marketing ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`block w-4 h-4 bg-white rounded-full transition-transform ${
                    preferences.marketing ? 'translate-x-6' : 'translate-x-1'
                  } mt-1`}
                />
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <button
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition"
              onClick={() => setPreferencesOpen(false)}
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              onClick={savePreferences}
            >
              Guardar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieBanner;