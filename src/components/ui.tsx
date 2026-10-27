import { useEffect, useState, type ReactNode } from 'react';

export function TopBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="topbar">
      {onBack ? <button className="icon-btn" onClick={onBack} aria-label="Retour">‹</button> : <span className="icon-spacer" />}
      <h1>{title}</h1>
      {right ?? <span className="icon-spacer" />}
    </header>
  );
}

/**
 * Champ numérique. Pour les valeurs pouvant être négatives, on utilise type="number" :
 * le clavier du téléphone propose alors le signe moins.
 */
export function NumberField({ value, onChange, label, allowNegative = true }: {
  value: number; onChange: (v: number) => void; label?: string; allowNegative?: boolean;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => { if (Number(text) !== value) setText(String(value)); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span className="numfield">
      <input
        aria-label={label}
        type={allowNegative ? 'number' : 'text'}
        inputMode={allowNegative ? undefined : 'numeric'}
        value={text}
        onChange={(e) => {
          const t = e.target.value.replace(allowNegative ? /[^\d-]/g : /[^\d]/g, '');
          setText(t);
          const n = parseInt(t, 10);
          if (!Number.isNaN(n)) onChange(n);
        }}
        onBlur={() => setText(String(value))}
      />
    </span>
  );
}

export function Stepper({ value, onChange, max }: { value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <span className="stepper">
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} disabled={value <= 0} aria-label="Moins">−</button>
      <output>{value}</output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={max !== undefined && value >= max} aria-label="Plus">+</button>
    </span>
  );
}

export function Segmented<T extends string | number>({ options, value, onChange }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map((o) => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={o.value === value}
          className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Le moins de points gagne : + en rouge, − en vert. */
export const tone = (v: number) => (v > 0 ? 'neg' : v < 0 ? 'pos' : '');

/** Classement : le moins de points est 1er (ex aequo = même place). */
export const places = (t: number[]) => t.map((v) => t.filter((x) => x < v).length + 1);

export const fmt = (n: number) => String(n);