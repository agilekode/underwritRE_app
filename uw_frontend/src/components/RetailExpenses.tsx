import React, { useMemo } from "react";
import { DataGrid, GridColDef, GridRowId } from "@mui/x-data-grid";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { Expense } from "../utils/interface";
import { TextInputCell } from "./TextInputCell";
import { NumberDecimalInputCell } from "./NumberDecimalInputCell";
import { colors, typography } from "../theme";

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
        headerName: "$ / SF / Year",
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
          return <span style={{ color: colors.grey[600] }}>${Number(annual).toLocaleString()}</span>;
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
      <Box
        sx={{
          p: 2,
          backgroundColor: colors.white,
          borderTop: `1px solid ${colors.grey[300]}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          fontSize: 14.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button variant="contained" size="small" onClick={addRow} sx={{ whiteSpace: 'nowrap', minWidth: 200 }}>
            Add Retail Expense
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 3, justifyContent: 'flex-end', width: '100%', color: colors.grey[700] }}>
          <Box sx={{ textAlign: 'right', fontWeight: 600 }}>
            Total Retail Expenses:{' '}
            <Box component="span" sx={{ fontWeight: 700, color: colors.grey[900] }}>
              ${totalAnnual.toLocaleString()}
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ mb: 2 }}>
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
              background: colors.white,
              minWidth: '900px',
              border: `1px solid ${colors.grey[300]}`,
              borderRadius: 2,
              fontFamily: typography.fontFamily,
              fontSize: 14.5,
              '& .MuiDataGrid-cell, & .MuiDataGrid-columnHeader, & .MuiDataGrid-columnHeaderTitle, & .MuiDataGrid-cellContent': {
                fontFamily: typography.fontFamily,
                fontSize: 14.5,
              },
              '& .MuiDataGrid-main': { background: colors.white },
              '& .MuiDataGrid-columnHeaders': { background: colors.white, minHeight: 52, maxHeight: 52, borderBottom: `1px solid ${colors.grey[300]}` },
              '& .MuiDataGrid-columnHeader': { background: colors.white, minHeight: 52, maxHeight: 52 },
              '& .MuiDataGrid-columnHeaderTitleContainer': { background: colors.white },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 600,
                fontSize: 14.5,
                fontFamily: typography.fontFamily,
                textTransform: 'none',
                lineHeight: '52px',
                color: colors.grey[900],
              },
              '& .MuiDataGrid-cell': { borderBottom: `1px solid ${colors.grey[300]}`, background: colors.white, fontSize: 14.5, color: colors.grey[900] },
              // Hover underline for editable inputs
              '& .u-editable-input': { border: 'none', borderBottom: '2px solid transparent', borderRadius: 0, background: 'transparent', fontWeight: 600 },
              '& .MuiDataGrid-row:hover .u-editable-input, & .u-editable-input:focus': { borderBottom: `2px solid ${colors.blue} !important` },
              '& .MuiDataGrid-row': { background: colors.white },
              '& .u-row-even': { background: colors.grey[50] },
              '& .MuiDataGrid-row:hover': { backgroundColor: colors.blueTint },
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
              '& .MuiDataGrid-virtualScroller': { background: colors.white },
              '& .MuiDataGrid-footerContainer': { background: colors.white }
            }}
          />
      </Box>
    </Box>
  );
};

