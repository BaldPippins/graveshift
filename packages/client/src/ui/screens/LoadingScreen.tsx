import type { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Meter } from '../components/Meter.tsx';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';

const TIP_INTERVAL_MILLISECONDS = 2600;

export function LoadingScreen(): JSX.Element {
  const { ui } = useServices();
  const text = useMessages().loading;
  const tipCount = text.tips.length;
  const [tipIndex, setTipIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setTipIndex((index) => (index + 1) % tipCount);
    }, TIP_INTERVAL_MILLISECONDS);
    return () => {
      window.clearInterval(timer);
    };
  }, [tipCount]);
  const error = ui.loadError.value;
  return (
    <section class="screen screen--center loading">
      <div class="logo">
        <span class="logo__title">GRAVESHIFT</span>
        <span class="logo__subtitle">{text.tagline}</span>
      </div>
      {error === null ? (
        <>
          <Meter
            value={ui.loadProgress.value}
            tone="gold"
            label={`${Math.round(ui.loadProgress.value * 100)}%`}
          />
          <p class="loading__tip">💡 {text.tips[tipIndex % tipCount]}</p>
        </>
      ) : (
        <p class="loading__error">{text.assetsFailed(error)}</p>
      )}
    </section>
  );
}
