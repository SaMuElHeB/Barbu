import { useEffect, useState } from 'react';
import type { RuleSet } from './types';

/** État React synchronisé avec localStorage (tout reste sur le téléphone). */
export function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* stockage indisponible : on garde l'état en mémoire */
    }
  }, [key, value]);
  return [value, setValue] as const;
}

// ---- Partage des règles par lien ----

const toB64Url = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromB64Url = (s: string) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)));
};

export function rulesShareUrl(rules: RuleSet): string {
  const { builtIn: _b, ...clean } = rules;
  return `${location.origin}${location.pathname}#regles=${toB64Url(JSON.stringify(clean))}`;
}

export function readSharedRules(): RuleSet | null {
  const m = location.hash.match(/regles=([\w-]+)/);
  if (!m) return null;
  try {
    const r = JSON.parse(fromB64Url(m[1])) as RuleSet;
    if (!r || !Array.isArray(r.contracts) || typeof r.name !== 'string') return null;
    return r;
  } catch {
    return null;
  }
}

export async function shareLink(url: string, title: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (navigator.share) {
      await navigator.share({ title, url });
      return 'shared';
    }
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}
