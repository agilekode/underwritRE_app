import { useEffect, useRef, useState } from "react";

export const NumberInputCell = ({ params, handleCellChange, field, prefix = '', suffix = '', max = undefined, highlighted = false}: { 
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

    return (
      <div style={{ position: 'relative', width: '100%' }}>
        {prefix && (
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none', fontSize: 14, fontWeight: 500 }}>{prefix}</span>
        )}
        {suffix && (
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none', fontSize: 14, fontWeight: 500 }}>{suffix}</span>
        )}
        <input
          ref={inputRef}
          type="text"
          className="no-spinner u-editable-input"
          min={0}
          value={(localValue === '' || localValue === null || typeof localValue === 'undefined') ? '' : Number(localValue).toLocaleString()}
          max={max}
          onChange={e => {
            const rawValue = e.target.value.replace(/,/g, ''); // Remove commas for processing
            const cursorPosition = e.target.selectionStart ?? 0; // Handle null case
            const originalValue = e.target.value;
            
            let newValue = Number(rawValue);

            if(max && Number(newValue) > Number(max)) {
                newValue = Number(max);
            }
            
            setLocalValue(newValue);
            setCursorPosition(cursorPosition);
            handleCellChange(params.id, field, Number(newValue));
            
            // Restore cursor position after state update
            setTimeout(() => {
              if (e.target) {
                const formattedValue = (newValue === null || newValue === undefined || Number.isNaN(Number(newValue)))
                  ? ''
                  : Number(newValue).toLocaleString();
                
                // Calculate new cursor position accounting for added/removed commas
                const commasBefore = (originalValue.substring(0, cursorPosition).match(/,/g) || []).length;
                const commasAfter = (formattedValue.substring(0, cursorPosition).match(/,/g) || []).length;
                const newCursorPosition = cursorPosition + (commasAfter - commasBefore);
                
                e.target.setSelectionRange(newCursorPosition, newCursorPosition);
              }
            }, 0);
          }}
          onKeyDown={(e) => {
            // Prevent arrow keys and other navigation keys from bubbling up to DataGrid
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
  
