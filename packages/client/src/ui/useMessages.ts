import type { Messages } from '../i18n/Messages.ts';
import { useServices } from './ServicesContext.ts';

export function useMessages(): Messages {
  return useServices().messages.value;
}
