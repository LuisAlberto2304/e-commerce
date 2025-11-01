/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/debug.ts
export const debugLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`🔍 [${timestamp}] ${message}`, data || '');
};

export const saveToLocalStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    debugLog(`✅ Guardado en localStorage: ${key}`, data);
  } catch (error) {
    debugLog(`❌ Error guardando en localStorage: ${key}`, error);
  }
};