// hooks/useCookieConsent.ts
'use client';

import { useState, useEffect } from 'react';

interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: string;
}

export const useCookieConsent = () => {
  const [consent, setConsent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedConsent = localStorage.getItem('cookieConsent');
      if (storedConsent) {
        try {
          setConsent(JSON.parse(storedConsent));
        } catch (error) {
          console.error('Error parsing cookie consent:', error);
        }
      }
    }
  }, []);

  const hasConsent = (type: keyof CookieConsent): boolean => {
    if (!consent) return false;
    return consent[type] === true;
  };

  const getConsent = (): CookieConsent | null => {
    return consent;
  };

  return { consent, hasConsent, getConsent };
};