import { useEffect, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { Locale } from '../i18n/Locale.ts';
import { detectLocale, LOCALE_MESSAGES } from '../i18n/localeMessages.ts';
import { ADMIN_EN } from '../i18n/locales/adminEn.ts';
import { ADMIN_RU } from '../i18n/locales/adminRu.ts';
import { Button } from '../ui/components/Button.tsx';
import type { AdminLevel } from './AdminLevel.ts';
import { AdminLevels } from './AdminLevels.tsx';
import { AdminLogin } from './AdminLogin.tsx';
import type { AdminTexts } from './AdminTexts.ts';

const REFRESH_MILLISECONDS = 5000;

type AdminError = 'unavailable' | 'unauthorized' | 'rateLimited' | 'lastMap' | 'error';

function errorFor(status: number): AdminError {
  if (status === 401) return 'unauthorized';
  if (status === 429) return 'rateLimited';
  if (status === 503) return 'unavailable';
  if (status === 409) return 'lastMap';
  return 'error';
}

function authorization(key: string): string {
  return `Bearer ${key}`;
}

export function AdminApp(): JSX.Element {
  const [locale, setLocale] = useState(detectLocale(navigator.languages));
  const [input, setInput] = useState('');
  const [key, setKey] = useState('');
  const [levels, setLevels] = useState<readonly AdminLevel[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AdminError | null>(null);
  const text: AdminTexts = locale === Locale.Russian ? ADMIN_RU : ADMIN_EN;

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    if (key === '' || busy) return;
    const controller = new AbortController();
    const cancelled = (): boolean => controller.signal.aborted;
    let pending = false;
    const refresh = async (): Promise<void> => {
      if (pending) return;
      pending = true;
      try {
        const response = await fetch('/api/admin/levels', {
          headers: { Authorization: authorization(key) },
          cache: 'no-store',
          signal: controller.signal,
        });
        if (cancelled()) return;
        if (!response.ok) {
          setError(errorFor(response.status));
          if (response.status === 401) {
            setKey('');
            setLevels([]);
          }
          return;
        }
        const current = (await response.json()) as AdminLevel[];
        if (!cancelled()) {
          setLevels(current);
          setError(null);
        }
      } catch {
        if (!cancelled()) {
          setError('error');
        }
      } finally {
        pending = false;
      }
    };
    const timer = window.setInterval(() => {
      void refresh();
    }, REFRESH_MILLISECONDS);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [key, busy]);

  const login = async (): Promise<void> => {
    if (busy || input === '') return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/levels', {
        headers: { Authorization: authorization(input) },
        cache: 'no-store',
      });
      if (!response.ok) {
        setError(errorFor(response.status));
        return;
      }
      setLevels((await response.json()) as AdminLevel[]);
      setKey(input);
      setInput('');
    } catch {
      setError('error');
    } finally {
      setBusy(false);
    }
  };

  const update = async (id: string, enabled: boolean): Promise<void> => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/levels/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { Authorization: authorization(key), 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) {
        setError(errorFor(response.status));
        return;
      }
      setLevels((await response.json()) as AdminLevel[]);
    } catch {
      setError('error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main class="admin-shell">
      <header class="admin-header">
        <div>
          <h1>{text.title}</h1>
          <p>{text.description}</p>
        </div>
        <label class="admin-language">
          {text.language}
          <select
            value={locale}
            onChange={(event) => {
              setLocale(
                event.currentTarget.value === Locale.Russian ? Locale.Russian : Locale.English,
              );
            }}
          >
            <option value={Locale.Russian}>Русский</option>
            <option value={Locale.English}>English</option>
          </select>
        </label>
      </header>
      {error === null ? null : (
        <p class="admin-error" role="alert">
          {text[error]}
        </p>
      )}
      {key === '' ? (
        <AdminLogin
          text={text}
          value={input}
          busy={busy}
          onInput={setInput}
          onSubmit={() => {
            void login();
          }}
        />
      ) : (
        <>
          <AdminLevels
            text={text}
            levels={levels}
            names={LOCALE_MESSAGES[locale].lobby.levelNames}
            busy={busy}
            onChange={(id, enabled) => {
              void update(id, enabled);
            }}
          />
          <Button
            disabled={busy}
            onClick={() => {
              setKey('');
              setLevels([]);
              setError(null);
            }}
          >
            {text.logout}
          </Button>
        </>
      )}
    </main>
  );
}
