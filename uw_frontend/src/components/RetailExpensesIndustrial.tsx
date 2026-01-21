import React, { useEffect, useMemo } from "react";
import { DataGrid, GridColDef, GridRowId } from "@mui/x-data-grid";
import { Box, Button, Typography, IconButton, Paper, Tooltip, Select, MenuItem } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { Expense } from "../utils/interface";
import { TextInputCell } from "./TextInputCell";
import { NumberInputCell } from "./NumberInputCell";
import { HEADER_FOOTER_HEIGHT, ROW_HEIGHT } from "../utils/constants";
import { NumberDecimalInputCell } from "./NumberDecimalInputCell";

export const RetailExpensesIndustrial = ({
  expenses,
  setExpenses,
  step,
  totalRetailSF,
  retailIncome,
}: {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  step: string;
  totalRetailSF: number;
  retailIncome?: any[];
}) => {
  const expenseType = "Retail";

  // Only show expenses for this type (case-insensitive)
  const filteredExpenses = expenses.filter((exp) => (exp.type || '').toLowerCase() === expenseType.toLowerCase());

  // Ensure retail expenses have a stable id (for grid updates) if API omitted it
  useEffect(() => {
    let changed = false;
    const updated = expenses.map((row, idx) => {
      if ((row.type || '').toLowerCase() !== expenseType.toLowerCase()) return row;
      if (!row.id) {
        changed = true;
        return { ...row, id: `${Date.now()}-${idx}` };
      }
      return row;
    });
    if (changed) setExpenses(updated);
  }, [expenses, setExpenses]);

  const handleCellChange = (id: string | number, field: string, value: string | number) => {
    setExpenses((prev) =>
      prev.map((row) => (String(row.id) === String(id) ? { ...row, [field]: value } : row))
    );
    
  };

  const addRow = () => {
    const newRow: Expense = {
      id: String(Date.now()),
      name: "",
      factor: "per SF / Yr.",
      cost_per: 0,
      statistic: null,
      type: expenseType,
      start_month: 0,
      end_month: 0,
      rent_type_included: "Both",
    };
    setExpenses((prev) => [...prev, newRow]);
  };

  const deleteRow = (id: GridRowId) => {
    try {
      if (typeof window !== 'undefined' && (document as any)?.activeElement) {
        (document as any).activeElement?.blur?.();
      }
    } catch {}
    requestAnimationFrame(() => {
    setExpenses((prev) => prev.filter((row) => row.id !== id));
    });
  };

  // Flexible widths so columns fill the grid
  const flexByField: Record<string, number> = {
    name: 1.4,
    expense_growth: 0.9,
    factor: 1.1,
    cost_per: 1,
    statistic: 1,
    rent_type_included: 1,
    annual: 1,
    delete: 0.4,
  };

  // Sum of annual base rent from retail income (rent_per_square_foot_per_year * square_feet)
  const baseRentAnnual = useMemo(() => {
    const rows = Array.isArray(retailIncome) ? retailIncome : [];
    return rows.reduce((sum: number, r: any) => {
      const psf = Number(r?.rent_per_square_foot_per_year || 0);
      const sf = Number(r?.square_feet || 0);
      return sum + psf * sf;
    }, 0);
  }, [retailIncome]);

  const rows = useMemo(() => {
    return filteredExpenses.map((r) => ({
      ...r,
      id: String((r as any).id ?? ''), // enforce string id for grid stability
      rent_type_included: (r as any).rent_type_included ?? undefined,
    }));
  }, [filteredExpenses]);

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "name",
        headerName: "Name",
        flex: flexByField.name,
        minWidth: 160,
        editable: false,
        renderCell: (params: any) => <TextInputCell params={params} handleCellChange={handleCellChange} field="name" />,
      },
      // {
      //   field: "expense_growth",
      //   headerName: "Expense Growth",
      //   flex: flexByField.expense_growth,
      //   minWidth: 110,
      //   sortable: false,
      //   cellClassName: 'greyed-out-cell',
      //   renderCell: () => <span>2.0%</span>,
      // },
      {
        field: "factor",
        headerName: "Factor",
        flex: flexByField.factor,
        minWidth: 160,
        sortable: false,
        editable: false,
        renderCell: (params: any) => (
          <Select
            size="small"
            fullWidth
            value={(params.value as string) || "Annual"}
            onChange={(e) => handleCellChange(params.id as string, "factor", e.target.value as string)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            sx={{ background: 'transparent' }}
          >
            <MenuItem value="Annual">Annual</MenuItem>
            <MenuItem value="Percent of Base Rent">Percent of Base Rent</MenuItem>
            <MenuItem value="per SF / Yr.">per SF / Yr.</MenuItem>
          </Select>
        ),
      },
      {
        field: "cost_per",
        headerName: "Expense",
        flex: flexByField.cost_per,
        minWidth: 130,
        editable: false,
        type: "number",
        renderCell: (params: any) => {
          const factor = String(params?.row?.factor || "Annual");
          const prefix = factor === "Percent of Base Rent" ? "" : "$";
          const suffix = factor === "Percent of Base Rent" ? "%" : "";
          return (
          <NumberDecimalInputCell
            params={params}
            handleCellChange={handleCellChange}
            field="cost_per"
              prefix={prefix}
              suffix={suffix}
            />
          );
        },
      },
      {
        field: "statistic",
        headerName: "Statistic",
        flex: flexByField.statistic,
        minWidth: 150,
        sortable: false,
        cellClassName: 'greyed-out-cell',
        renderCell: (params: any) => {
          const factor = String(params?.row?.factor || "Annual");
          if (factor === "per SF / Yr.") {
            return <span>{Number(totalRetailSF || 0).toLocaleString()} SF</span>;
          }
          if (factor === "Percent of Base Rent") {
            return <span>${Number(baseRentAnnual || 0).toLocaleString()}</span>;
          }
          return <span>—</span>;
        },
      },
      {
        field: "rent_type_included",
        headerName: "Rent Type Included",
        flex: flexByField.rent_type_included,
        minWidth: 140,
        editable: false,
        renderCell: (params: any) => (
          <Select
            size="small"
            fullWidth
            value={params.value ?? "Both"}
            onChange={(e) => handleCellChange(params.id as string, "rent_type_included", e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            displayEmpty
            sx={{ background: 'transparent' }}
          >
            <MenuItem value="Both">Both</MenuItem>
            <MenuItem value="Gross">Gross</MenuItem>
            <MenuItem value="NNN">NNN</MenuItem>
            <MenuItem value="Neither">Neither</MenuItem>
          </Select>
        ),
      },
      {
        field: "annual",
        headerName: "Annual",
        flex: flexByField.annual,
        minWidth: 110,
        editable: false,
        renderCell: (params: any) => {
          const factor = String(params?.row?.factor || "Annual");
          const cost = Number(params?.row?.cost_per || 0);
          let annual = 0;
          if (factor === "Annual") {
            annual = cost;
          } else if (factor === "per SF / Yr.") {
            annual = cost * Number(totalRetailSF || 0);
          } else if (factor === "Percent of Base Rent") {
            annual = (cost / 100) * Number(baseRentAnnual || 0);
          }
          return <span style={{ color: "#555" }}>${Number(annual).toLocaleString()}</span>;
        },
      },
      {
        field: "delete",
        headerName: "",
        flex: flexByField.delete,
        minWidth: 70,
        sortable: false,
        renderHeader: () => <span />,
        renderCell: (params: any) => (
          <span className="u-row-action">
            <Tooltip title="Delete">
              <span>
                <IconButton onClick={() => deleteRow(params.id)} color="error" size="small">
                  <DeleteIcon />
                </IconButton>
              </span>
            </Tooltip>
          </span>
        ),
      },
    ],
    [expenses, totalRetailSF]
  );

  const getRowClassName = (params: any) =>
    params.indexRelativeToCurrentPage % 2 === 0 ? 'u-row-odd' : 'u-row-even';

  const CustomFooter = () => {
    const totalAnnual = (filteredExpenses || []).reduce((sum, row: any) => {
      const factor = String(row?.factor || "Annual");
      const cost = Number(row?.cost_per || 0);
      if (factor === "Annual") return sum + cost;
      if (factor === "per SF / Yr.") return sum + cost * Number(totalRetailSF || 0);
      if (factor === "Percent of Base Rent") return sum + (cost / 100) * Number(baseRentAnnual || 0);
      return sum;
    }, 0);
    return (
      <div style={{
        padding: '16px 16px',
        backgroundColor: 'transparent',
        borderTop: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 15
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button variant="contained" size="small" onClick={addRow} sx={{ whiteSpace: 'nowrap', minWidth: 220 }}>
            Add Retail Expense
          </Button>
        </div>
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'flex-end', width: '100%' }}>
          <div style={{ textAlign: 'right' }}>
            <strong>Total Retail Expenses:</strong> ${totalAnnual.toLocaleString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Paper variant="outlined" sx={{ p: 0, mb: 2 }}>
          <DataGrid 
            disableColumnMenu
            disableColumnFilter
            disableColumnSelector
            disableColumnSorting
            rows={rows}
            columns={columns}
            disableRowSelectionOnClick
            getRowId={(row) => String((row as any).id)}
            slots={{ footer: CustomFooter }}
            rowHeight={52}
            getRowClassName={getRowClassName}
            hideFooterSelectedRowCount
            sx={{
              background: '#f9fbfe',
              minWidth: '900px',
              '& .MuiDataGrid-main': { background: '#f9fbfe' },
              '& .MuiDataGrid-columnHeaders': { background: '#f9fbfe', minHeight: 52, maxHeight: 52 },
              '& .MuiDataGrid-columnHeader': { background: '#f9fbfe', minHeight: 52, maxHeight: 52 },
              '& .MuiDataGrid-columnHeaderTitleContainer': { background: '#f9fbfe' },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 700,
                fontSize: 15,
                fontFamily: 'inherit',
                textTransform: 'none',
                lineHeight: '52px'
              },
              '& .MuiDataGrid-cell': { borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#f9fbfe' },
              // Hover underline for editable inputs
              '& .u-editable-input': { border: 'none', borderBottom: '2px solid transparent', borderRadius: 0, background: 'transparent' },
              '& .MuiDataGrid-row:hover .u-editable-input, & .u-editable-input:focus': { borderBottom: '2px solid #1976d2 !important' },
              '& .MuiDataGrid-row': { background: '#f9fbfe' },
              '& .u-row-even': { background: '#fafafa' },
              '& .MuiDataGrid-row:hover': { backgroundColor: '#f5f5f5' },
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
              '& .MuiDataGrid-virtualScroller': { background: '#f9fbfe' },
              '& .MuiDataGrid-footerContainer': { background: '#f9fbfe' }
            }}
          />
      </Paper>
    </Box>
  );
};
