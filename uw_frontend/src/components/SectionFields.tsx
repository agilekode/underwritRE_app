import React from 'react';
import { Box, Typography, Tooltip, RadioGroup, FormControlLabel, Radio, TextField, ClickAwayListener, Select, MenuItem } from '@mui/material';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import { StandardInput, CurrencyInput, PercentInput, NumberInput, YearInput, MonthInput } from './StandardInput';
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
    gridTemplateColumns: { xs: '1fr', sm: '200px 1fr 240px' },
    alignItems: 'center',
    gap: { xs: 1, sm: 0 },
    px: { xs: 1, sm: 2 },
    py: 1.5,
    maxWidth: 1200,
    mx: 'auto',
  } as const;
  return (
    <Box key={field.id}>
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
        <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: { xs: 'normal', sm: 'nowrap' }, position: 'relative', zIndex: 1 }}>
          {field.field_title}
        </Typography>
        {field.description && field.field_type !== 'select_options' && (
          <InfoHint title={<Typography sx={{ fontSize: "0.875rem", lineHeight: 1.4, color: 'white' }}>{field.description}</Typography>} />
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
        <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: { xs: 'normal', sm: 'nowrap' }, position: 'relative', zIndex: 1 }}>
          {field.field_title}
        </Typography>
        {field.description && field.field_type !== 'select_options' && (
          <InfoHint title={<Typography sx={{ fontSize: "0.875rem", lineHeight: 1.4, color: 'white' }}>{field.description}</Typography>} />
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
              label="Acre"
              placeholder="1"
              sx={{ width: 140, '& .MuiOutlinedInput-root': { height: 36 } }}
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
              InputProps={{
                sx: { textAlign: 'right', fontSize: '0.875rem', height: 36 },
                inputProps: { style: { textAlign: 'right' }, inputMode: 'decimal', pattern: '[0-9]*\\.?[0-9]*' },
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
              label="SF"
              placeholder="43,560"
              sx={{ width: 160, '& .MuiOutlinedInput-root': { height: 36 } }}
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
              InputProps={{
                sx: { textAlign: 'right', fontSize: '0.875rem', height: 36 },
                inputProps: { style: { textAlign: 'right' }, inputMode: 'numeric', pattern: '[0-9]*', min: 0 },
              }}
            />
          </>
        ) : (
          (() => {
            const timePhasedProps = {
              value: String(fieldValue ?? ''),
              onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                handleFieldChange(field.id, field.field_key, e.target.value),
              required: field.required,
              placeholder: `Enter ${field.field_title?.toLowerCase() || field.field_type}`,
              sx: { flex: 1, minWidth: 160 },
              rightAlign: false,
            };

            switch (field.field_type) {
              case 'dollars':
                return <CurrencyInput {...timePhasedProps} />;
              case 'percent':
                return <PercentInput {...timePhasedProps} />;
              case 'year':
                return <YearInput {...timePhasedProps} />;
              case 'month':
                return <MonthInput {...timePhasedProps} />;
              case 'number':
                return <NumberInput {...timePhasedProps} allowDecimals />;
              default:
                return <StandardInput {...timePhasedProps} />;
            }
          })()
        )}
        <NumberInput
          label="Start Month"
          value={String(startMonth ?? '')}
          onChange={(e) =>
            handleFieldChange(
              field.id,
              field.field_key,
              e.target.value === '' ? '' : parseInt(e.target.value, 10),
              true,
              'start_month'
            )
          }
          placeholder="Start"
          sx={{ width: 120 }}
          rightAlign={false}
          min={0}
        />
        <NumberInput
          label="End Month"
          value={String(endMonth ?? '')}
          onChange={(e) =>
            handleFieldChange(
              field.id,
              field.field_key,
              e.target.value === '' ? '' : parseInt(e.target.value, 10),
              true,
              'end_month'
            )
          }
          placeholder="End"
          sx={{ width: 120 }}
          rightAlign={false}
          min={0}
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
          <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', position: 'relative', zIndex: 1 }}>
            {field.field_title}
          </Typography>
          {field.description && (
            <Tooltip title={<Typography sx={{ fontSize: "0.875rem", lineHeight: 1.4, color: 'white' }}>{field.description}</Typography>} arrow>
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
          <StandardInput
            defaultValue={initialDateValue}
            onChange={(e) => {
              const raw = e.target.value;
              // Only push up when a valid yyyy-MM-dd is present
              if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
                handleFieldChange(field.id, field.field_key, raw, false, undefined, field.field_type);
              }
            }}
            required={field.required}
            type="date"
            sx={{ width: 240 }}
            rightAlign
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
        <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', position: 'relative', zIndex: 1 }}>
          {field.field_title}
        </Typography>
        {field.description && field.field_type !== 'select_options' && (
          <InfoHint title={<Typography sx={{ fontSize: "0.875rem", lineHeight: 1.4, color: 'white' }}>{field.description}</Typography>} />
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
              label="Acre"
              placeholder="1"
              sx={{ width: 140, '& .MuiOutlinedInput-root': { height: 36 } }}
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
              InputProps={{
                sx: { textAlign: 'right', fontSize: '0.875rem', height: 36 },
                inputProps: { style: { textAlign: 'right' }, inputMode: 'decimal', pattern: '[0-9]*\\.?[0-9]*' },
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
              label="SF"
              placeholder="43,560"
              sx={{ width: 160, '& .MuiOutlinedInput-root': { height: 36 } }}
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
              InputProps={{
                sx: { textAlign: 'right', fontSize: '0.875rem', height: 36 },
                inputProps: { style: { textAlign: 'right' }, inputMode: 'numeric', pattern: '[0-9]*', min: 0 },
              }}
            />
          </Box>
        ) : (
          (() => {
            const commonProps = {
              value: String(fieldValue ?? ''),
              onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                handleFieldChange(field.id, field.field_key, e.target.value),
              required: field.required,
              placeholder: `Enter ${field.field_title?.toLowerCase() || field.field_type}`,
              sx: { width: { xs: '100%', sm: 260 } },
            };

            switch (field.field_type) {
              case 'dollars':
                return <CurrencyInput {...commonProps} />;
              case 'dollars_per_sf':
                return <CurrencyInput {...commonProps} suffix="/sf" />;
              case 'percent':
                return <PercentInput {...commonProps} />;
              case 'year':
                return <YearInput {...commonProps} />;
              case 'month':
                return <MonthInput {...commonProps} />;
              case 'months':
                return <NumberInput {...commonProps} suffix="months" />;
              case 'number':
                return <NumberInput {...commonProps} allowDecimals />;
              case 'number_no_commas':
                return <NumberInput {...commonProps} noCommas />;
              default:
                return <StandardInput {...commonProps} />;
            }
          })()
        )}
      </Box>
    </Box>
  )}
</Box>) 
};