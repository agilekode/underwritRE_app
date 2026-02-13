import React, { useEffect, useRef, useState } from 'react';
import { DataGrid, GridColDef, GridRowId, GridPagination } from '@mui/x-data-grid';
import { Button, IconButton, Tooltip, Typography, Dialog, DialogTitle, DialogContent, Box, TextField, InputAdornment } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { NumberInputCell } from './NumberInputCell';
import { NumberInput } from './NumberInput';
import { HEADER_FOOTER_HEIGHT, ROW_HEIGHT } from '../utils/constants';
import { colors } from '../theme';




interface Unit {
  id: string;
  rent_type: string;
  vacate_flag: number;
  layout: string;
  square_feet: number;
  vacate_month: number;
  current_rent: number | null;
  unitNumber?: number | string;
  isFooter?: boolean;
}

interface UnitTableProps {
  units: Unit[];
  setUnits: React.Dispatch<React.SetStateAction<Unit[]>>;
  showMarketRentLayouts: boolean;
  showMarketRentAssumptions: boolean;
  marketRentAssumptions: { layout: string; pf_rent: number; }[];
  setMarketRentAssumptions: React.Dispatch<React.SetStateAction<{ layout: string; pf_rent: number; }[]>>;
  showGrowthRates: boolean;
  growthRates: { name: string; value: number; type: string; }[];
  setGrowthRates: React.Dispatch<React.SetStateAction<{ name: string; value: number; type: string; }[]>>;
  modelDetails: any;
  highlightedFields: string[];
  growthRatesOnly: boolean;
  vacate: boolean;
  activeStepTitle: string;
  allowAddUnit?: boolean;
}

interface SelectedCell {
  rowIdx: number;
  columnKey: string;
}

const rowHeight = 52; // Example row height, adjust as needed
const headerFooterHeight = 56 + 37; // Example header height, adjust as needed

// Custom dropdown component for rent_type
const RentTypeDropdown: React.FC<{ value: string; onChange: (value: string) => void; options: { name: string; }[]; }> = ({ value, onChange, options }) => {
  return (
    <div className="u-select-wrap" style={{ position: 'relative', width: '100%' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            e.stopPropagation();
          }
        }}
        style={{ width: '100%', background: 'transparent', border: 'none', borderRadius: 4, padding: '10px 28px 10px 8px', outline: 'none', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
        className="u-select"
      >
        {options.map((option) => (
          <option key={option.name} value={option.name}>
            {option.name}
          </option>
        ))}
      </select>
      <span className="u-caret" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>▾</span>
    </div>
  );
};

const UnitTable: React.FC<UnitTableProps> = ({ units, setUnits,  marketRentAssumptions, showMarketRentAssumptions, showMarketRentLayouts, setMarketRentAssumptions, showGrowthRates, setGrowthRates, growthRates,modelDetails, highlightedFields, growthRatesOnly, vacate, activeStepTitle, allowAddUnit = true }) => {
  const [unitCount, setUnitCount] = useState(units.length || 1);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [isPasteOperation, setIsPasteOperation] = useState(false);
  const [pastedText, setPastedText] = useState<string>('');
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 100,
    page: 0,
  });
  const [open, setOpen] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');

  const [growthOpen, setGrowthOpen] = useState(false);
  const [newGrowthRateName, setNewGrowthRateName] = useState('');
  const [nameEdit, setNameEdit] = useState<{ [index: number]: string }>({});
  const [nameError, setNameError] = useState<{ [index: number]: string }>({});
  const [pfOpen, setPfOpen] = useState(showMarketRentAssumptions && growthRatesOnly === false);


  let idCounter = 0;

  const generateUniqueId = () => {
    const timestamp = Date.now();
    idCounter += 1;
    return `${timestamp}-${idCounter}`;
  };

  useEffect(() => {
    if (units.length === 0 && growthRates.length > 0 && marketRentAssumptions.length > 0) {
      setUnits([
        {
          id: generateUniqueId(),
          rent_type: growthRates[0].name,
          vacate_flag: 0,
          layout: marketRentAssumptions[0].layout,
          square_feet: 0,
          vacate_month: 0,
          current_rent: null
        }
      ]);
    }
  }, [units, setUnits, growthRates]);

  const createNewUnit = (): Unit => ({
    id: generateUniqueId(),
    rent_type: (growthRates.find(r => r.type === 'rental')?.name) || growthRates[0]?.name || 'Fair Market',
    vacate_flag: 0,
    layout: marketRentAssumptions[0]?.layout || (marketRentAssumptions[0]?.layout ?? 'Studio'),
    square_feet: 0,
    vacate_month: 0,
    current_rent: null,
  });

  const addSingleUnit = () => {
    setUnits((prev) => [...prev, createNewUnit()]);
  };

  // Example: fieldsToShow could come from props, context, or be computed
  const fieldsToShow = [
    'unitNumber',
    'layout',
    'square_feet',
    'current_rent',
    'rent_type',
    ...(activeStepTitle === "Residential Rental Units" ? ['growth_rate'] : []),
    'pf_rent', // only if showMarketRentAssumptions
    'vacate_flag',
    'vacate_month',
 
    'delete'
  ];

  // const NumberInputCell = ({ params, handleCellChange, field }: { params: any, handleCellChange: any, field: string }) => {
  //   const inputRef = useRef<HTMLInputElement>(null);

  //   useEffect(() => {
  //     if (params.hasFocus && inputRef.current) {
  //       inputRef.current.focus();
  //       inputRef.current.select();
  //     }
  //   }, [params.hasFocus]);

  //   return (
  //     <input
  //       ref={inputRef}
  //       type="number"
  //       min={0}
  //       value={params.row[field] ?? ''}
  //       onChange={e => handleCellChange(params.id, field,  Number(e.target.value))}
  //       style={{
  //         width: '96%',
  //         border: params.hasFocus ? '2px solid #1976d2' : '1px solid #ccc',
  //         background: params.hasFocus ? '#e3f2fd' : 'transparent',
  //         padding: '10px 6px',
  //         outline: 'none',
  //         borderRadius: 4,
  //         fontSize: 14, 
  //         textAlign: 'right'
  //       }}
  //       onFocus={e => e.target.select()}
  //     />
  //   );
  // };  

  const allColumns: Record<string, GridColDef> = {
    unitNumber: { 
      field: 'unitNumber', 
      headerName: 'Unit', 
      width: 70, 
      editable: false,
      renderHeader: () => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 14.5, color: '#1f2937' }}>Unit</Typography>
          {allowAddUnit && (
            <Tooltip title="Add unit" arrow>
              <IconButton size="small" onClick={addSingleUnit} sx={{ p: 0.25 }}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span style={{ color: '#9e9e9e'}}>{params.value}</span>
          <span className="u-row-action">
            <Tooltip title="Duplicate" arrow>
              <IconButton
                onClick={() => handleDuplicateRow(params.id)}
                color="primary"
                size="small"
                sx={{ p: 0.25 }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </span>
        </Box>
      )
    },
    layout: {
      field: 'layout',
      headerName: 'Layout',
      width: 150,
      editable: false,
      cellClassName: showMarketRentAssumptions ? 'u-noneditable-cell' : 'u-editable-cell',
      renderHeader: () => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 14.5, color: '#1f2937' }}>Layout</Typography>
          <Tooltip title="Edit layouts" arrow>
            <IconButton size="small" onClick={handleOpenModal} sx={{ p: 0.25 }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
      renderCell: (params) => (
        showMarketRentAssumptions ? (
          <span className="u-muted">{params.value}</span>
        ) : (
          <div className="u-select-wrap" style={{ position: 'relative', width: '100%' }}>
            <select
              value={params.value}
              onChange={(e) => handleCellChange(params.id, 'layout', e.target.value)}
              onKeyDown={(e) => {
                if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                  e.stopPropagation();
                }
              }}
              style={{ width: '100%', background: 'transparent', border: 'none', borderRadius: 4, padding: '10px 28px 10px 8px', outline: 'none', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
              className="u-select"
            >
              {marketRentAssumptions.map((assumption) => (
                <option key={assumption.layout} value={assumption.layout}>
                  {assumption.layout}
                </option>
              ))}
            </select>
            <span className="u-caret" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>▾</span>
          </div>
        )
      )
    },
    square_feet: { 
      field: 'square_feet', 
      headerName: 'Square Feet', 
      width: 150, 
      minWidth: 100,
      editable: false, 
      type: 'number',
      cellClassName: showMarketRentAssumptions ? 'u-noneditable-cell' : 'u-editable-cell',
      renderCell: (params) => (
        showMarketRentAssumptions ? (
          <span>
            <span className="u-value u-muted">{Number(params.value ?? 0).toLocaleString()}</span>{' '}
            <span className="u-unit u-muted">sf</span>
          </span>
        ) : (
          <NumberInputCell
            params={params}
            handleCellChange={handleCellChange}
            field={'square_feet'}
            highlighted={highlightedFields?.includes('square_feet')}
            suffix={'sf'}
          />
        )
      ),
    },
    
    current_rent: { field: 'current_rent', headerName: 'Current Rent', width: 160, minWidth: 150, editable: false, type: 'number',
      cellClassName: showMarketRentAssumptions ? 'u-noneditable-cell' : 'u-editable-cell',
      renderCell: (params) => (
        showMarketRentAssumptions ? (
          <span>
            <span className="u-value u-muted">$ {Number(params.value ?? 0).toLocaleString()}</span>{' '}
            <span className="u-unit u-muted">/ month</span>
          </span>
        ) : (
          <NumberInputCell
            params={params}
            handleCellChange={handleCellChange}
            field={'current_rent'}
            highlighted={highlightedFields?.includes('current_rent')}
            prefix={'$'}
            suffix={'/ month'}
          />
        )
      ),
     },
    rent_type: {
      field: 'rent_type',
      headerName: 'Rent Type',
      width: 150,
      editable: false,
      cellClassName: showMarketRentAssumptions ? 'u-noneditable-cell' : 'u-editable-cell',
      renderHeader: () => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 14.5, color: '#1f2937' }}>Rent Type</Typography>
          <Tooltip title="Edit rent types & growth" arrow>
            <IconButton size="small" onClick={handleOpenGrowthModal} sx={{ p: 0.25 }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
      renderCell: (params) => (
        showMarketRentAssumptions ? (
          <span className="u-muted">{params.value}</span>
        ) : (
          <RentTypeDropdown
            value={params.value}
            onChange={(newValue) => handleCellChange(params.id, 'rent_type', newValue)}
            options={growthRates.filter(rate => rate.type === 'rental')}
          />
        )
      )
    },
    
    ...(activeStepTitle === "Residential Rental Units"
      ? {
          growth_rate: {
            field: 'growth_rate',
            headerName: 'Growth Rate',
            width: 120,
            editable: false,
            cellClassName: 'u-noneditable-cell',
            renderHeader: () => (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 14.5, color: '#1f2937' }}>Growth %</Typography>
                <Tooltip title="Edit rent types & growth" arrow>
                  <IconButton size="small" onClick={handleOpenGrowthModal} sx={{ p: 0.25 }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            ),
            renderCell: (params) => (
              <span>
                <span className="u-value">{Number(params.value ?? 0).toLocaleString()}</span>
                <span className="u-unit">%</span>
              </span>
            )
          }
        }
      : {}),

    vacate_flag: {
      field: 'vacate_flag',
      headerName: 'Vacate?',
      width: 200,
      editable: false,
      cellClassName: 'u-editable-cell',
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        const v = params.value !== undefined && params.value !== null ? Number(params.value) : null;
        const tooltipText =
          v === 0
            ? "Keep Tenant: Tenant stays, rent follows annual growth assumptions."
            : v === 1
            ? "Vacate & Re-Lease: Tenant leaves, unit goes vacant, then re-leases at market rents."
            : v === 2
            ? "Market Adjustment: Tenant remains, rent immediately adjusts to market this year."
            : "Select rent change behavior";
        return (
          <Tooltip title={tooltipText} arrow placement="left">
            <Box component="span" sx={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <select
          value={params.value !== undefined && params.value !== null ? params.value : ''}
          onChange={(e) => handleCellChange(params.id, 'vacate_flag', parseInt(e.target.value, 10))}
          onKeyDown={(e) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
              e.stopPropagation();
            }
          }}
          style={{ width: '100%', background: 'transparent', border: 'none', borderRadius: 4, padding: '8px 28px 8px 8px', outline: 'none', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', color: 'inherit', fontSize: 14.5, fontWeight: 500, fontFamily: 'inherit', textAlign: 'center', textAlignLast: 'center' }}
          className="u-select"
        >
                <option value={0}>Keep Tenant</option>
                <option value={1}>Vacate & Re-Lease</option>
                <option value={2}>Market Adjustment</option>
        </select>
        <span className="u-caret" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>▾</span>
            </Box>
          </Tooltip>
        );
      },
      type: 'number'
    },
    vacate_month: { field: 'vacate_month', headerName: 'Vacate Month', width: 120, editable: false, type: 'number',
      cellClassName: 'u-editable-cell',
      renderCell: (params) => <NumberInputCell prefix={'Month '} params={params} handleCellChange={handleCellChange} field={'vacate_month'} />,
     },
     pf_rent: {
      field: 'pf_rent',
      headerName: 'Pro Forma Rent',
      width: 200,
      editable: false,
      cellClassName: 'u-noneditable-cell',
      renderHeader: () => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 14.5, color: '#1f2937' }}>Pro Forma Rent</Typography>
          <Tooltip title="Edit Pro Forma Rents" arrow>
            <IconButton size="small" onClick={handleOpenPfModal} sx={{ p: 0.25 }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
      type: 'number',
      renderCell: (params) => (
        <span>
          <span className="u-value">$ {Number(params.value ?? 0).toLocaleString()}</span>{' '}
          <span className="u-unit">/ month</span>
        </span>
      ),
    },
     delete: {
      field: 'delete',
      headerName: '',
      width: 100,
      renderCell: (params) => (
        <span className="u-row-action">
          <Tooltip title="Delete">
            <span>
              <IconButton
                onClick={() => handleDeleteRow(params.id)}
                color="error"
                disabled={units.length === 1}
                size="small"
                sx={{
                  color: units.length === 1 ? 'gray' : 'error.main',
                  cursor: units.length === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                <DeleteIcon />
              </IconButton>
            </span>
          </Tooltip>
        </span>
      )
    }
  };

  // Build columns dynamically and make them flex to fill 100% width
  const flexByField: Record<string, number> = {
    unitNumber: 0.6,
    layout: 0.9,
    square_feet: 0.9,
    current_rent: 1,
    rent_type: 1,
    growth_rate: 0.8,
    pf_rent: 1.3,
    vacate_flag: 1.3,
    vacate_month: 0.9,
    delete: 0.3,
  };

  const columns: GridColDef[] = fieldsToShow
    .filter((field) => field !== 'pf_rent' || showMarketRentAssumptions)
    // .filter((field) => field !== 'rent_type' || showGrowthRates)
    .map((field) => {
      const col = { ...allColumns[field] } as GridColDef;
      // Ensure flexible columns that fill the grid width
      delete (col as any).width;
      col.flex = flexByField[field] ?? 1;
      col.minWidth = col.minWidth ?? 70;
      if (highlightedFields && highlightedFields.includes(field)) {
        col.headerClassName = 'u-highlight';
        col.cellClassName = 'u-highlight';
      }
      return col;
    });

  const handleCellChange = (id: GridRowId, field: string, value: any) => {
    setUnits((prevUnits) =>
      prevUnits.map((unit) =>
        unit.id === id ? { ...unit, [field]: value } : unit
      )
    );
  };

  const handleCellCopy = (event: ClipboardEvent) => {
    event.preventDefault();
    if (selectedCell) {
      const { rowIdx, columnKey } = selectedCell;
      const value = units[rowIdx][columnKey as keyof Unit];

      event.clipboardData?.setData('text/plain', String(value));
    }
  };

  const handlePaste = (event: ClipboardEvent) => {
    setIsPasteOperation(true);
    const clipboardData = event.clipboardData || (window as any).clipboardData;
    const pastedData = clipboardData.getData('Text');
    setPastedText(pastedData);
  };

  // Add event listeners for copy and paste events
  useEffect(() => {
    document.addEventListener('copy', handleCellCopy);
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('copy', handleCellCopy);
      document.removeEventListener('paste', handlePaste);
    };
  }, [selectedCell]);

  const updateUnits = (count: number) => {

    const newUnits: Unit[] = Array.from({ length: count }, () => ({
      id: generateUniqueId(),
      rent_type: growthRates[0].name,
      vacate_flag: 0,
      layout: marketRentAssumptions[0].layout,
      square_feet: 0,
      vacate_month: 0,
      current_rent: null
    }));
    setUnits([...units, ...newUnits]);
  };

  const processRowUpdate = (newRow: Unit) => {


    newRow.vacate_month = Math.max(0, Math.round(Number(newRow.vacate_month)));
    newRow.square_feet = Math.max(0, newRow.square_feet);
    newRow.current_rent = Math.max(0, newRow.current_rent || 0);
    
    setUnits((prevUnits) =>
      prevUnits.map((unit) =>
        unit.id === newRow.id ? newRow : unit
      )
    );
    return newRow;
  };

  const handleDeleteRow = (id: GridRowId) => {
    // Drop focus first so the grid doesn't query a soon-deleted cell
    try {
      if (typeof window !== 'undefined' && (document as any)?.activeElement) {
        (document as any).activeElement?.blur?.();
      }
    } catch {}
    // Defer actual removal until the next frame to let MUI finish the event cycle
    requestAnimationFrame(() => {
    setUnits((prevUnits) => prevUnits.filter((unit) => unit.id !== id));
    });
  };

  const handleDuplicateRow = (id: GridRowId) => {
    const unitToDuplicate = units.find((unit) => unit.id === id);
    if (unitToDuplicate) {
      const newUnit = { ...unitToDuplicate, id: generateUniqueId() };
      setUnits((prevUnits) => [...prevUnits, newUnit]);
    }
  };

  // Update rows to include unitNumber and pf_rent
  const rows = units.map((unit, index) => {
    const matchingAssumption = marketRentAssumptions.find(
      assumption => assumption.layout === unit.layout
    );
    const gr = growthRates.find((r) => r.type === 'rental' && r.name?.toString().trim().toLowerCase() === (unit.rent_type ?? '').toString().trim().toLowerCase());
    return {
      ...unit,
      unitNumber: index + 1,
      pf_rent: unit.vacate_flag === 0 ? (unit.current_rent || 0) : (matchingAssumption?.pf_rent || 0),
      growth_rate: gr?.value ?? 0
    };
  });

  const getRowClassName = (params: any) =>
    params.indexRelativeToCurrentPage % 2 === 0 ? 'u-row-odd' : 'u-row-even';

  // Calculate totals
  const totalSquareFeet = units.reduce((sum, unit) => sum + (unit.square_feet || 0), 0);
  const totalCurrentRent = units.reduce((sum, unit) => sum + (unit.current_rent || 0), 0);
  const totalPfRent = rows.reduce((sum, row) => 
    sum + (row.vacate_flag === 0 ? (row.current_rent || 0) : (row.pf_rent || 0)), 0
  );

  // Deprecated event wiring removed in favor of props-based totals

  const CustomFooter = () => (
    <div style={{ 
      padding: '14px 16px', 
      backgroundColor: '#ffffff', 
      borderTop: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: 14.5
    }}>
      {allowAddUnit ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={addSingleUnit}>
            Add Unit
          </Button>
        </div>
      ) : (
        <div />
      )}
      <div style={{ display: 'flex', gap: '18px', marginLeft: 'auto', justifyContent: 'flex-end', textAlign: 'right', color: '#1f2937' }}>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontWeight: 600 }}>Total Units:</span> {units.length}
        </div>
        {(() => {
          const grossSqFtField = modelDetails?.user_model_field_values.find((field: any) => field.field_key == "Gross Square Feet");
          const grossSqFtValue = grossSqFtField ? Number(grossSqFtField.value) : null;
          const isWarning = grossSqFtValue !== null && totalSquareFeet > grossSqFtValue;
          return (
            <>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 600 }}>Total Rentable Square Feet:</span>{" "}
                <span style={isWarning ? { color: "#d32f2f", fontWeight: 600 } : {}}>
                  {totalSquareFeet.toLocaleString()}
                </span>
              </div>
              {grossSqFtField && (
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 600 }}>Gross Square Feet:</span>{" "}
                  {grossSqFtField.value !== undefined && grossSqFtField.value !== null && !isNaN(Number(grossSqFtField.value))
                    ? Number(grossSqFtField.value).toLocaleString()
                    : "N/A"}
                </div>
              )}
            </>
          );
        })()}

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontWeight: 600 }}>Total Current Rent:</span> ${totalCurrentRent.toLocaleString()}
        </div>
        {showMarketRentAssumptions && (
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontWeight: 600 }}>Total Pro Forma Rent:</span> ${totalPfRent.toLocaleString()}
          </div>
        )}
      </div>
      {units.length > 100 && (
        <GridPagination />
      )}
    </div>
  );

  const handleOpenModal = () => setOpen(true);
  const handleCloseModal = () => setOpen(false);
  const handleOpenGrowthModal = () => setGrowthOpen(true);
  const handleCloseGrowthModal = () => setGrowthOpen(false);
  const handleOpenPfModal = () => setPfOpen(true);
  const handleClosePfModal = () => setPfOpen(false);

  const layoutExists = marketRentAssumptions.some(
    (a) => a.layout.trim().toLowerCase() === newLayoutName.trim().toLowerCase()
  );

  const growthRateExists = growthRates.some(
    (r) => r.name.trim().toLowerCase() === newGrowthRateName.trim().toLowerCase()
  );

  const isAddGrowthRateDisabled = !newGrowthRateName.trim() || growthRateExists;

  const isAddDisabled = !newLayoutName.trim() || layoutExists;

  return (
    <>
      <div style={{padding: 20}}>


        {/* <div style={{ marginBottom: 10, padding: 20, paddingBottom: 10 }}>
          {showMarketRentLayouts && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <label>
                  Add units:
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={unitCount}
                    onChange={(e) => {
                      let newCount = parseInt(e.target.value, 10) || 1;
                      if (newCount < 1) newCount = 1;
                      if (newCount > 100) newCount = 100;
                      setUnitCount(newCount);
                    }}
                    style={{ marginLeft: '10px' }}
                  />
                </label>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => updateUnits(unitCount)}
                  sx={{ marginLeft: '10px' }}
                >
                  Add {unitCount} {unitCount > 1 ? 'Units' : 'Unit'}
                </Button>
              </div>
              <div>
                <Button
                  variant="contained"
                  size="small"
                  sx={{ marginRight: '10px' }}
                  onClick={handleOpenGrowthModal}
                >
                  Edit Rent Types & Growth Rates
                </Button>
                
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleOpenModal}
                >
                  Edit Layouts
                </Button>
              </div>
            </div>
          )}

{growthRatesOnly && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
               
              </div>
              <div>
                <Button
                  variant="contained"
                  size="small"
                  sx={{ marginRight: '10px' }}
                  onClick={handleOpenGrowthModal}
                >
                  Edit Rent Types & Growth Rates
                </Button>
                
                
              </div>
            </div>
          )}




          
        </div>
     */}
          <Box
            sx={{
              width: '100%',
              overflowX: 'auto',
            }}
          >
            <DataGrid
              rows={rows}
              columns={columns.map((column) => ({ ...column, sortable: false }))}
              autoHeight
              disableRowSelectionOnClick
              processRowUpdate={processRowUpdate}
              slots={{
                footer: CustomFooter
              }}
              rowHeight={52}
             
              getRowClassName={getRowClassName}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[100]}
              columnVisibilityModel={{
                vacate_flag: vacate,
                vacate_month: vacate,
              }}
              hideFooterSelectedRowCount
              disableColumnMenu
              disableColumnFilter
              disableColumnSelector
              disableColumnSorting
              sx={{
                minWidth: vacate ? '1160px' : '900px', 
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 2,
                
                '& .MuiDataGrid-main': {
                  background: '#ffffff',
                },
                '& .MuiDataGrid-columnHeaders': {
                  background: '#ffffff',
                  minHeight: 52,
                  maxHeight: 52,
                  borderBottom: '1px solid #e5e7eb',
                  minWidth: vacate ? '1160px' : '900px',
                },
                '& .MuiDataGrid-columnHeader': {
                  background: '#ffffff',
                  minHeight: 52,
                  maxHeight: 52,
                },
                '& .MuiDataGrid-columnHeaderTitleContainer': {
                  background: '#ffffff',
                },
                // Standardize header font across all columns
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 600,
                  fontSize: 14.5,
                  fontFamily: 'inherit',
                  textTransform: 'none',
                  lineHeight: '52px',
                  color: '#1f2937',
                  letterSpacing: '0.2px',
                },
                // Cleaner grid appearance
                // '& .MuiDataGrid-columnSeparator': { display: 'none' },
                '& .MuiDataGrid-cell': { 
                  borderBottom: '1px solid rgba(15, 23, 42, 0.08)', 
                  background: '#ffffff',
                  fontSize: 14.5,
                  color: '#1f2937',
                },
                '& .MuiDataGrid-cell.u-noneditable-cell': { color: '#64748b' },
                '& .MuiDataGrid-cell:not(.u-editable-cell):not(.u-noneditable-cell)': { color: '#6b7280' },
                '& .u-editable-input': {
                  border: 'none',
                  borderBottom: '1px solid transparent',
                  borderRadius: 0,
                  background: 'transparent',
                },
                '& .MuiDataGrid-row:hover .u-editable-input, & .u-editable-input:focus': {
                  borderBottom: '2px solid #4f8bd6 !important',
                },
                '& .MuiDataGrid-row': { background: '#ffffff' },
                '& .u-row-odd': { background: '#ffffff' },
                '& .u-row-even': { background: '#f9fafb' },
                '& .MuiDataGrid-row:hover': { backgroundColor: '#f3f6fb' },
                // Row action visibility only on hover/focus
                '& .u-row-action': {
                  opacity: 0,
                  visibility: 'hidden',
                  pointerEvents: 'none',
                  transition: 'opacity 120ms ease'
                },
                '& .MuiDataGrid-row:hover .u-row-action, & .MuiDataGrid-cell:focus-within .u-row-action': {
                  opacity: 1,
                  visibility: 'visible',
                  pointerEvents: 'auto'
                },
                // Custom caret via element: hidden by default, shown on row hover or focus
                '& .u-caret': { opacity: 0, transition: 'opacity 120ms ease', color: colors.blue, fontSize: '1.25rem' },
                '& .u-select:focus + .u-caret': { opacity: 1 },
                '& .MuiDataGrid-row:hover .u-caret': { opacity: 1 },
                '& .MuiDataGrid-cell:hover .u-caret': { opacity: 1 },
                '& .MuiDataGrid-virtualScroller': {
                  background: '#ffffff',
                  overflowX: 'auto',
                },
                '& .MuiDataGrid-virtualScrollerContent': {
                  minWidth: vacate ? '1160px' : '900px',
                },
                '& .MuiDataGrid-columnHeadersInner': {
                  minWidth: vacate ? '1160px' : '900px',
                },
                '& .MuiDataGrid-footerContainer': {
                  background: '#ffffff',
                  borderTop: '1px solid #e5e7eb',
                },
                '& .u-select': {
                  color: '#1f2937',
                  fontSize: 14.5,
                  fontFamily: 'inherit',
                  fontWeight: 500,
                },
                '& .u-unit': {
                  color: '#6b7280',
                  fontWeight: 500,
                },
                '& .u-value': {
                  color: '#111827',
                  fontWeight: 600,
                },
                '& .u-muted': {
                  color: '#9aa3b2',
                  fontWeight: 400,
                },
                '& .u-muted .u-select': {
                  color: '#9aa3b2',
                  fontWeight: 400,
                },
              }}
            />
          </Box>
 
      </div>




      <Dialog open={growthOpen} onClose={handleCloseGrowthModal} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Rent Type</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 160px 72px',
                gap: 1,
                px: 1,
                py: 0.5,
                mb: 1,
                borderBottom: '1px solid #e0e0e0'
              }}
            >
              <Typography variant="caption" sx={{ fontSize: 14, fontWeight: 700, color: 'text.secondary' }}>Name</Typography>
              <Typography variant="caption" sx={{ fontSize: 14, fontWeight: 700, color: 'text.secondary', textAlign: 'right' }}>Growth Rate %</Typography>
              <Typography variant="caption" sx={{ fontSize: 14, fontWeight: 700, color: 'text.secondary', textAlign: 'center' }}>Remove</Typography>
            </Box>
            {growthRates.filter(rate => rate.type === 'rental').map((rate, idx) => (
              <Box
                key={`${rate.type}:${rate.name}`}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 160px 72px',
                  gap: 1,
                  alignItems: 'center',
                  px: 1.5,
                  py: 1,
                  minHeight: 44,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  mb: 1
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    value={nameEdit[idx] !== undefined ? nameEdit[idx] : rate.name}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNameEdit((prev) => ({ ...prev, [idx]: v }));
                      setNameError((prev) => ({ ...prev, [idx]: '' }));
                    }}
                    variant="standard"
                    size="small"
                    placeholder="Untitled"
                    sx={{ pl: 1, pr: 1, minWidth: 0, flex: 1 }}
                    inputProps={{ maxLength: 100, readOnly: nameEdit[idx] === undefined }}
                    error={Boolean(nameError[idx])}
                    helperText={nameError[idx] || undefined}
                    FormHelperTextProps={{ sx: { m: 0 } }}
                  />
                  {nameEdit[idx] === undefined ? (
                    <IconButton
                      size="small"
                      onClick={() => {
                        setNameEdit((prev) => ({ ...prev, [idx]: rate.name }));
                        setNameError((prev) => ({ ...prev, [idx]: '' }));
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  ) : (
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => {
                        const raw = nameEdit[idx] ?? '';
                        const newName = raw.trim();
                        if (!newName) {
                          setNameError((prev) => ({ ...prev, [idx]: 'Name required' }));
                          return;
                        }
                        const isDup = growthRates.some((r, i) => r.type === 'rental' && i !== idx && r.name.trim().toLowerCase() === newName.toLowerCase());
                        if (isDup) {
                          setNameError((prev) => ({ ...prev, [idx]: 'Duplicate name' }));
                          return;
                        }
                        const oldName = rate.name;
                        const updatedRates = growthRates.map((r, i) =>
                          r.type === 'rental' && i === idx ? { ...r, name: newName } : r
                        );
                        setGrowthRates(updatedRates);
                        setUnits((prev) => prev.map((u) => (u.rent_type === oldName ? { ...u, rent_type: newName } : u)));
                        setNameEdit((prev) => {
                          const copy = { ...prev };
                          delete copy[idx];
                          return copy;
                        });
                        setNameError((prev) => {
                          const copy = { ...prev };
                          delete copy[idx];
                          return copy;
                        });
                      }}
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <NumberInput
                  value={rate.value}
                  onChange={(val) => {
                    const parsed = val === '' ? 0 : Number(val);
                    const newGrowthRates = growthRates.map((r) =>
                      r.type === 'rental' && r.name === rate.name
                        ? { ...r, value: parsed }
                        : r
                    );
                    setGrowthRates(newGrowthRates);
                  }}
                  size="small"
                  variant="standard"
                  sx={{
                    width: '100%',
                    '& .MuiInputBase-root': { backgroundColor: 'transparent' }
                  }}
                  endAdornment={<InputAdornment position="end">%</InputAdornment>}
                  InputProps={{ sx: { textAlign: 'right' } }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Tooltip
                    title={units.some(unit => unit.rent_type === rate.name) ? "Cannot delete: used by a unit" : "Delete"}
                    disableHoverListener={!units.some(unit => unit.rent_type === rate.name)}
                    disableFocusListener={!units.some(unit => unit.rent_type === rate.name)}
                    disableTouchListener={!units.some(unit => unit.rent_type === rate.name)}
                    arrow
                  >
                    <span>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => {
                          const removeIdx = growthRates.findIndex((r) => r.type === 'rental' && r.name === rate.name);
                          const newGrowthRates = growthRates.filter((_, i) => i !== removeIdx);
                          setGrowthRates(newGrowthRates);
                        }}
                        disabled={units.some(unit => unit.rent_type === rate.name)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
            ))}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, width: '100%' }}>
              <TextField
                label="New Growth Rate Name"
                value={newGrowthRateName}
                onChange={(e) => setNewGrowthRateName(e.target.value)}
                size="small"
                sx={{ mr: 2, flex: 1 }}
                error={growthRateExists}
                helperText={growthRateExists ? "Growth rate name already exists" : ""}
                fullWidth
              />
              <Button
                variant="outlined"
                onClick={() => {
                  setGrowthRates([
                    ...growthRates,
                    { name: newGrowthRateName.trim(), value: 0, type: 'rental' }
                  ]);
                  setNewGrowthRateName('');
                }}
                disabled={isAddGrowthRateDisabled}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Add Growth Rate
              </Button>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={handleCloseGrowthModal} variant="contained">Done</Button>
          </Box>
        </DialogContent>
      </Dialog>

    

      <Dialog open={open} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Market Rent Assumptions</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            {marketRentAssumptions.map((assumption, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: 'grey.100',
                  minHeight: 36,
                  fontSize: 15
                }}
              >
                <Box sx={{ flex: 1, fontWeight: 500, color: 'text.primary', pl: 1 }}>
                  {assumption.layout || <span style={{ color: '#aaa' }}>Untitled</span>}
                </Box>
                {marketRentAssumptions.length > 1 && (
                  <Button
                    color="error"
                    size="small"
                    variant="text"
                    disabled={units.some(unit => unit.layout === assumption.layout)}
                    onClick={() => {
                      const newAssumptions = marketRentAssumptions.filter((_, i) => i !== idx);
                      setMarketRentAssumptions(newAssumptions);
                    }}
                    sx={{
                      minWidth: 0,
                      px: 1,
                      ml: 1,
                      fontSize: 13
                    }}
                  >
                    Delete
                  </Button>
                )}
              </Box>
            ))}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <TextField
                label="New Layout Name"
                value={newLayoutName}
                onChange={(e) => setNewLayoutName(e.target.value)}
                size="small"
                sx={{ mr: 2 }}
                error={layoutExists}
                helperText={layoutExists ? "Layout name already exists" : ""}
              />
              <Button
                variant="outlined"
                onClick={() => {
                  setMarketRentAssumptions([
                    ...marketRentAssumptions,
                    { layout: newLayoutName.trim(), pf_rent: 0 }
                  ]);
                  setNewLayoutName('');
                }}
                disabled={isAddDisabled}
              >
                Add Layout
              </Button>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={handleCloseModal} variant="contained">Done</Button>
          </Box>
        </DialogContent>
      </Dialog>
      <Dialog
        open={pfOpen}
        onClose={handleClosePfModal}
        disablePortal
        container={() => document.getElementById('create-model-content')}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: { xs: 'calc(100% - 16px)', md: 960 },
            mx: { xs: 1, md: 'auto' }
          }
        }}
      >
        <DialogTitle>Let's determine market rents for the residential units</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, overflowX: 'auto' }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '0.8fr 1fr 1.2fr 1fr 1.4fr' },
                gap: 1,
                px: 1,
                py: 0.5,
                mb: 1,
                borderBottom: '1px solid #e0e0e0',
                minWidth: { xs: 640, sm: 'auto' }
              }}
            >
              <Typography variant="caption" sx={{ fontSize: 14, fontWeight: 700, color: 'text.secondary' }}>Layout</Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                <Typography variant="caption" sx={{ fontSize: 14, fontWeight: 700, color: 'text.secondary' }}>Avg Current Rent</Typography>
                <Tooltip
                  title={"Averages of current rent exclude vacant or non-paying units; Averages are calculated only on currently paying units"}
                  arrow
                >
                  <IconButton size="small" sx={{ p: 0.25 }}>
                    <InfoOutlinedIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                <Typography variant="caption" sx={{ fontSize: 14, fontWeight: 700, color: 'text.secondary' }}>Avg Current Rent / SF</Typography>
                <Tooltip
                  title={"Averages of current rent / sf exclude vacant or non-paying units; Averages are calculated only on currently paying units"}
                  arrow
                >
                  <IconButton size="small" sx={{ p: 0.25 }}>
                    <InfoOutlinedIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="caption" sx={{ fontSize: 14, fontWeight: 700, color: 'text.secondary', textAlign: 'right' }}>Pro Forma Rent / SF</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                <Typography variant="caption" sx={{ fontSize: 14, fontWeight: 700, color: 'text.secondary' }}>Market Rents</Typography>
                <Tooltip
                  title={"If you have units vacating in the next step, the new rents will be reset to the market rents in the model. The market rents are also how you will show “Gross Potential Rent” in the financials."}
                  arrow
                >
                  <IconButton size="small" sx={{ p: 0.25 }}>
                    <InfoOutlinedIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {marketRentAssumptions
              .filter(assumption => units.some(unit => unit.layout === assumption.layout))
              .map((assumption, idx) => (
               <Box
                key={`${assumption.layout}-${idx}`}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '0.8fr 1fr 1.2fr 1fr 1.4fr' },
                  gap: 1.5,
                  alignItems: 'center',
                  mb: 1.2,
                  px: 1.5,
                  py: 1,
                  backgroundColor: 'grey.100',
                  borderRadius: 1,
                  minWidth: { xs: 640, sm: 'auto' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 500, color: '#444' }}>{assumption.layout}</Typography>
                </Box>

                {(() => {
                  const layoutUnitsAll = units.filter((u) => u.layout === assumption.layout);
                  // Include only units with vacate_flag = 0 OR (vacate_flag in {1,2} AND vacate_month > 0)
                  const layoutUnits = layoutUnitsAll.filter((u) => {
                    const vf = Number(u?.vacate_flag ?? 0);
                    const vm = Number(u?.vacate_month ?? 0);
                    if (vf === 0) return true;
                    if ((vf === 1 || vf === 2) && vm > 0) return true;
                    return false;
                  });
                  const numUnitsAtLayout = layoutUnits.length;
                  const totalSqFtAtLayout = layoutUnits.reduce((sum, u) => sum + (Number(u.square_feet) || 0), 0);
                  const totalCurrentRentAtLayout = layoutUnits.reduce((sum, u) => sum + (Number(u.current_rent) || 0), 0);
                  const avgCurrentRentAtLayout = numUnitsAtLayout > 0 ? (totalCurrentRentAtLayout / numUnitsAtLayout) : 0;
                  const avgCurrentRentPerSf = totalSqFtAtLayout > 0 ? (totalCurrentRentAtLayout / totalSqFtAtLayout) : 0;
                  const proFormaRentPerSf = totalSqFtAtLayout > 0 ? ((numUnitsAtLayout * (assumption.pf_rent || 0)) / totalSqFtAtLayout) : 0;
                  return (
                    <>
                      <Typography sx={{ fontWeight: 600, color: '#222', textAlign: 'right' }}>
                        ${avgCurrentRentAtLayout.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </Typography>
                      <Typography sx={{ fontWeight: 600, color: '#222', textAlign: 'right' }}>
                        ${avgCurrentRentPerSf.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                      <Typography sx={{ fontWeight: 600, color: '#222', textAlign: 'right' }}>
                        ${proFormaRentPerSf.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </>
                  );
                })()}

                <NumberInput
                  variant="outlined"
                  size="small"
                  value={assumption.pf_rent}
                  startAdornment={<InputAdornment position="start">$</InputAdornment>}
                  endAdornment={<InputAdornment position="end">/ month</InputAdornment>}
                  onChange={(val) => {
                    const num = val === '' ? 0 : Number(val);
                    const newAssumptions = marketRentAssumptions.map((a) =>
                      a.layout === assumption.layout ? { ...a, pf_rent: num } : a
                    );
                    setMarketRentAssumptions(newAssumptions);
                  }}
                  sx={{
                    '& .MuiInputBase-root': { bgcolor: 'white' },
                  }}
                  fullWidth
                  InputProps={{ sx: { textAlign: 'right' } }}
                />
              </Box>
            ))}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={handleClosePfModal} variant="contained">Done</Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UnitTable;
