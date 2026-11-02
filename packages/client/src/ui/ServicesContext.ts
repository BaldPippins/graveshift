import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { AppServices } from './AppServices.ts';

export const ServicesContext = createContext<AppServices | null>(null);

export function useServices(): AppServices {
  const services = useContext(ServicesContext);
  if (services === null) {
    throw new Error('ServicesContext is not provided');
  }
  return services;
}
