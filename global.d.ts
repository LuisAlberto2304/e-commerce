/* eslint-disable @typescript-eslint/no-explicit-any */
// global.d.ts
export {};

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}
