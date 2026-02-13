import React, { useState, useEffect, useRef } from 'react';
import { TextField, TextFieldProps, InputAdornment, Box } from '@mui/material';
import { colors, inputStates } from '../theme';

/**
 * StandardInput
 * 
 * A consistent text input component that replaces the scattered
 * variant="standard" with disableUnderline patterns throughout the app.
 * 
 * Usage:
 *   <StandardInput
 *     value={value}
 *     onChange={(e) => setValue(e.target.value)}
 *     label="Property Name"
 *     placeholder="Enter property name"
 *   />
 */

interface StandardInputProps extends Omit<TextFieldProps, 'variant' | 'prefix'> {
  /** Prefix text or icon (e.g., "$" for currency) */
  prefix?: React.ReactNode;
  /** Suffix text or icon (e.g., "%" for percentage) */
  suffix?: React.ReactNode;
  /** Whether this is a calculated/read-only field */
  calculated?: boolean;
  /** Align text to right (common for numbers) */
  rightAlign?: boolean;
}

export const StandardInput: React.FC<StandardInputProps> = ({
  prefix,
  suffix,
  calculated = false,
  rightAlign = false,
  sx = {},
  InputProps = {},
  inputProps = {},
  disabled,
  error,
  ...props
}) => {
  // Determine which state to use
  const stateStyle = error 
    ? inputStates.error 
    : calculated 
    ? inputStates.calculated 
    : inputStates.editable;

  return (
    <TextField
      variant="outlined"
      size="small"
      disabled={disabled || calculated}
      error={error}
      {...props}
      InputLabelProps={{ shrink: true, ...props.InputLabelProps }}
      sx={{
        '& .MuiOutlinedInput-root': {
          height: 36,
          backgroundColor: stateStyle.background,
          '& fieldset': {
            borderColor: stateStyle.border || 'transparent',
            borderWidth: stateStyle.border ? '1.5px' : 0,
          },
          '&:hover fieldset': {
            borderColor: stateStyle.border || 'transparent',
          },
          '&.Mui-focused fieldset': {
            borderColor: !calculated && !error ? colors.blue : stateStyle.border,
            borderWidth: !calculated && !error ? '2px' : stateStyle.border ? '1.5px' : 0,
          },
          '&.Mui-disabled': {
            backgroundColor: inputStates.calculated.background,
          },
        },
        '& .MuiOutlinedInput-input': {
          textAlign: rightAlign ? 'right' : 'left',
          color: stateStyle.text,
          fontWeight: calculated ? 500 : 400,
          fontSize: '0.875rem',
        },
        ...sx,
      }}
      InputProps={{
        ...InputProps,
        startAdornment: prefix ? (
          <InputAdornment position="start">
            <Box component="span" sx={{ color: colors.grey[600], fontSize: '0.875rem' }}>
              {prefix}
            </Box>
          </InputAdornment>
        ) : InputProps.startAdornment,
        endAdornment: suffix ? (
          <InputAdornment position="end">
            <Box component="span" sx={{ color: colors.grey[600], fontSize: '0.875rem' }}>
              {suffix}
            </Box>
          </InputAdornment>
        ) : InputProps.endAdornment,
      }}
      inputProps={{
        ...inputProps,
      }}
    />
  );
};

/**
 * CurrencyInput
 *
 * Specialized input for dollar amounts with proper formatting.
 * Displays numbers with thousand separators (e.g., 2,000,000)
 * while maintaining raw numeric value for form state.
 *
 * Usage:
 *   <CurrencyInput
 *     value={price}
 *     onChange={(e) => setPrice(e.target.value)}
 *     label="Purchase Price"
 *   />
 */

interface CurrencyInputProps extends Omit<StandardInputProps, 'prefix' | 'type'> {
  /** Show prefix inside input vs floating label */
  showPrefix?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  showPrefix = true,
  rightAlign = true,
  inputProps = {},
  value,
  onChange,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Format number with thousand separators
  const formatNumber = (val: string | number | undefined): string => {
    if (val === undefined || val === null || val === '') return '';
    const numStr = String(val).replace(/,/g, '');
    const num = parseFloat(numStr);
    if (isNaN(num)) return String(val);
    // Handle decimals
    if (numStr.includes('.')) {
      const [whole, decimal] = numStr.split('.');
      const formattedWhole = parseInt(whole || '0').toLocaleString('en-US');
      return `${formattedWhole}.${decimal}`;
    }
    return num.toLocaleString('en-US');
  };

  // Store display value with formatting
  const [displayValue, setDisplayValue] = useState(() => formatNumber(value as string | number));

  // Update display when external value changes
  useEffect(() => {
    setDisplayValue(formatNumber(value as string | number));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursorPos = input.selectionStart || 0;
    const oldValue = displayValue;
    const newValue = input.value;

    // Strip commas for raw value
    const rawValue = newValue.replace(/,/g, '');

    // Only allow valid number characters
    if (rawValue !== '' && !/^[\d.]*$/.test(rawValue)) {
      return;
    }

    // Format and update display
    const formatted = formatNumber(rawValue);
    setDisplayValue(formatted);

    // Calculate cursor position adjustment
    const commasBefore = (oldValue.slice(0, cursorPos).match(/,/g) || []).length;
    const commasAfter = (formatted.slice(0, cursorPos).match(/,/g) || []).length;
    const newCursorPos = cursorPos + (commasAfter - commasBefore);

    // Restore cursor position after React re-render
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);

    // Pass raw value (without commas) to parent
    if (onChange) {
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: rawValue,
        },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <StandardInput
      prefix={showPrefix ? '$' : undefined}
      rightAlign={rightAlign}
      value={displayValue}
      onChange={handleChange}
      inputProps={{
        inputMode: 'decimal',
        ref: inputRef,
        ...inputProps,
      }}
      {...props}
    />
  );
};

/**
 * PercentInput
 * 
 * Specialized input for percentage values.
 * 
 * Usage:
 *   <PercentInput
 *     value={rate}
 *     onChange={(e) => setRate(e.target.value)}
 *     label="Interest Rate"
 *   />
 */

export const PercentInput: React.FC<StandardInputProps> = ({
  rightAlign = true,
  inputProps = {},
  ...props
}) => {
  return (
    <StandardInput
      suffix="%"
      rightAlign={rightAlign}
      inputProps={{
        inputMode: 'decimal',
        pattern: '[0-9]*\\.?[0-9]*',
        ...inputProps,
      }}
      {...props}
    />
  );
};

/**
 * NumberInput
 * 
 * Specialized input for numeric values (no currency or percent).
 * 
 * Usage:
 *   <NumberInput
 *     value={units}
 *     onChange={(e) => setUnits(e.target.value)}
 *     label="Number of Units"
 *   />
 */

interface NumberInputProps extends StandardInputProps {
  /** Allow decimal values */
  allowDecimals?: boolean;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Disable thousand separator formatting (for years, etc.) */
  noCommas?: boolean;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  allowDecimals = false,
  min,
  max,
  noCommas = false,
  rightAlign = true,
  inputProps = {},
  value,
  onChange,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Format number with thousand separators (unless noCommas is true)
  const formatNumber = (val: string | number | undefined): string => {
    if (val === undefined || val === null || val === '') return '';
    const numStr = String(val).replace(/,/g, '');
    const num = parseFloat(numStr);
    if (isNaN(num)) return String(val);

    // Skip formatting if noCommas is set
    if (noCommas) return numStr;

    // Handle decimals
    if (allowDecimals && numStr.includes('.')) {
      const [whole, decimal] = numStr.split('.');
      const formattedWhole = parseInt(whole || '0').toLocaleString('en-US');
      return `${formattedWhole}.${decimal}`;
    }
    return Math.floor(num).toLocaleString('en-US');
  };

  // Store display value with formatting
  const [displayValue, setDisplayValue] = useState(() => formatNumber(value as string | number));

  // Update display when external value changes
  useEffect(() => {
    setDisplayValue(formatNumber(value as string | number));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursorPos = input.selectionStart || 0;
    const oldValue = displayValue;
    const newValue = input.value;

    // Strip commas for raw value
    const rawValue = newValue.replace(/,/g, '');

    // Only allow valid number characters
    const pattern = allowDecimals ? /^[\d.]*$/ : /^[\d]*$/;
    if (rawValue !== '' && !pattern.test(rawValue)) {
      return;
    }

    // Format and update display
    const formatted = formatNumber(rawValue);
    setDisplayValue(formatted);

    // Calculate cursor position adjustment (only matters if commas are used)
    if (!noCommas) {
      const commasBefore = (oldValue.slice(0, cursorPos).match(/,/g) || []).length;
      const commasAfter = (formatted.slice(0, cursorPos).match(/,/g) || []).length;
      const newCursorPos = cursorPos + (commasAfter - commasBefore);

      // Restore cursor position after React re-render
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }

    // Pass raw value (without commas) to parent
    if (onChange) {
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: rawValue,
        },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <StandardInput
      rightAlign={rightAlign}
      value={displayValue}
      onChange={handleChange}
      inputProps={{
        inputMode: allowDecimals ? 'decimal' : 'numeric',
        pattern: allowDecimals ? '[0-9]*\\.?[0-9]*' : '[0-9]*',
        min,
        max,
        ref: inputRef,
        ...inputProps,
      }}
      {...props}
    />
  );
};

/**
 * SquareFeetInput
 * 
 * Specialized input for square footage.
 * 
 * Usage:
 *   <SquareFeetInput
 *     value={sqft}
 *     onChange={(e) => setSqft(e.target.value)}
 *     label="Gross Square Feet"
 *   />
 */

export const SquareFeetInput: React.FC<StandardInputProps> = ({
  rightAlign = true,
  inputProps = {},
  ...props
}) => {
  return (
    <StandardInput
      suffix="sf"
      rightAlign={rightAlign}
      inputProps={{
        inputMode: 'numeric',
        pattern: '[0-9]*',
        min: 0,
        ...inputProps,
      }}
      {...props}
    />
  );
};

/**
 * MonthInput
 * 
 * Specialized input for month values.
 * 
 * Usage:
 *   <MonthInput
 *     value={month}
 *     onChange={(e) => setMonth(e.target.value)}
 *     label="Start Month"
 *   />
 */

export const MonthInput: React.FC<StandardInputProps> = ({
  rightAlign = true,
  inputProps = {},
  ...props
}) => {
  return (
    <StandardInput
      prefix="Month"
      rightAlign={rightAlign}
      inputProps={{
        inputMode: 'numeric',
        pattern: '[0-9]*',
        min: 0,
        ...inputProps,
      }}
      {...props}
    />
  );
};

/**
 * YearInput
 * 
 * Specialized input for year durations.
 * 
 * Usage:
 *   <YearInput
 *     value={years}
 *     onChange={(e) => setYears(e.target.value)}
 *     label="Loan Term"
 *   />
 */

export const YearInput: React.FC<StandardInputProps> = ({
  rightAlign = true,
  inputProps = {},
  ...props
}) => {
  return (
    <StandardInput
      suffix="years"
      rightAlign={rightAlign}
      inputProps={{
        inputMode: 'numeric',
        pattern: '[0-9]*',
        min: 0,
        ...inputProps,
      }}
      {...props}
    />
  );
};
