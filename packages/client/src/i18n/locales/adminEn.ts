import type { AdminTexts } from '../../admin/AdminTexts.ts';

export const ADMIN_EN: AdminTexts = {
  title: 'Admin panel',
  description: 'Manage the availability of game features.',
  key: 'Secret key',
  login: 'Sign in',
  logout: 'Sign out',
  maps: 'Maps',
  mapHint: 'Disabled maps cannot be selected. Ongoing matches will finish on their current map.',
  unavailable: 'The admin panel is not configured on the server.',
  unauthorized: 'Incorrect key.',
  rateLimited: 'Too many attempts. Try again in a minute.',
  lastMap: 'At least one map must remain enabled.',
  error: 'The request failed. Please try again.',
  enabled: 'Enabled',
  disabled: 'Disabled',
  language: 'Language',
};
