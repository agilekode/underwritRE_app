import { useEffect, useRef, useState } from "react";



export const TextInputCell = ({ params, handleCellChange, field }: { 
    params: any, 
    handleCellChange: any, 
    field: string,
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


    return (
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', paddingTop: 2 }}>
  
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={e => {
            const newValue = e.target.value;
            const newPosition = e.target.selectionStart || 0;
            setLocalValue(newValue);
            setCursorPosition(newPosition);
            handleCellChange(params.id, field, newValue);
          }}
          onKeyDown={(e) => {
            // Prevent space from bubbling up to DataGrid
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
              e.stopPropagation();
            }
          }}
          // onKeyUp={(e) => {
          //   // Restore cursor position after render
          //   if (inputRef.current) {
          //     inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
          //   }
          // }}
          style={{
            width: '100%',
            border: '1px solid #ccc',
            background: 'white',
            padding: '10px 6px',
            outline: 'none',
            borderRadius: 4,
            marginTop: 4,
            fontSize: 14, 
            textAlign: 'left'
          }}

        />
      </div>
    );
  };  
  