import { useEffect, useRef, useState } from "react";

export const NumberDecimalInputCell = ({ params, handleCellChange, field, prefix = '', suffix = '', max = undefined}: {
  params: any,
  handleCellChange: any,
  field: string,
  prefix?: string,
  suffix?: string,
  max?: number | undefined
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState<string>(params.value?.toString() ?? '');

  useEffect(() => {
    if (params.hasFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [params.hasFocus]);

  useEffect(() => {
    setLocalValue(params.value?.toString() ?? '');
  }, [params.value]);

  const formatWithCommas = (val: string) => {
    if (val === '' || val === '.' || val === '-' || val === '-.') return val;
    const negative = val.startsWith('-');
    const endsWithDot = val.endsWith('.');
    const cleaned = val.replace(/[^0-9.]/g, '');

    const parts = cleaned.split('.');
    const intPart = parts[0] || '0';
    const fracPart = parts[1] ?? '';

    const intFormatted = Number(intPart).toLocaleString();
    let out = intFormatted;

    if (parts.length > 1) {
      if (fracPart !== '') {
        out = `${intFormatted}.${fracPart}`;
      } else if (endsWithDot) {
        // preserve trailing decimal point while user is typing (e.g., "10.")
        out = `${intFormatted}.`;
      }
    } else if (endsWithDot) {
      out = `${intFormatted}.`;
    }

    return negative ? `-${out}` : out;
  };

  const sanitize = (s: string) => {
    // keep digits, at most one dot, optional leading '-'
    let out = s.replace(/[^0-9.\-]/g, '');
    // only one leading '-'
    out = out.replace(/(?!^)-/g, '');
    // only one dot
    const firstDot = out.indexOf('.');
    if (firstDot !== -1) {
      out = out.slice(0, firstDot + 1) + out.slice(firstDot + 1).replace(/\./g, '');
    }
    return out;
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* dynamic padding computed inline in input style */}
      {prefix && (
        <span
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#888',
            pointerEvents: 'none',
            fontSize: 14,
            fontWeight: 500
          }}
        >
          {prefix}
        </span>
      )}
      {suffix && (
        <span
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#888',
            pointerEvents: 'none',
            fontSize: 14,
            fontWeight: 500
          }}
        >
          {suffix}
        </span>
      )}
      {/* padding computed below */}
      <input
        ref={inputRef}
        type="text"
        className="no-spinner u-editable-input"
        value={formatWithCommas(localValue)}
        onChange={(e) => {
          const prevDisplay = e.target.value;
          const selStart = e.target.selectionStart ?? prevDisplay.length;

          // restore to raw without commas, then sanitize
          const rawTyped = e.target.value.replace(/,/g, '');
          let cleaned = sanitize(rawTyped);

          // enforce max if provided
          const numeric = parseFloat(cleaned);
          if (max !== undefined && Number.isFinite(numeric) && numeric > Number(max)) {
            cleaned = String(max);
          }

          setLocalValue(cleaned);
          handleCellChange(params.id, field, Number.isFinite(numeric) ? numeric : 0);

          // cursor restore after formatting
          setTimeout(() => {
            if (!inputRef.current) return;
            const newDisplay = formatWithCommas(cleaned);
            // approximate comma diff before cursor
            const commasBefore = (prevDisplay.substring(0, selStart).match(/,/g) || []).length;
            const newSelBase = Math.min(selStart, newDisplay.length);
            const commasAfter = (newDisplay.substring(0, newSelBase).match(/,/g) || []).length;
            const delta = commasAfter - commasBefore;
            const newPos = Math.max(0, Math.min(newDisplay.length, newSelBase + delta));
            try {
              inputRef.current.setSelectionRange(newPos, newPos);
            } catch {}
          }, 0);
        }}
        onKeyDown={(e) => {
          if ([ 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
            e.stopPropagation();
          }
        }}
        style={{
          width: '100%',
          height: 40,
          boxSizing: 'border-box',
          border: 'none',
          borderBottom: '2px solid transparent',
          background: 'transparent',
          padding: (() => {
            const base = 6;
            let left = base + 2;
            let right = base + 2;
            if(suffix === '/ sf'){
              right = 32
            }else if(suffix === '/ unit'){
              right = 44
            }else if(suffix === '/ month'){
              right = 60
            }else if(suffix === '%'){
              right = 24
            }else if(suffix === 'units'){
              right = 42
            }else if(suffix === 'months'){
              right = 58
            }else if(suffix === 'sf'){
              right = 24
            }
            return `${base}px ${right}px ${base}px ${left}px`;
          })(),
          outline: 'none',
          borderRadius: 0,
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'inherit',
          textAlign: 'right'
        }}
      />
    </div>
  );
}; 
