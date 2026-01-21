import React, { useState, useEffect, useRef } from 'react';
import { TextField, InputAdornment } from '@mui/material';

interface NumberInputProps {
  value: number | string;
  onChange: (value: number | string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  variant?: 'outlined' | 'filled' | 'standard';
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  min?: number;
  max?: number;
  step?: number;
  sx?: any;
  className?: string;
  inputProps?: any;
  InputProps?: any;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  label,
  placeholder,
  required = false,
  disabled = false,
  fullWidth = false,
  size = 'medium',
  variant = 'outlined',
  startAdornment,
  endAdornment,
  min,
  max,
  step,
  sx = {},
  className = 'no-spinner',
  inputProps = {},
  InputProps = {},
}) => {
  const [localValue, setLocalValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Update local value when prop value changes, but preserve transient typing states like "1."
  useEffect(() => {
    if (value !== undefined && value !== null) {
      // If parent provides a string, respect it exactly (preserve trailing dots/zeros)
      if (typeof value === 'string') {
        setLocalValue(value);
        return;
      }
      // If user is currently typing a trailing decimal (e.g., "1."), don't clobber it
      if (localValue.endsWith('.')) {
        return;
      }
      const numValue = value as number;
      if (!isNaN(numValue)) {
        setLocalValue(numValue.toLocaleString());
      } else {
        setLocalValue('');
      }
    } else {
      setLocalValue('');
    }
  }, [value, localValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const cursorPosition = e.target.selectionStart ?? 0;
    const originalValue = e.target.value;
    
    // Remove commas for processing
    const rawValue = inputValue.replace(/,/g, '');
    
    // Validate input (only allow numbers, decimals, and negative signs)
    if (rawValue === '' || /^-?\d*\.?\d*$/.test(rawValue)) {
      // Apply min/max constraints
      let processedValue = rawValue;
      if (rawValue !== '' && rawValue !== '-') {
        const numValue = parseFloat(rawValue);
        if (!isNaN(numValue)) {
          if (min !== undefined && numValue < min) {
            processedValue = min.toString();
          } else if (max !== undefined && numValue > max) {
            processedValue = max.toString();
          }
        }
      }
      
      // Update local state for display
      setLocalValue(processedValue === '' ? '' : processedValue);
      
      // Call parent onChange with the raw string so transient states like "1." are preserved upstream
      onChange(processedValue);
      
      // Restore cursor position after state update
      setTimeout(() => {
        if (e.target) {
          const formattedValue = processedValue === '' ? '' : parseFloat(processedValue).toLocaleString();
          
          // Calculate new cursor position accounting for added/removed commas
          const commasBefore = (originalValue.substring(0, cursorPosition).match(/,/g) || []).length;
          const commasAfter = (formattedValue.substring(0, cursorPosition).match(/,/g) || []).length;
          const newCursorPosition = cursorPosition + (commasAfter - commasBefore);
          
          e.target.setSelectionRange(newCursorPosition, newCursorPosition);
        }
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow navigation keys, backspace, delete, etc.
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', 'PageUp', 'PageDown'
    ];
    
    // Allow numbers, decimal point, minus sign, and navigation keys
    if (!allowedKeys.includes(e.key) && !/[\d.-]/.test(e.key)) {
      e.preventDefault();
    }
    
    // Prevent multiple decimal points
    if (e.key === '.' && localValue.includes('.')) {
      e.preventDefault();
    }
    
    // Prevent multiple minus signs
    if (e.key === '-' && localValue.includes('-')) {
      e.preventDefault();
    }
  };

  return (
    <TextField
      ref={inputRef}
      label={label}
      placeholder={placeholder}
      value={localValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      required={required}
      disabled={disabled}
      fullWidth={fullWidth}
      size={size}
      variant={variant}
      type="text" // Use text type to support comma formatting
      className={className}
      sx={sx}
      inputProps={{
        ...inputProps,
        min,
        max,
        step,
      }}
      InputProps={{
        ...InputProps,
        startAdornment: startAdornment || InputProps.startAdornment,
        endAdornment: endAdornment || InputProps.endAdornment,
      }}
    />
  );
};

// Convenience components for common use cases
export const CurrencyInput: React.FC<Omit<NumberInputProps, 'startAdornment'> & { currency?: string }> = ({
  currency = 'USD',
  ...props
}) => {
  const getCurrencySymbol = (curr: string) => {
    switch (curr.toUpperCase()) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return '$';
    }
  };

  return (
    <NumberInput
      {...props}
      startAdornment={<InputAdornment position="start">{getCurrencySymbol(currency)}</InputAdornment>}
    />
  );
};

export const PercentageInput: React.FC<Omit<NumberInputProps, 'endAdornment'>> = (props) => (
  <NumberInput
    {...props}
    endAdornment={<InputAdornment position="end">%</InputAdornment>}
  />
);

export const YearsInput: React.FC<Omit<NumberInputProps, 'endAdornment'>> = (props) => (
  <NumberInput
    {...props}
    endAdornment={<InputAdornment position="end">years</InputAdornment>}
  />
);

export const MonthsInput: React.FC<Omit<NumberInputProps, 'endAdornment'>> = (props) => (
  <NumberInput
    {...props}
    endAdornment={<InputAdornment position="end">months</InputAdornment>}
  />
);

export const BasisPointsInput: React.FC<Omit<NumberInputProps, 'endAdornment'> & { prefix?: string }> = ({
  prefix = 'S+',
  ...props
}) => (
  <NumberInput
    {...props}
    startAdornment={<InputAdornment position="start">{prefix}</InputAdornment>}
    endAdornment={<InputAdornment position="end">BPS</InputAdornment>}
  />
); 