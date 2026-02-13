import React, { useEffect, useRef, useState } from 'react';
import { TextField, InputAdornment } from '@mui/material';

type ExitNumberInputProps = {
  value: number | string;
  onChange: (value: number | string) => void;
  onCommit?: (value: number | string) => void;
  min?: number;
  max?: number;
  step?: number;
  allowDecimal?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  sx?: any;
};

// Input that mirrors the typing/caret behavior of NumberInput.tsx but uses
// MUI standard variant with underline disabled (to match current styling).
const ExitInlineNumberInputBase: React.FC<ExitNumberInputProps> = ({
  value,
  onChange,
  onCommit,
  min,
  max,
  step,
  allowDecimal = false,
  prefix,
  suffix,
  sx = {},
}) => {
  const [localValue, setLocalValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isTypingRef = useRef<boolean>(false);

  useEffect(() => {
    if (isTypingRef.current) return;
    if (value === null || value === undefined) {
      setLocalValue('');
      return;
    }
    if (typeof value === 'string') {
      setLocalValue(value);
      return;
    }
    if (localValue.endsWith('.')) return;
    setLocalValue(String(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const cursorPos = e.target.selectionStart ?? 0;
    const original = e.target.value;

    const raw = input.replace(/,/g, '');
    const regex = allowDecimal ? /^-?\d*(?:\.\d*)?$/ : /^-?\d*$/;
    if (raw === '' || regex.test(raw)) {
      let processed = raw;
      if (raw !== '' && raw !== '-') {
        const num = Number(raw);
        if (!Number.isNaN(num)) {
          if (min !== undefined && num < min) processed = String(min);
          if (max !== undefined && num > max) processed = String(max);
        }
      }
      setLocalValue(processed);
      onChange(processed);

      setTimeout(() => {
        if (e.target) {
          const before = (original.substring(0, cursorPos).match(/,/g) || []).length;
          const after = (processed.substring(0, cursorPos).match(/,/g) || []).length;
          const newPos = cursorPos + (after - before);
          e.target.setSelectionRange(newPos, newPos);
        }
      }, 0);
    }
  };

  const handleFocus = () => {
    isTypingRef.current = true;
  };
  const handleBlur = () => {
    isTypingRef.current = false;
    if (value !== undefined && value !== null) {
      setLocalValue(typeof value === 'string' ? value : String(value));
    }
    if (onCommit) onCommit(localValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ['Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight','Home','End'];
    if (e.ctrlKey || e.metaKey) return;
    if (allowed.includes(e.key)) return;
    if (allowDecimal && e.key === '.') {
      if ((e.target as HTMLInputElement).value.includes('.')) {
        e.preventDefault();
      }
      return;
    }
    if (!/^[0-9]$/.test(e.key)) e.preventDefault();
  };

  return (
    <TextField
      inputRef={inputRef}
      value={localValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      variant="standard"
      size="small"
      type="text"
      sx={{
        ...sx,
        "& .MuiInputBase-input": {
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'inherit'
        },
        "& .MuiInputAdornment-root": {
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'inherit',
          "& .MuiTypography-root": {
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'inherit'
          }
        }
      }}
      InputProps={{
        disableUnderline: true,
        startAdornment: prefix ? <InputAdornment position="start">{prefix}</InputAdornment> : undefined,
        endAdornment: suffix ? <InputAdornment position="end">{suffix}</InputAdornment> : undefined,
      }}
      inputProps={{ style: { textAlign: 'right' }, inputMode: allowDecimal ? 'decimal' : 'numeric', step }}
    />
  );
};

export const ExitInlineNumberInput = React.memo(ExitInlineNumberInputBase);

export const ExitInlinePercentageInput: React.FC<Omit<ExitNumberInputProps, 'suffix' | 'allowDecimal'>> = React.memo((props) => (
  <ExitInlineNumberInput {...props} allowDecimal={true} suffix={<span>%</span>} />
));

export const ExitInlineMonthsInput: React.FC<Omit<ExitNumberInputProps, 'suffix'>> = React.memo((props) => (
  <ExitInlineNumberInput {...props} allowDecimal={false} suffix={<span>months</span>} />
));

