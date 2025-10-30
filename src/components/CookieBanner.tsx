// components/CookieBanner.tsx
'use client';

import React, { useState, useEffect } from 'react';

// Definir tipos TypeScript
interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: string;
}

interface CookiePreferences {
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface CookiePreferenceProps {
  title: string;
  description: string;
  required: boolean;
  defaultChecked: boolean;
  id: string;
}

const CookieBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [preferencesOpen, setPreferencesOpen] = useState<boolean>(false);

  useEffect(() => {
    // Verificar si estamos en el cliente antes de usar localStorage
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('cookieConsent');
      if (!consent) {
        setShowBanner(true);
      }
    }
  }, []);

  const acceptAll = (): void => {
    const consent: CookieConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookieConsent', JSON.stringify(consent));
    setShowBanner(false);
    initializeTrackingScripts(consent);
  };

  const acceptNecessary = (): void => {
    const consent: CookieConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookieConsent', JSON.stringify(consent));
    setShowBanner(false);
  };

  const savePreferences = (preferences: CookiePreferences): void => {
    const consent: CookieConsent = {
      necessary: true,
      analytics: preferences.analytics,
      marketing: preferences.marketing,
      preferences: preferences.preferences,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookieConsent', JSON.stringify(consent));
    setPreferencesOpen(false);
    setShowBanner(false);
    initializeTrackingScripts(consent);
  };

  const initializeTrackingScripts = (consent: CookieConsent): void => {
    if (consent.analytics) {
      console.log('Inicializando analytics...');
      // Google Analytics, etc.
    }
    if (consent.marketing) {
      console.log('Inicializando marketing...');
      // Facebook Pixel, etc.
    }
  };

  const handleSavePreferences = (): void => {
    const analyticsElement = document.getElementById('analytics') as HTMLInputElement;
    const marketingElement = document.getElementById('marketing') as HTMLInputElement;
    const preferencesElement = document.getElementById('preferences') as HTMLInputElement;

    if (analyticsElement && marketingElement && preferencesElement) {
      const preferences: CookiePreferences = {
        analytics: analyticsElement.checked,
        marketing: marketingElement.checked,
        preferences: preferencesElement.checked
      };
      savePreferences(preferences);
    }
  };

  if (!showBanner) return null;

  return (
    <>
      {preferencesOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[1001]" 
          onClick={() => setPreferencesOpen(false)} 
        />
      )}

      {/* Banner principal */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t-2 border-gray-200 p-5 shadow-lg z-[1000]">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <h3 className="text-lg font-heading font-bold text-text m-0">Gestión de Cookies</h3>
          <p className="text-text-secondary text-sm leading-relaxed m-0">
            Utilizamos cookies propias y de terceros para mejorar nuestros servicios, 
            mostrarle publicidad relacionada con sus preferencias y realizar análisis 
            de uso de nuestro sitio web. Puede aceptar todas las cookies, 
            rechazarlas o configurar sus preferencias.
          </p>
          
          <div className="flex gap-3 flex-wrap">
            <button 
              className="button button--secondary button--small"
              onClick={acceptNecessary}
            >
              Solo necesarias
            </button>
            <button 
              className="button button--primary button--small"
              onClick={() => setPreferencesOpen(true)}
            >
              Preferencias
            </button>
            <button 
              className="button button--primary button--small"
              onClick={acceptAll}
            >
              Aceptar todas
            </button>
          </div>
        </div>
      </div>

      {/* Modal de preferencias */}
      {preferencesOpen && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-surface rounded-2xl p-0 max-w-2xl w-[90%] max-h-[80vh] overflow-y-auto z-[1002] shadow-2xl">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h3 className="text-xl font-heading font-bold text-text m-0">Preferencias de Cookies</h3>
            <button 
              className="bg-none border-none text-2xl cursor-pointer text-text-secondary hover:text-text"
              onClick={() => setPreferencesOpen(false)}
            >
              ×
            </button>
          </div>
          
          <div className="p-6">
            <CookiePreference 
              title="Cookies necesarias"
              description="Esenciales para el funcionamiento del sitio. No se pueden desactivar."
              required={true}
              defaultChecked={true}
              id="necessary"
            />
            
            <CookiePreference 
              title="Cookies analíticas"
              description="Nos permiten analizar el uso del sitio web y mejorar la experiencia."
              required={false}
              defaultChecked={false}
              id="analytics"
            />
            
            <CookiePreference 
              title="Cookies de marketing"
              description="Utilizadas para mostrar publicidad relevante y medir campañas."
              required={false}
              defaultChecked={false}
              id="marketing"
            />
            
            <CookiePreference 
              title="Cookies de preferencias"
              description="Guardan sus configuraciones y preferencias del sitio."
              required={false}
              defaultChecked={false}
              id="preferences"
            />
          </div>
          
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-surface2 rounded-b-2xl">
            <button 
              className="button button--secondary button--medium"
              onClick={() => setPreferencesOpen(false)}
            >
              Cancelar
            </button>
            <button 
              className="button button--primary button--medium"
              onClick={handleSavePreferences}
            >
              Guardar preferencias
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const CookiePreference: React.FC<CookiePreferenceProps> = ({ 
  title, 
  description, 
  required, 
  defaultChecked, 
  id 
}) => (
  <div className="flex justify-between items-start py-4 border-b border-gray-100 last:border-b-0">
    <div className="flex-1 mr-4">
      <h4 className="text-base font-semibold text-text mb-1">{title}</h4>
      <p className="text-sm text-text-secondary m-0 leading-relaxed">{description}</p>
    </div>
    <div className="flex items-center">
      <input 
        type="checkbox" 
        id={id}
        defaultChecked={defaultChecked}
        disabled={required}
        className="hidden"
      />
      <label 
        htmlFor={id} 
        className={`relative w-12 h-6 rounded-full transition-colors duration-300 cursor-pointer ${
          required ? 'bg-primary-500 cursor-not-allowed' : 'bg-gray-300'
        }`}
      >
        <span 
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
            defaultChecked ? 'transform translate-x-6' : ''
          } ${required ? 'bg-gray-100' : 'shadow-md'}`}
        />
      </label>
    </div>
  </div>
);

export default CookieBanner;