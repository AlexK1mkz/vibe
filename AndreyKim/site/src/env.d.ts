/// <reference types="astro/client" />

interface Window {
  track: (name: string, params?: Record<string, unknown>) => void;
  ym?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
}
