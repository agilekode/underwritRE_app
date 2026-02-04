import React from 'react';
import { Box, Typography, Tooltip, RadioGroup, FormControlLabel, Radio, TextField, ClickAwayListener, Select, MenuItem } from '@mui/material';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
// Removed external date pickers/adapters per request


export const SectionFields = ({ field, fieldValue, startMonth, endMonth, handleFieldChange }: { field: any, fieldValue: any, startMonth: any, endMonth: any, handleFieldChange: any }) => {
  const InfoHint = ({ title }: { title: React.ReactNode }) => {
    const [open, setOpen] = React.useState(false);
    const isPointerCoarse = typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches;
    const toggle = (e: React.SyntheticEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setOpen((o) => !o);
    };
    return (
      <ClickAwayListener onClickAway={() => setOpen(false)}>
        <span>
          <Tooltip
            title={title}
            arrow
            open={isPointerCoarse ? open : undefined}
            onClose={() => setOpen(false)}
            disableHoverListener={isPointerCoarse}
            disableFocusListener={isPointerCoarse}
            disableTouchListener={isPointerCoarse}
          >
            <span onClick={toggle} onTouchStart={toggle}>
              <InfoOutlineIcon sx={{ fontSize: 18, color: 'text.secondary', ml: 1, cursor: 'pointer', verticalAlign: 'middle' }} />
            </span>
          </Tooltip>
        </span>
      </ClickAwayListener>
    );
  };
  const selectOptions = React.useMemo(() => {
    const raw = typeof field?.description === 'string' ? field.description : '';
    return raw.split(',').map((s: string) => s.trim()).filter(Boolean);
  }, [field?.description]);
  // Compute a stable initial value for the uncontrolled date input
  const initialDateValue = React.useMemo(() => {
    if (typeof fieldValue !== 'string') return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(fieldValue)) return fieldValue;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fieldValue)) {
      const [mm, dd, yyyy] = fieldValue.split('/');
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
    return '';
  }, [fieldValue]);
  // Shared container styles for each field row
  const rowContainerSx = {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: '220px 1fr 260px' },
    alignItems: 'start',
    gap: { xs: 1, sm: 0 },
    px: { xs: 1, sm: 2 },
    pt: 0,
    mt: { xs: 2, sm: 4 },
    mb: { xs: 3, sm: 6 },
    maxWidth: 1200,
    mx: 'auto',
    borderBottom: 1,
    borderColor: 'rgba(0,0,0,0.12)'
  } as const;
  return (
    <Box key={field.id} sx={{ mt: 2 }}>
  {field.field_type === 'yes_no' ? (
    <Box sx={{ ...rowContainerSx }}>
      <Box
        sx={{
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.125rem' }, whiteSpace: { xs: 'normal', sm: 'nowrap' }, position: 'relative', zIndex: 1 }}>
          {field.field_title}
        </Typography>
        {field.description && field.field_type !== 'select_options' && (
          <InfoHint title={<Typography sx={{ fontSize: "0.95rem", lineHeight: 1.4 }}>{field.description}</Typography>} />
        )}
      </Box>
      <Box sx={{ display: { xs: 'none', sm: 'block' } }} />
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: { xs: 'flex-start', sm: 'flex-end' },
          pl: { xs: 0, sm: 2 },
        }}
      >
        <RadioGroup
          row
          value={fieldValue}
          onChange={(e) => handleFieldChange(field.id, field.field_key, e.target.value)}
        >
          <FormControlLabel value="yes" control={<Radio />} label="Yes" />
          <FormControlLabel value="no" control={<Radio />} label="No" />
        </RadioGroup>
      </Box>
    </Box>
  ) : field.time_phased ? (
    <Box sx={{ ...rowContainerSx, gridTemplateColumns: { xs: '1fr', sm: '220px 1fr 360px' } }}>
      <Box
        sx={{
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.125rem' }, whiteSpace: { xs: 'normal', sm: 'nowrap' }, position: 'relative', zIndex: 1 }}>
          {field.field_title}
        </Typography>
        {field.description && field.field_type !== 'select_options' && (
          <InfoHint title={<Typography sx={{ fontSize: "0.95rem", lineHeight: 1.4 }}>{field.description}</Typography>} />
        )}
      </Box>
      <Box sx={{ display: { xs: 'none', sm: 'block' } }} />
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          justifyContent: 'flex-start',
          pl: { xs: 0, sm: 2 },
        }}
      >
        {field.field_type === 'select_options' ? (
          <Select
            size="small"
            value={fieldValue ?? ''}
            onChange={(e) => handleFieldChange(field.id, field.field_key, e.target.value)}
            displayEmpty
            renderValue={(selected: any) =>
              selected && String(selected).length > 0 ? String(selected) : (
                <span style={{ color: '#9CA3AF' }}>Select an option</span>
              )
            }
            variant="standard"
            disableUnderline
            sx={{ minWidth: 200 }}
          >
            {selectOptions.map((opt: string, idx: number) => (
              <MenuItem key={`${opt}-${idx}`} value={opt}>{opt}</MenuItem>
            ))}
          </Select>
        ) : field.field_type === 'acres' ? (
          <>
            <TextField
              value={
                fieldValue === '' || fieldValue === null || fieldValue === undefined
                  ? ''
                  : String(fieldValue)
              }
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') {
                  handleFieldChange(field.id, field.field_key, '');
                  return;
                }
                const cleaned = raw.replace(/[^\d.]/g, '');
                const parts = cleaned.split('.');
                let integerPart = parts[0];
                let fractionPart = parts.length > 1 ? parts.slice(1).join('') : '';
                const hasDot = cleaned.includes('.');
                const isTrailingDot = hasDot && fractionPart.length === 0;
                if (!integerPart && hasDot) integerPart = '0';
                if (fractionPart.length > 4) fractionPart = fractionPart.slice(0, 4);
                if (isTrailingDot) {
                  handleFieldChange(field.id, field.field_key, `${integerPart}.`);
                } else {
                  const normalized = fractionPart.length > 0 ? `${integerPart}.${fractionPart}` : integerPart;
                  const num = parseFloat(normalized);
                  const acres = isNaN(num) ? '' : Math.max(0, Math.round(num * 10000) / 10000);
                  handleFieldChange(field.id, field.field_key, acres);
                }
              }}
              onKeyDown={(e) => {
                const allowedKeys = ['Backspace','Delete','ArrowLeft','ArrowRight','Home','End','Tab'];
                if (e.ctrlKey || e.metaKey) return;
                if (allowedKeys.includes(e.key)) return;
                if (e.key === '.') {
                  const raw = (e.target as HTMLInputElement).value || '';
                  if (raw.includes('.')) e.preventDefault();
                  return;
                }
                if (!/^[0-9]$/.test(e.key)) e.preventDefault();
              }}
              onPaste={(e) => {
                const text = e.clipboardData.getData('text');
                const ok = /^\d*(?:\.\d*)?$/.test(text.replace(/[^\d.]/g, ''));
                if (!ok) e.preventDefault();
              }}
              required={field.required}
              className="no-spinner"
              type="text"
              placeholder="Enter acres"
              sx={{ width: 180, minWidth: 160 }}
              variant="standard"
              InputProps={{
                disableUnderline: true,
                sx: { textAlign: 'left' },
                inputProps: { style: { textAlign: 'left' }, inputMode: 'decimal', pattern: '[0-9]*\\.?[0-9]*' },
                endAdornment: (
                  <span style={{ marginLeft: 4 }}>
                    {(Number(fieldValue) || 0) > 1 ? 'acres' : 'acre'}
                  </span>
                ),
              }}
            />
            <TextField
              value={
                fieldValue === '' || fieldValue === null || fieldValue === undefined
                  ? ''
                  : Math.round(Number(fieldValue || 0) * 43560).toLocaleString()
              }
              className="no-spinner"
              onChange={(e) => {
                const originalValue = e.target.value;
                const cursorPosition = e.target.selectionStart ?? 0;
                const raw = originalValue.replace(/,/g, '');
                if (raw === '') {
                  handleFieldChange(field.id, field.field_key, '');
                  return;
                }
                if (!/^\d*$/.test(raw)) return;
                const sqft = Math.max(0, parseInt(raw || '0', 10));
                // Preserve extra precision only for very small areas (< 10 SF)
                const acresRaw = sqft / 43560;
                const acres = sqft < 10
                  ? Math.round(acresRaw * 1e6) / 1e6
                  : Math.round(acresRaw * 1e4) / 1e4;
                handleFieldChange(field.id, field.field_key, acres);
                setTimeout(() => {
                  if (e.target) {
                    const newValue = sqft.toLocaleString();
                    const commasBefore = (originalValue.substring(0, cursorPosition).match(/,/g) || []).length;
                    const commasAfter = (newValue.substring(0, cursorPosition).match(/,/g) || []).length;
                    const newCursorPosition = cursorPosition + (commasAfter - commasBefore);
                    (e.target as HTMLInputElement).setSelectionRange(newCursorPosition, newCursorPosition);
                  }
                }, 0);
              }}
              onKeyDown={(e) => {
                const allowedKeys = ['Backspace','Delete','ArrowLeft','ArrowRight','Home','End','Tab'];
                if (e.ctrlKey || e.metaKey) return;
                if (allowedKeys.includes(e.key)) return;
                if (!/^[0-9]$/.test(e.key)) e.preventDefault();
              }}
              onPaste={(e) => {
                const text = e.clipboardData.getData('text').replace(/,/g, '');
                const ok = /^\d*$/.test(text);
                if (!ok) e.preventDefault();
              }}
              required={field.required}
              type="text"
              placeholder="Enter sq feet"
              sx={{ width: 200, minWidth: 160 }}
              variant="standard"
              InputProps={{
                disableUnderline: true,
                sx: { textAlign: 'left' },
                inputProps: { style: { textAlign: 'left' }, inputMode: 'numeric', pattern: '[0-9]*', min: 0 },
                endAdornment: <span style={{ marginLeft: 4 }}>SF</span>,
              }}
            />
          </>
        ) : (
        <TextField
          value={fieldValue}
          onChange={(e) => handleFieldChange(field.id, field.field_key, e.target.value)}
          required={field.required}
          className="no-spinner"
          type={['number','percent','year','month','dollars','acres'].includes(field.field_type) ? 'number' : 'text'}
          placeholder={
            field.field_type === 'dollars'
              ? 'Enter dollar amount'
              : field.field_type === 'number_no_commas'
                ? `Enter ${(field.field_title ?? field.field_key ?? 'value').toLowerCase()}`
                : `Enter a ${field.field_type}`
          }
          sx={{ flex: 1, minWidth: 160 }}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: { textAlign: 'left' }, // Aligns input text to the left
            inputProps: { 
              style: { textAlign: 'left' },
              ...(field.field_type === 'percent' || field.field_type === 'acres' ? { step: 'any' } : {})
            }, // For native input alignment
            startAdornment: field.field_type === 'dollars' ? (
              <span style={{ marginRight: 4 }}>$</span>
            ) : field.field_type === 'month' ? (
              <span style={{ marginRight: 4 }}>Month</span>
            ) : undefined,
            endAdornment: field.field_type === 'percent' ? (
              <span style={{ marginLeft: 4 }}>%</span>
            ) : field.field_type === 'year' ? (
              <span style={{ marginLeft: 4 }}>years</span>
            ) : field.field_type === 'acres' ? (
              <span style={{ marginLeft: 4 }}>acres</span>
            ) : undefined,
          }}
        />
        )}
        <TextField
          label="Start Month"
          className="no-spinner"
          type="number"
          inputProps={{ min: 0, style: { textAlign: 'left' } }}
          value={startMonth}
          onChange={(e) =>
            handleFieldChange(
              field.id,
              field.field_key,
              e.target.value === '' ? '' : parseInt(e.target.value, 10),
              true,
              'start_month'
            )
          }
          placeholder="Enter start month"
          sx={{ width: 120 }}
          variant="standard"
          InputProps={{ disableUnderline: true, sx: { textAlign: 'left' } }}
        />
        <TextField
          label="End Month"
          type="number"
          className="no-spinner"
          inputProps={{ min: 0, style: { textAlign: 'left' } }}
          value={endMonth}
          onChange={(e) =>
            handleFieldChange(
              field.id,
              field.field_key,
              e.target.value === '' ? '' : parseInt(e.target.value, 10),
              true,
              'end_month'
            )
          }
          placeholder="Enter end month"
          sx={{ width: 120 }}
          variant="standard"
          InputProps={{ disableUnderline: true, sx: { textAlign: 'left' } }}
        />
      </Box>
    </Box>
  ) : field.field_type === 'date' ? (
  
      <Box sx={{ ...rowContainerSx }}>
        <Box
          sx={{
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1.125rem', whiteSpace: 'nowrap', position: 'relative', zIndex: 1 }}>
            {field.field_title}
          </Typography>
          {field.description && (
            <Tooltip title={<Typography sx={{ fontSize: "0.95rem", lineHeight: 1.4 }}>{field.description}</Typography>} arrow>
              <span>
                <InfoOutlineIcon sx={{ fontSize: 18, color: 'text.secondary', ml: 1, cursor: 'pointer', verticalAlign: 'middle' }} />
              </span>
            </Tooltip>
          )}
        </Box>
        <Box sx={{ display: { xs: 'none', sm: 'block' } }} />
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            pl: { xs: 0, sm: 2 },
          }}
        >
          <TextField
            defaultValue={initialDateValue}
            onChange={(e) => {
              const raw = e.target.value;
              // Only push up when a valid yyyy-MM-dd is present; letting the browser manage caret & value
              if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
                handleFieldChange(field.id, field.field_key, raw, false, undefined, field.field_type);
              }
            }}
            required={field.required}
            type="date"
            sx={{ width: 240, textAlign: 'right' }}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: { textAlign: 'right' },
              inputProps: { style: { textAlign: 'right' } },
            }}
          />
    
        </Box>
      </Box>
   
  ) : (
    <Box sx={{ ...rowContainerSx }}>
      <Box
        sx={{
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.125rem' }, whiteSpace: 'nowrap', position: 'relative', zIndex: 1 }}>
          {field.field_title}
        </Typography>
        {field.description && field.field_type !== 'select_options' && (
          <InfoHint title={<Typography sx={{ fontSize: "0.95rem", lineHeight: 1.4 }}>{field.description}</Typography>} />
        )}
      </Box>
      <Box sx={{ display: { xs: 'none', sm: 'block' } }} />
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: { xs: 'flex-start', sm: 'flex-end' },
          pl: { xs: 0, sm: 2 },
        }}
      >
        {field.field_type === 'select_options' ? (
          <Select
            size="small"
            value={fieldValue ?? ''}
            onChange={(e) => handleFieldChange(field.id, field.field_key, e.target.value)}
            displayEmpty
            renderValue={(selected: any) =>
              selected && String(selected).length > 0 ? String(selected) : (
                <span style={{ color: '#9CA3AF' }}>Select an option</span>
              )
            }
            variant="standard"
            disableUnderline
            sx={{ width: { xs: '100%', sm: 260 } }}
          >
            {selectOptions.map((opt: string, idx: number) => (
              <MenuItem key={`${opt}-${idx}`} value={opt}>{opt}</MenuItem>
            ))}
          </Select>
        ) : field.field_type === 'acres' ? (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
            <TextField
              value={
                fieldValue === '' || fieldValue === null || fieldValue === undefined
                  ? ''
                  : String(fieldValue)
              }
              className="no-spinner"
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') {
                  handleFieldChange(field.id, field.field_key, '');
                  return;
                }
                const cleaned = raw.replace(/[^\d.]/g, '');
                const parts = cleaned.split('.');
                let integerPart = parts[0];
                let fractionPart = parts.length > 1 ? parts.slice(1).join('') : '';
                const hasDot = cleaned.includes('.');
                const isTrailingDot = hasDot && fractionPart.length === 0;
                if (!integerPart && hasDot) integerPart = '0';
                if (fractionPart.length > 4) fractionPart = fractionPart.slice(0, 4);
                if (isTrailingDot) {
                  handleFieldChange(field.id, field.field_key, `${integerPart}.`);
                } else {
                  const normalized = fractionPart.length > 0 ? `${integerPart}.${fractionPart}` : integerPart;
                  const num = parseFloat(normalized);
                  const acres = isNaN(num) ? '' : Math.max(0, Math.round(num * 10000) / 10000);
                  handleFieldChange(field.id, field.field_key, acres);
                }
              }}
              onKeyDown={(e) => {
                const allowedKeys = ['Backspace','Delete','ArrowLeft','ArrowRight','Home','End','Tab'];
                if (e.ctrlKey || e.metaKey) return;
                if (allowedKeys.includes(e.key)) return;
                if (e.key === '.') {
                  const raw = (e.target as HTMLInputElement).value || '';
                  if (raw.includes('.')) e.preventDefault();
                  return;
                }
                if (!/^[0-9]$/.test(e.key)) e.preventDefault();
              }}
              onPaste={(e) => {
                const text = e.clipboardData.getData('text');
                const ok = /^\d*(?:\.\d*)?$/.test(text.replace(/[^\d.]/g, ''));
                if (!ok) e.preventDefault();
              }}
              required={field.required}
              type="text"
              placeholder="Enter acres"
              sx={{ width: 120, textAlign: 'right' }}
              variant="standard"
              InputProps={{
                disableUnderline: true,
                sx: { textAlign: 'right' },
                inputProps: { style: { textAlign: 'right' }, inputMode: 'decimal', pattern: '[0-9]*\\.?[0-9]*' },
                endAdornment: (
                  <span style={{ marginLeft: 4 }}>
                    {(Number(fieldValue) || 0) > 1 ? 'acres' : 'acre'}
                  </span>
                ),
              }}
            />
            <TextField
              value={
                fieldValue === '' || fieldValue === null || fieldValue === undefined
                  ? ''
                  : Math.round(Number(fieldValue || 0) * 43560).toLocaleString()
              }
              className="no-spinner"
              onChange={(e) => {
                const originalValue = e.target.value;
                const cursorPosition = e.target.selectionStart ?? 0;
                const raw = originalValue.replace(/,/g, '');
                if (raw === '') {
                  handleFieldChange(field.id, field.field_key, '');
                  return;
                }
                if (!/^\d*$/.test(raw)) return;
                const sqft = Math.max(0, parseInt(raw || '0', 10));
                // Preserve extra precision only for very small areas (< 10 SF)
                const acresRaw = sqft / 43560;
                const acres = sqft < 10
                  ? Math.round(acresRaw * 1e6) / 1e6
                  : Math.round(acresRaw * 1e4) / 1e4;
                handleFieldChange(field.id, field.field_key, acres);
                setTimeout(() => {
                  if (e.target) {
                    const newValue = sqft.toLocaleString();
                    const commasBefore = (originalValue.substring(0, cursorPosition).match(/,/g) || []).length;
                    const commasAfter = (newValue.substring(0, cursorPosition).match(/,/g) || []).length;
                    const newCursorPosition = cursorPosition + (commasAfter - commasBefore);
                    (e.target as HTMLInputElement).setSelectionRange(newCursorPosition, newCursorPosition);
                  }
                }, 0);
              }}
              onKeyDown={(e) => {
                const allowedKeys = ['Backspace','Delete','ArrowLeft','ArrowRight','Home','End','Tab'];
                if (e.ctrlKey || e.metaKey) return;
                if (allowedKeys.includes(e.key)) return;
                if (!/^[0-9]$/.test(e.key)) e.preventDefault();
              }}
              onPaste={(e) => {
                const text = e.clipboardData.getData('text').replace(/,/g, '');
                const ok = /^\d*$/.test(text);
                if (!ok) e.preventDefault();
              }}
              required={field.required}
              type="text"
              placeholder="Enter sq feet"
              sx={{ width: 140, textAlign: 'right' }}
              variant="standard"
              InputProps={{
                disableUnderline: true,
                sx: { textAlign: 'right' },
                inputProps: { style: { textAlign: 'right' }, inputMode: 'numeric', pattern: '[0-9]*', min: 0 },
                endAdornment: <span style={{ marginLeft: 4 }}>SF</span>,
              }}
            />
          </Box>
        ) : (
        <TextField
          value={
            ['number', 'year', 'month', 'dollars', 'acres'].includes(field.field_type) && fieldValue
              ? Number(fieldValue).toLocaleString()
              : String(fieldValue ?? '')
          }

          className="no-spinner"
          onChange={(e) => {
            const rawValue = e.target.value.replace(/,/g, ''); // Remove commas for processing
            const cursorPosition = e.target.selectionStart ?? 0; // Handle null case
            const originalValue = e.target.value;
            
            handleFieldChange(field.id, field.field_key, rawValue);
            
            // Restore cursor position after state update
              if (field.field_type !== 'number_no_commas') {
            setTimeout(() => {
              if (e.target) {
                const newValue = ['number', 'year', 'month', 'dollars', 'acres'].includes(field.field_type) && rawValue
                  ? Number(rawValue).toLocaleString()
                  : rawValue;
                
                // Calculate new cursor position accounting for added/removed commas
                const commasBefore = (originalValue.substring(0, cursorPosition).match(/,/g) || []).length;
                const commasAfter = (newValue.substring(0, cursorPosition).match(/,/g) || []).length;
                const newCursorPosition = cursorPosition + (commasAfter - commasBefore);
                
                e.target.setSelectionRange(newCursorPosition, newCursorPosition);
              }
            }, 0);
              }
          }}
          onKeyDown={(e) => {
              const numericTypes = ['number', 'number_no_commas', 'percent', 'year', 'month', 'months', 'dollars', 'dollars_per_sf', 'acres'];
            if (!numericTypes.includes(field.field_type)) return;
            const allowDecimal = ['number', 'percent', 'dollars', 'dollars_per_sf', 'acres'].includes(field.field_type);
            const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab'];
            if (e.ctrlKey || e.metaKey) return; // allow shortcuts
            if (allowedKeys.includes(e.key)) return;
            if (allowDecimal && e.key === '.') {
              const raw = ((e.target as HTMLInputElement).value || '').replace(/,/g, '');
              if (raw.includes('.')) e.preventDefault();
              return;
            }
            if (!/^[0-9]$/.test(e.key)) e.preventDefault();
          }}
          onPaste={(e) => {
              const numericTypes = ['number', 'number_no_commas', 'percent', 'year', 'month', 'months', 'dollars', 'dollars_per_sf', 'acres'];
            if (!numericTypes.includes(field.field_type)) return;
            const allowDecimal = ['number', 'percent', 'dollars', 'dollars_per_sf', 'acres'].includes(field.field_type);
            const text = e.clipboardData.getData('text');
            const raw = text.replace(/,/g, '');
            const ok = allowDecimal ? /^\d*(?:\.\d*)?$/.test(raw) : /^\d*$/.test(raw);
            if (!ok) e.preventDefault();
          }}
          required={field.required}
          type={
            ['number', 'percent', 'year', 'month', 'dollars', 'acres'].includes(field.field_type)
              ? 'text'
              : 'text'
          }
          placeholder={
            field.field_type === 'dollars'
              ? 'Enter dollar amount'
              : field.field_type === 'number_no_commas'
                ? `Enter ${(field.field_title ?? field.field_key ?? 'value').toLowerCase()}`
                : `Enter a ${field.field_type}`
          }
          sx={{ width: { xs: '100%', sm: 260 }, textAlign: 'right' }}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: { textAlign: 'right' }, // Aligns input text to the right
            inputProps: { 
              style: { textAlign: 'right' }, // For native input alignment
                ...( ['number', 'number_no_commas', 'percent', 'year', 'month', 'months', 'dollars', 'dollars_per_sf', 'acres'].includes(field.field_type) ? { min: 0 } : {} ),
                inputMode: ['number', 'percent', 'dollars', 'dollars_per_sf', 'acres'].includes(field.field_type) ? 'decimal'
                  : (['year', 'month', 'months', 'number_no_commas'].includes(field.field_type) ? 'numeric' : undefined),
                pattern: ['number', 'percent', 'dollars', 'dollars_per_sf', 'acres'].includes(field.field_type) ? '[0-9]*\\.?[0-9]*'
                  : (['year', 'month', 'months', 'number_no_commas'].includes(field.field_type) ? '[0-9]*' : undefined)
            },
            startAdornment: field.field_type === 'dollars' ? (
              <span style={{ marginRight: 4 }}>$</span>
            ) : field.field_type === 'month' ? (
              <span style={{ marginRight: 4 }}>Month</span>
            ) : field.field_type === 'dollars_per_sf' ? (
              <span style={{ marginRight: 4 }}>$</span>
            ) : undefined,
            endAdornment: field.field_type === 'percent' ? (
              <span style={{ marginLeft: 4 }}>%</span>
            ) : field.field_type === 'year' ? (
              <span style={{ marginLeft: 4 }}>years</span>
            ) : field.field_type === 'months' ? (
              <span style={{ marginLeft: 4 }}>months</span>
            ) : field.field_type === 'dollars_per_sf' ? (
              <span style={{ marginLeft: 4 }}>$\/sf</span>
            ) : field.field_type === 'acres' ? (
              <span style={{ marginLeft: 4 }}>acres</span>
            ) : undefined,
          }}
        />
        )}
      </Box>
    </Box>
  )}
</Box>) 
};