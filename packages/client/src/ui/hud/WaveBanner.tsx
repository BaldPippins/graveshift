import type { JSX } from 'preact';
import { useServices } from '../ServicesContext.ts';

export function WaveBanner(): JSX.Element | null {
  const banner = useServices().ui.banner.value;
  if (banner === null) {
    return null;
  }
  return (
    <div key={banner.id} class="banner">
      <h2>{banner.title}</h2>
      {banner.subtitle === '' ? null : <p>{banner.subtitle}</p>}
    </div>
  );
}
