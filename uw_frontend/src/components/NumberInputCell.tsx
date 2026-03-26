import { useEffect, useRef, useState } from "react";

export const NumberInputCell = ({
  params,
  handleCellChange,
  field,
  prefix = '',
  suffix = '',
  max = undefined,
  highlighted = false
}: { 
  params: any, 
  handleCellChange: any, 
  field: string,
  prefix?: string,
  suffix?: string,
  max?: number | undefined,
  highlighted?: boolean
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(params.value ?? '');
  const [cursorPosition, setCursorPosition] = useState(0);

  useEffect(() => {
    if (params.hasFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [params.hasFocus]);

  // Update local value when params.value changes
  useEffect(() => {
    setLocalValue(params.value ?? '');
  }, [params.value]);

  // Determine error state for start/end month comparison on the same row
  const isMonthField = field === 'start_month' || field === 'end_month';
  const startMonth = Number(params.row?.start_month);
  const endMonth = Number(params.row?.end_month);
  const monthError = isMonthField && Number.isFinite(startMonth) && Number.isFinite(endMonth) && endMonth < startMonth;

  // Format value with commas but preserve decimal while typing
  const formatDisplayValue = (val: any) => {
    if (val === '' || val === null || typeof val === 'undefined') return '';
    const [integer, decimal] = String(val).split('.');
    return decimal !== undefined ? `${Number(integer).toLocaleString()}.${decimal}` : Number(val).toLocaleString();
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {prefix && (
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none', fontSize: 14, fontWeight: 500 }}>
          {prefix}
        </span>
      )}
      {suffix && (
        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none', fontSize: 14, fontWeight: 500 }}>
          {suffix}
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        className="no-spinner u-editable-input"
        min={0}
        step="any"
        value={formatDisplayValue(localValue)}
        max={max}
        onChange={e => {
          const rawValue = e.target.value.replace(/,/g, '');
          const cursorPos = e.target.selectionStart ?? 0;
          setCursorPosition(cursorPos);

          // Allow empty or partially typed decimal numbers
          if (rawValue === '' || rawValue === '.' || /^-?\d*\.?\d*$/.test(rawValue)) {
            setLocalValue(rawValue);
            const numericValue = parseFloat(rawValue);
            if (!isNaN(numericValue)) {
              if(max !== undefined && numericValue > max) {
                handleCellChange(params.id, field, max);
              } else {
                handleCellChange(params.id, field, numericValue);
              }
            } else {
              handleCellChange(params.id, field, '');
            }
          }
        }}
        onKeyDown={(e) => {
          if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
            e.stopPropagation();
          }
        }}
        style={{
          width: '100%',
          height: 40,
          boxSizing: 'border-box',
          border: 'none',
          borderBottom: monthError ? '2px solid #d32f2f' : '2px solid transparent',
          borderRadius: 0,
          background: 'transparent',
          padding: (() => {
            const base = 6;
            let left = base + 2;
            let right = base + 2;
            if(suffix === '/ sf') right = 38;
            else if(suffix === '/ unit') right = 50;
            else if(suffix === '/ month') right = 66;
            else if(suffix === '%') right = 28;
            else if(suffix === 'units') right = 48;
            else if(suffix === 'months') right = 64;
            else if(suffix === 'sf') right = 28;
            return `${base}px ${right}px ${base}px ${left}px`;
          })(),
          outline: 'none',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'inherit',
          color: '#1f2937',
          textAlign: 'right'
        }}
      />
    </div>
  );
};
