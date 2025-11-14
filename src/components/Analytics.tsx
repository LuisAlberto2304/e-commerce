"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Interfaz para el consentimiento
interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: string;
}

export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Verificar consentimiento existente
    if (typeof window !== "undefined") {
      const storedConsent = localStorage.getItem("cookieConsent");
      if (storedConsent) {
        try {
          const consent: CookieConsent = JSON.parse(storedConsent);
          setHasConsent(consent.analytics);
          
          console.log('🔍 Analytics component - Consent status:', {
            hasConsent: consent.analytics,
            storedConsent: consent
          });
        } catch (error) {
          console.error('Error parsing cookie consent:', error);
        }
      }
    }
  }, []);

  // Track page views cuando cambia la ruta
  useEffect(() => {
    if (!isClient || !hasConsent || !GA_ID || typeof window.gtag === "undefined") return;

    window.gtag("event", "page_view", {
      page_path: pathname + (searchParams?.toString() ? `?${searchParams}` : ""),
      page_location: window.location.href,
      page_title: document.title,
    });

    console.log("📄 GA4: page_view enviado", pathname);
  }, [pathname, searchParams, hasConsent, isClient]);

  // Escuchar cambios en el consentimiento
  useEffect(() => {
    if (!isClient) return;

    const handleStorageChange = () => {
      const storedConsent = localStorage.getItem("cookieConsent");
      if (storedConsent) {
        try {
          const consent: CookieConsent = JSON.parse(storedConsent);
          setHasConsent(consent.analytics);
          console.log('🔄 Analytics - Consent updated:', consent.analytics);
        } catch (error) {
          console.error('Error parsing updated consent:', error);
        }
      } else {
        setHasConsent(false);
      }
    };

    // Escuchar cambios en localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // También escuchar cambios desde la misma pestaña
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      originalSetItem.apply(this, [key, value]);
      if (key === 'cookieConsent') {
        handleStorageChange();
      }
    };

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isClient]);

  // 🚫 NO cargar scripts si no hay consentimiento para analytics
  if (!isClient || !hasConsent || !GA_ID) {
    console.log('🚫 Analytics - Not loading scripts:', {
      isClient,
      hasConsent,
      hasGA_ID: !!GA_ID
    });
    return null;
  }

  console.log('✅ Analytics - Loading GA scripts with consent');

  return (
    <>
      {/* Script base de GA4 */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
        onLoad={() => {
          console.log('✅ GA4 script loaded successfully');
        }}
        onError={() => {
          console.error('❌ Failed to load GA4 script');
        }}
      />

      {/* Configuración inicial de GA4 */}
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;

          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
            anonymize_ip: true
          });
          console.log('✅ GA4 initialized successfully');
        `}
      </Script>
    </>
  );
}