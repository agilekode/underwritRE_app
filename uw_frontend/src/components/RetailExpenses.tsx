import React, { useMemo } from "react";
import { DataGrid, GridColDef, GridRowId } from "@mui/x-data-grid";
import { Box, Button, Typography, IconButton, Paper, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { Expense } from "../utils/interface";
import { TextInputCell } from "./TextInputCell";
import { NumberInputCell } from "./NumberInputCell";
import { HEADER_FOOTER_HEIGHT, ROW_HEIGHT } from "../utils/constants";
import { NumberDecimalInputCell } from "./NumberDecimalInputCell";

export const RetailExpenses = ({
  expenses,
  setExpenses,
  step,
  totalRetailSF,
}: {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  step: string;
  totalRetailSF: number;
}) => {
  const expenseType = "Retail";

  // Only show expenses for this type
  const filteredExpenses = expenses.filter((exp) => exp.type === expenseType);

  const handleCellChange = (id: string, field: string, value: string | number) => {
    setExpenses((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    const newRow: Expense = {
      id: String(Date.now()),
      name: "",
      factor: "per SF",
      cost_per: 0,
      statistic: null,
      type: expenseType,
      start_month: 0,
      end_month: 0,
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
    name: 1.6,
    cost_per: 1,
    annual: 1,
    delete: 0.4,
  };

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
      {
        field: "cost_per",
        headerName: "$ / SF / Year”",
        flex: flexByField.cost_per,
        minWidth: 130,
        editable: false,
        type: "number",
        renderCell: (params: any) => (
          <NumberDecimalInputCell
            params={params}
            handleCellChange={handleCellChange}
            field="cost_per"
            prefix="$"
            suffix=""
          />
        ),
      },
      {
        field: "annual",
        headerName: "Annual",
        flex: flexByField.annual,
        minWidth: 110,
        editable: false,
        valueGetter: (params: any) => {
          const cost = Number(params?.row?.cost_per || 0);
          return cost * Number(totalRetailSF || 0);
        },
        renderCell: (params: any) => {
          const cost = Number(params?.row?.cost_per || 0);
          const annual = cost * Number(totalRetailSF || 0);
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
    const totalAnnual = (filteredExpenses || []).reduce((sum, row) => sum + (Number(row.cost_per || 0) * Number(totalRetailSF || 0)), 0);
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
            rows={filteredExpenses}
            columns={columns}
            disableRowSelectionOnClick
            getRowId={(row) => row.id}
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
