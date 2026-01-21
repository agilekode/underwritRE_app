import React, { useMemo, useEffect, useRef, useState } from "react";
import { DataGrid, GridColDef, GridRowId } from "@mui/x-data-grid";
import { Box, Button, Typography, IconButton, Paper, Switch, FormControlLabel, TextField, Tooltip, Autocomplete } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { Expense } from "../utils/interface";
import { TextInputCell } from "./TextInputCell";
import { NumberInputCell } from "./NumberInputCell";
import { HEADER_FOOTER_HEIGHT, ROW_HEIGHT } from "../utils/constants";
import { NumberDecimalInputCell } from "./NumberDecimalInputCell";
import { getOperatingExpenseAnnualByName } from "../utils/operatingExpenseCalc";
import { ExpensesSuggested, ExpensesBasic, ExpensesIndustrial} from "../utils/newModelConstants";

const EditableNameCell = React.memo(function EditableNameCell({
  initialValue,
  onCommit,
  onCancel,
}: {
  initialValue: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  const [localValue, setLocalValue] = useState<string>(initialValue ?? "");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Focus on mount
    const el = inputRef.current;
    if (el) {
      try {
        el.focus();
        // keep caret where user clicked; default to end
        const end = el.value.length;
        el.setSelectionRange(end, end);
      } catch {}
    }
  }, []);

  return (
    <TextField
      value={localValue}
      onChange={(e) => {
        // purely local to avoid parent re-render cursor jumps
        setLocalValue(e.target.value);
      }}
      variant="standard"
      size="small"
      fullWidth
      inputRef={inputRef}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        // Prevent DataGrid from hijacking typing/navigation
        e.stopPropagation();
        if (e.key === "Enter") {
          onCommit(localValue);
        } else if (e.key === "Escape") {
          onCancel();
        }
      }}
      onBlur={() => {
        onCommit(localValue);
      }}
      sx={{ minWidth: 0, width: '100%', '& .MuiInputBase-input': { padding: 0, textAlign: 'left', height: '100%' } }}
      InputProps={{ disableUnderline: true, sx: { px: 0, py: 0, height: 36, display: 'flex', alignItems: 'center', background: 'transparent' } }}
      inputProps={{ maxLength: 100 }}
    />
  );
});

const EXPENSE_STEPS_MAPPING = {
  "Closing Costs": "Closing Costs",
  "Legal and Pre-Development Costs": "Legal and Pre-Development Costs",
  "Reserves": "Reserves",
  "Hard Costs": "Hard Costs"
};


const CustomFooter = ({ expenses, expenseType, modelDetails, variables, operatingExpenses, units, amenityIncome, retailIncome, retailExpenses, onAdd, onAddWithName }: { expenses: Expense[], expenseType: string, modelDetails: any, variables: any, operatingExpenses: any[], units: any[], amenityIncome: any[], retailIncome: any[], retailExpenses: any[], onAdd: () => void, onAddWithName: (name: string) => void }) => {
  // Filter expenses for this specific type
  const filteredExpenses = expenses.filter(exp => exp.type === expenseType);
  const newExpenseInputRef = useRef<HTMLInputElement | null>(null);
  const suggestedOptions = useMemo(() => {
    const existing = new Set(
      filteredExpenses.map(e => (e.name || '').trim().toLowerCase())
    );
    // Merge Suggested + Basic, filter by current type, dedupe by lowercase name
    const mergedNames: string[] = [];
    const seen = new Set<string>();
    const source = [...ExpensesSuggested, ...ExpensesBasic].filter(s => s.type === expenseType);
    for (const item of source) {
      const name = (item?.name || '').trim();
      const key = name.toLowerCase();
      if (name && !seen.has(key)) {
        seen.add(key);
        mergedNames.push(name);
      }
    }
    // Exclude ones already added in this table
    return mergedNames.filter(n => !existing.has(n.trim().toLowerCase()));
  }, [expenses, expenseType]);
  
  // Calculate total monthly and annual expenses from rows
  const computedRows = filteredExpenses.map(row => {
    let monthly = 0;
    let annual = 0;
    
    if (row.factor && row.factor.toLowerCase() === "Total".toLowerCase()) {
      // For total expenses, divide by the number of months in the period
      const monthsInPeriod = (row.end_month || 12) - (row.start_month || 1) + 1;
      monthly = Math.round(((row.cost_per || 0) / monthsInPeriod) * 100) / 100;
      annual = row.cost_per || 0;
    } else if (row.factor && row.factor.toLowerCase() === "per Unit".toLowerCase() || row.factor && row.factor.toLowerCase() === "per SF".toLowerCase() || row.factor && row.factor.toLowerCase() === "per Month".toLowerCase()) {
      // For per-unit, per-SF, or per-month expenses
      const monthsInPeriod = (row.end_month || 12) - (row.start_month || 1) + 1;
      const totalCost = Number(row.cost_per || 0) * Number(row.statistic || 0);
      monthly = Math.round((totalCost / monthsInPeriod) * 100) / 100;
      annual = totalCost;
    } else if (row.factor && row.factor.toLowerCase() === "Percent of Purchase Price".toLowerCase()) {
      const acquisitionPriceField = modelDetails?.user_model_field_values?.find(
        (field: any) => field.field_key && field.field_key.trim() === "Acquisition Price"
      );
      const acquisitionPrice = Number(acquisitionPriceField?.value ?? 0);
      const monthsInPeriod = (row.end_month || 12) - (row.start_month || 1) + 1;
      monthly = Math.round((Number(row.cost_per)/100 * Number(acquisitionPrice) / monthsInPeriod) * 100) / 100;
      annual = Number(row.cost_per)/100 * Number(acquisitionPrice);
    } else if (row.factor && row.factor.toLowerCase() === "Percent of Acquisition Loan".toLowerCase()) {
      const acquisitionLoanRaw = variables?.["AQ: Max Acquisition Loan at Closing"];
                  const acquisitionLoan = Number(typeof acquisitionLoanRaw === "string" ? acquisitionLoanRaw.replace(/,/g, '').trim() : acquisitionLoanRaw ?? 0);
      const monthsInPeriod = (row.end_month || 12) - (row.start_month || 1) + 1;
      monthly = Math.round((Number(row.cost_per)/100 * Number(acquisitionLoan) / monthsInPeriod) * 100) / 100;
      annual = Number(row.cost_per)/100 * Number(acquisitionLoan);
    } else if (row.factor && row.factor.toLowerCase() === "Percent of Property Taxes".toLowerCase()) {
      const taxesAnnual = getOperatingExpenseAnnualByName({
        expenseName: "Property Taxes",
        operatingExpenses: operatingExpenses || [],
        modelDetails,
        units: units || [],
        amenityIncome: amenityIncome || [],
        retailIncome: retailIncome || [],
        retailExpenses: retailExpenses || [],
      });
      const monthsInPeriod = (row.end_month || 12) - (row.start_month || 1) + 1;
      monthly = Math.round(((Number(row.cost_per) / 100) * taxesAnnual / monthsInPeriod) * 100) / 100;
      annual = (Number(row.cost_per) / 100) * taxesAnnual;
    } else if (row.factor && row.factor.toLowerCase() === "Percent of Insurance Cost".toLowerCase()) {
      const insuranceAnnual = getOperatingExpenseAnnualByName({
        expenseName: "Insurance",
        operatingExpenses: operatingExpenses,
        modelDetails,
        units: units,
        amenityIncome: amenityIncome,
        retailIncome: retailIncome,
        retailExpenses: retailExpenses,
      });

      const monthsInPeriod = (row.end_month || 12) - (row.start_month || 1) + 1;
      monthly = Math.round(((Number(row.cost_per) / 100) * insuranceAnnual / monthsInPeriod) * 100) / 100;
      annual = (Number(row.cost_per) / 100) * insuranceAnnual;
    }
    else if (row.factor && row.factor.toLowerCase() === "Total percent of other expenses".toLowerCase()) {
      // Calculate the sum of other expenses for this type
      const otherTotals = filteredExpenses
        .filter((exp) => exp.id !== row.id)
        .map((exp) => {
          if (exp.factor && exp.factor.toLowerCase() === "Total".toLowerCase()) return exp.cost_per || 0;
          if (exp.factor && exp.factor.toLowerCase() === "per Unit".toLowerCase() || exp.factor && exp.factor.toLowerCase() === "per SF".toLowerCase() || exp.factor && exp.factor.toLowerCase() === "per Month".toLowerCase()) {
            return Number(exp.cost_per || 0) * Number(exp.statistic || 0);
          }
          if (exp.factor && exp.factor.toLowerCase() === "Percent of Purchase Price".toLowerCase()) {
            const acquisitionPriceField = modelDetails?.user_model_field_values?.find(
              (field: any) => field.field_key && field.field_key.trim() === "Acquisition Price"
            );
            const acquisitionPrice = Number(acquisitionPriceField?.value ?? 0);
            return Number(exp.cost_per)/100 * Number(acquisitionPrice);
          }
          if (exp.factor && exp.factor.toLowerCase() === "Percent of Acquisition Loan".toLowerCase()) {
            const acquisitionLoanRaw = variables?.["AQ: Max Acquisition Loan at Closing"];
                  const acquisitionLoan = Number(typeof acquisitionLoanRaw === "string" ? acquisitionLoanRaw.replace(/,/g, '').trim() : acquisitionLoanRaw ?? 0);
            return Number(exp.cost_per)/100 * Number(acquisitionLoan);
          }
          if (exp.factor && exp.factor.toLowerCase() === "Percent of Property Taxes".toLowerCase()) {
            const taxesAnnual = getOperatingExpenseAnnualByName({
              expenseName: "Property Taxes",
              operatingExpenses: operatingExpenses,
              modelDetails,
              units: units,
              amenityIncome: amenityIncome,
              retailIncome: retailIncome,
              retailExpenses: retailExpenses,
            });
            return (Number(exp.cost_per) / 100) * taxesAnnual;
          }
          if (exp.factor && exp.factor.toLowerCase() === "Percent of Insurance Cost".toLowerCase()) {
            const insuranceAnnual = getOperatingExpenseAnnualByName({
              expenseName: "Insurance",
              operatingExpenses: operatingExpenses,
              modelDetails,
              units: units,
              amenityIncome: amenityIncome,
              retailIncome: retailIncome,
              retailExpenses: retailExpenses,
            });

            return (Number(exp.cost_per) / 100) * insuranceAnnual;
          }
          return 0;
        })
        .reduce((sum, val) => (sum ?? 0) + Number(val), 0);
      
      const totalCost = Number(row.cost_per || 0) * Number(otherTotals) * 0.01;
      const monthsInPeriod = (row.end_month || 12) - (row.start_month || 1) + 1;
      monthly = Math.round((totalCost / monthsInPeriod) * 100) / 100;
      annual = totalCost;
    }
    
    return { ...row, monthly, annual };
  });
  
  const totalMonthlyExpenses = computedRows.reduce((sum, row) => sum + (row.monthly || 0), 0);
  const totalAnnualExpenses = computedRows.reduce((sum, row) => sum + (row.annual || 0), 0);

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
        <Autocomplete
          freeSolo
          size="small"
          options={suggestedOptions}
          // Keep input uncontrolled to avoid focus loss while typing
          onChange={(_e, v) => {
            const name = typeof v === 'string' ? v : (v as any) || '';
            const trimmed = String(name).trim();
            if (trimmed) {
              onAddWithName(trimmed);
              if (newExpenseInputRef.current) newExpenseInputRef.current.value = '';
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={`Add or select ${expenseType.endsWith('s') ? expenseType.slice(0, -1) : expenseType}`}
              placeholder="e.g., Application Fee"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const currentVal = (e.target as HTMLInputElement)?.value ?? '';
                  const trimmed = currentVal.trim();
                  if (trimmed) {
                    e.preventDefault();
                    onAddWithName(trimmed);
                    if (newExpenseInputRef.current) newExpenseInputRef.current.value = '';
                  }
                }
              }}
              inputRef={newExpenseInputRef}
              sx={{ minWidth: 260 }}
            />
          )}
        />
        <Button variant="contained" size="small" onClick={() => {
          const currentVal = newExpenseInputRef.current?.value ?? '';
          const trimmed = currentVal.trim();
          if (trimmed) {
            onAddWithName(trimmed);
            if (newExpenseInputRef.current) newExpenseInputRef.current.value = '';
          } else {
            onAdd();
          }
        }} sx={{ whiteSpace: 'nowrap', minWidth: 220 }}>
          Add {expenseType === 'Legal and Pre-Development Costs' ? 'Legal or Setup Cost' : (expenseType.endsWith('s') ? expenseType.slice(0, -1) : expenseType)}
        </Button>
      </div>
      <div style={{ display: 'flex', gap: '24px', marginLeft: 'auto', justifyContent: 'flex-end', textAlign: 'right', width: '100%' }}>
        <div style={{ textAlign: 'right' }}>
          <strong>Total {expenseType}:</strong> ${totalAnnualExpenses.toLocaleString()}
        </div>
      </div>
    </div>
  );
};


export const Expenses = ({
  operatingExpenses,
  expenses,
  setExpenses,
  step,
  modelDetails,
  variables,
  units,
  amenityIncome,
  retailIncome,
  retailExpenses,
  industrialModel
}: {
  operatingExpenses: any[];
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  step: string;
  modelDetails: any;
  variables: any;
  units: any[];
  amenityIncome: any[];
  retailIncome: any[];
  retailExpenses: any[];
  industrialModel?: boolean;
}) => {
  const expenseType = EXPENSE_STEPS_MAPPING[step as keyof typeof EXPENSE_STEPS_MAPPING];
  const prevExpensesRef = useRef(expenses);
  const [showMonths, setShowMonths] = useState<boolean>(false);
  const [editingNameRowId, setEditingNameRowId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState<string>('');

  // Only show expenses for this type
  const filteredExpenses = expenses.filter(exp => exp.type === expenseType);


const handleCellChange = (id: string, field: string, value: string | number) => {

  // Remove debug logs for production
  setExpenses(prev =>
    prev.map(row => {
      if (row.id !== id) return row;

      // If changing "factor"
      if (field === "factor") {
        if (value && typeof value === "string" && value.toLowerCase() === "Total".toLowerCase()) {
          return { ...row, factor: value as string, cost_per: 0, statistic: null };
        }
        if (value && typeof value === "string" && value.toLowerCase() === "Total percent of other expenses".toLowerCase()) {
          return { ...row, factor: value as string, cost_per: 0, statistic: 0 };
        }
        // Any other factor
        return { ...row, factor: value as string, cost_per: 0, statistic: 0 };
      }

      // Otherwise, update as normal
      return { ...row, [field]: value };
    })
  );
}


  // Update cost_per for "Total percent of other expenses" rows when other expenses change
  useEffect(() => {
    const prevExpenses = prevExpensesRef.current;
    const updatedExpenses = expenses.map(exp => {
      // Remove automatic cost_per calculation - user enters percentage manually
      return exp;
    });
    
    // Only update if there are actual changes to avoid infinite loops
    const hasChanges = updatedExpenses.some((exp, index) => {
      const prevExp = prevExpenses[index];
      return !prevExp || exp.cost_per !== prevExp.cost_per;
    });
    
    if (hasChanges) {
      setExpenses(updatedExpenses);
    }
    
    prevExpensesRef.current = expenses;
  }, [expenses, expenseType, setExpenses, variables]);

  const totalPercentUsed = filteredExpenses.some(
    (exp) => exp.factor && exp.factor.toLowerCase() === "Total percent of other expenses".toLowerCase()
  );

  // Function to determine if a cell is editable
  const isCellEditable = (field: string, row: Expense) => {
    if (field === "name" || field === "factor" || field === "start_month" || field === "end_month") {
      return true;
    }
    if (field === "cost_per") {
      return true
      // return row.factor !== "Total percent of other expenses";
    }
    if (field === "statistic") {
      const factor = (row.factor ?? "").toLowerCase();
      return factor !== "total" && factor !== "total percent of other expenses";
    }
    if (field === "total_cost") {
      return false; // Always read-only
    }
    return true;
  };

  const flexByField: Record<string, number> = {
    name: 1.6,
    factor: 1.5,
    cost_per: 1,
    statistic: 1,
    total_cost: 1,
    start_month: 0.9,
    end_month: 0.9,
    delete: 0.4,
  };

  const allColumns = useMemo<GridColDef<Expense>[]>(() => [
    { field: "name", headerName: "Name", editable: false, flex: flexByField.name, minWidth: 160,
      renderHeader: () => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 15, color: 'text.primary' }}>Name</Typography>
          <Tooltip title={`Add ${expenseType.endsWith('s') ? expenseType.slice(0, -1) : expenseType}`} arrow>
            <IconButton size="small" onClick={addRow} sx={{ p: 0.25 }}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
      renderCell: (params: any) => (
        editingNameRowId === String(params.id) ? (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
            <EditableNameCell
              initialValue={editingNameValue}
              onCommit={(val) => {
                const trimmed = val.trim();
                handleCellChange(String(params.id), 'name', trimmed);
                setEditingNameRowId(null);
              }}
              onCancel={() => {
                  setEditingNameRowId(null);
              }}
            />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
            <span style={{ color: '#222' }}>{params.value || <span style={{ color: '#aaa' }}>Untitled</span>}</span>
            <span className="u-row-action">
              <Tooltip title="Edit name" arrow>
                <IconButton
                  size="small"
                  onClick={() => {
                    setEditingNameRowId(String(params.id));
                    setEditingNameValue(String(params.value || ''));
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  sx={{ p: 0.25 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </span>
          </Box>
        )
      )
    },
    {
      field: "factor",
      headerName: "Factor",
      flex: flexByField.factor,
      minWidth: 150,
      editable: false,
      renderCell: (params: any) => {

        // Total
        // per Unit
        // per SF
        // per Month
        // Percent of Purchase Price
        // Percent of Acquisition Loan
        // Total percent of other expenses
        
        // Only hide "Total percent of other expenses" if it is actually selected in another row
        const options = [
          { value: "Total", label: "Total" },
          { value: "per Unit", label: "per Unit" },
          { value: "per SF", label: "per SF" },
          { value: "per Month", label: "per Month" },
        ];
        // Determine this row's type from data (avoids relying on outer expenseType)
        const thisType = params.row.type as string;

        if (thisType === "Closing Costs") {
          options.push({
            value: "Percent of Purchase Price",
            label: "Percent of Purchase Price"
          });
          options.push({
            value: "Percent of Acquisition Loan",
            label: "Percent of Acquisition Loan"
          });

          if (!industrialModel) {
          options.push({
            value: "Percent of Property Taxes",
            label: "Percent of Property Taxes"
          });
          options.push({
            value: "Percent of Insurance Cost",
            label: "Percent of Insurance Cost"
          });
          }
        }
        // Recompute rows limited to this type for the option gating to avoid cross-influence
        const rowsOfThisType = expenses.filter((exp) => exp.type === thisType);
        if (!rowsOfThisType.some((exp) => exp.factor === "Total percent of other expenses" && exp.id !== params.row.id)) {
          options.push({
            value: "Total percent of other expenses",
            label: "Percent of other expense total",
          });
        }

        // Find the option whose value matches params.value case-insensitively
        const selectedOption = options.find(
          (option) => option.value.toLowerCase() === String(params.value).toLowerCase()
        );
        // If found, use its value (preserving case) as the select value, else fallback to params.value
        const selectValue = selectedOption ? selectedOption.value : params.value;

        return (
          <div className="u-select-wrap" style={{ position: 'relative', width: '100%' }}>
            <select
              value={selectValue}
              onChange={(e) => handleCellChange(String(params.id), "factor", e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderRadius: 4,
                padding: '10px 28px 10px 8px',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none'
              }}
              className="u-select"
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="u-caret" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>▾</span>
          </div>
        );
      },
    },
    {
      field: "cost_per",
      headerName: "Cost Per",
      flex: flexByField.cost_per,
      minWidth: 130,
      editable: false,
      type: "number",
      renderCell: (params: any) => {
        let adornment = "";
        let preAdornment = "";
        const editable = isCellEditable("cost_per", params.row);
        switch (params.row.factor.toLowerCase()) {
          case "per Unit".toLowerCase():
            preAdornment = "$";
            adornment = "/ unit";
            break;
          case "per SF".toLowerCase():
            preAdornment = "$";
            adornment = "/ sf";
            break;
          case "per Month".toLowerCase():
            preAdornment = "$";
            adornment = "/ month";
            break;
          case "Total percent of other expenses".toLowerCase():
            preAdornment = "";
            adornment = "%";
            break;
          case "Percent of Purchase Price".toLowerCase():
            preAdornment = "";
            adornment = "%";
            break;
          case "Percent of Insurance Cost".toLowerCase():
            preAdornment = "";
            adornment = "%";
            break;
          case "Percent of Property Taxes".toLowerCase():
            preAdornment = "";
            adornment = "%";
            break;
          case "Percent of Acquisition Loan".toLowerCase():
            preAdornment = "";
            adornment = "%";
            break;
          case "Total".toLowerCase():
            preAdornment = "$";
            adornment = "";
            break;
          default:
            preAdornment = "";
            adornment = "";
        }
        if (editable) {
          return (
            <NumberDecimalInputCell params={params} handleCellChange={handleCellChange} field="cost_per" prefix={preAdornment} suffix={adornment} />
          )
        }else{
          return (
            <span style={{ color: editable ? "inherit" : "#999" }}>
              {preAdornment && <span style={{ color: "#888", marginRight: 2 }}>{preAdornment}</span>}
              {params.value}
              <span style={{ color: "#888", marginLeft: 2 }}>{adornment}</span>
            </span>
          );
        }

      },
    },
    {
      field: "statistic",
      headerName: "Statistic",
      flex: flexByField.statistic,
      minWidth: 130,
      editable: false,
      type: "number",
      renderCell: (params: any) => {
        let adornment = "";
        let preAdornment = "";
        const editable = isCellEditable("statistic", params.row);
        
        switch (params.row.factor.toLowerCase()) {
          case "per Unit".toLowerCase():
            preAdornment = "";
            adornment = "units";
            break;
          case "per SF".toLowerCase():
            preAdornment = "";
            adornment = "sf";
            break;
          case "per Month".toLowerCase():
            preAdornment = "";
            adornment = "months";
            break;
          case "Total percent of other expenses".toLowerCase():
            preAdornment = "$";
            adornment = "";
            break;
          case "Percent of Purchase Price".toLowerCase():
            preAdornment = "$";
            adornment = "";
            break;
          case "Percent of Acquisition Loan".toLowerCase():
            preAdornment = "$";
            adornment = "";
            break;
          case "Percent of Property Taxes".toLowerCase():
            preAdornment = "$";
            adornment = "";
            break;
          case "Percent of Insurance Cost".toLowerCase():
            preAdornment = "$";
            adornment = "";
            break;
          default:
            preAdornment = "";
            adornment = "";
        }

        // If factor is "Total percent of other expenses", show sum of other expenses
        if (params.row.factor.toLowerCase() === "Total percent of other expenses".toLowerCase()) {
          const { id, type } = params.row;
          const otherTotals = expenses
            .filter((exp) => exp.type === type && exp.id !== id)
            .map((exp) => {
              if (exp.factor && exp.factor.toLowerCase() === "Total".toLowerCase()) return exp.cost_per;
              if (exp.factor && exp.factor.toLowerCase() === "Percent of Purchase Price".toLowerCase()) {
                const acquisitionPriceField = modelDetails?.user_model_field_values?.find(
                  (field: any) => field.field_key && field.field_key.trim() === "Acquisition Price"
                );
                const acquisitionPrice = Number(acquisitionPriceField?.value ?? 0);
                return Number(exp.cost_per)/100 * Number(acquisitionPrice);
              }
              if (exp.factor && exp.factor.toLowerCase() === "Percent of Acquisition Loan".toLowerCase()) {
                const rawLoan = variables?.["AQ: Max Acquisition Loan at Closing"];
                const acquisitionLoan = Number(typeof rawLoan === "string" ? rawLoan.replace(/,/g, '').trim() : rawLoan || 0);
                return Number(exp.cost_per)/100 * Number(acquisitionLoan);
              }
              if (exp.factor && exp.factor.toLowerCase() === "Percent of Property Taxes".toLowerCase()) {
                const taxesAnnual = getOperatingExpenseAnnualByName({
                  expenseName: "Property Taxes",
                  operatingExpenses: operatingExpenses || [],
                  modelDetails,
                  units: units,
                  amenityIncome: amenityIncome,
                  retailIncome: retailIncome,
                  retailExpenses: retailExpenses,
                });
                return (Number(exp.cost_per) / 100) * taxesAnnual;
              }
              if (exp.factor && exp.factor.toLowerCase() === "Percent of Insurance Cost".toLowerCase()) {
                const insuranceAnnual = getOperatingExpenseAnnualByName({
                  expenseName: "Insurance",
                  operatingExpenses: operatingExpenses || [],
                  modelDetails,
                  units: units,
                  amenityIncome: amenityIncome,
                  retailIncome: retailIncome,
                  retailExpenses: retailExpenses,
                });
                return (Number(exp.cost_per) / 100) * insuranceAnnual;
              }
              if (
                exp.factor && exp.factor.toLowerCase() === "per Unit".toLowerCase() ||
                exp.factor && exp.factor.toLowerCase() === "per SF".toLowerCase() ||
                exp.factor && exp.factor.toLowerCase() === "per Month".toLowerCase()
              ) {
                return Number(exp.cost_per) * Number(exp.statistic);
              }
              return 0;
            })
            .reduce((sum, val) => (sum ?? 0) + Number(val), 0);
          return (
            <span style={{ color: editable ? "inherit" : "#999" }}>
              {preAdornment && <span style={{ color: "#888", marginRight: 2 }}>{preAdornment}</span>}
              {(otherTotals ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              <span style={{ color: "#888", marginLeft: 2 }}>{adornment}</span>
            </span>
          );
        }
        else if (params.row.factor.toLowerCase() === "Percent of Purchase Price".toLowerCase()) {
          const acquisitionPriceField = modelDetails?.user_model_field_values?.find(
            (field: any) => field.field_key && field.field_key.trim() === "Acquisition Price"
          );
          const acquisitionPrice = Number(acquisitionPriceField?.value ?? 0);

          return (
            <span style={{ color: editable ? "inherit" : "#999" }}>
              ${acquisitionPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          );
        }
        else if (params.row.factor.toLowerCase() === "Percent of Acquisition Loan".toLowerCase()) {
          return (
            <span style={{ color: editable ? "inherit" : "#999" }}>
              {variables?.["AQ: Max Acquisition Loan at Closing"]
                ? `$${typeof variables["AQ: Max Acquisition Loan at Closing"] === "string"
                    ? variables["AQ: Max Acquisition Loan at Closing"].trim()
                    : (variables["AQ: Max Acquisition Loan at Closing"] as number).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                : "N/A"}
            </span>
          );
        }
        else if (params.row.factor.toLowerCase() === "Percent of Property Taxes".toLowerCase()) {
          const taxesAnnual = getOperatingExpenseAnnualByName({
            expenseName: "Property Taxes",
            operatingExpenses: operatingExpenses || [],
            modelDetails,
            units: units,
            amenityIncome: amenityIncome,
            retailIncome: retailIncome,
            retailExpenses: retailExpenses,
          });
          return (
            <span style={{ color: editable ? "inherit" : "#999" }}>
              ${taxesAnnual.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          );
        }
        else if (params.row.factor.toLowerCase() === "Percent of Insurance Cost".toLowerCase()) {
          const insuranceAnnual = getOperatingExpenseAnnualByName({
            expenseName: "Insurance",
            operatingExpenses: operatingExpenses || [],
            modelDetails,
            units: units,
            amenityIncome: amenityIncome,
            retailIncome: retailIncome,
            retailExpenses: retailExpenses,
          });
          return (
            <span style={{ color: editable ? "inherit" : "#999" }}>
              ${insuranceAnnual.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          );
        }
        if (editable) {
          return (
            <NumberInputCell params={params} handleCellChange={handleCellChange} field="statistic" suffix={adornment} />
          )
        }else{
          return (
            <span style={{ color: editable ? "inherit" : "#999" }}>
              {params.value}
              {adornment && <span style={{ color: "#888", marginLeft: 2 }}>{adornment}</span>}
            </span>
          );
        }
        
      },
    },
    {
      field: "total_cost",
      headerName: "Total Cost",
      flex: flexByField.total_cost,
      minWidth: 110,
      editable: false,
      type: "number",
      renderCell: (params: any) => {
        const { factor, cost_per, statistic, id, type } = params.row;
        let value = 0;
        if (factor === "Total") {
          value = cost_per;
        } else if (factor && factor.toLowerCase() === "per Unit".toLowerCase() || factor && factor.toLowerCase() === "per SF".toLowerCase() || factor && factor.toLowerCase() === "per Month".toLowerCase()) {
          value = Number(cost_per) * Number(statistic);
        } else if (factor == "Percent of Purchase Price"){
          const acquisitionPriceField = modelDetails?.user_model_field_values?.find(
            (field: any) => field.field_key && field.field_key.trim() === "Acquisition Price"
          );
          const acquisitionPrice = Number(acquisitionPriceField?.value ?? 0);
          value = Number(cost_per)/100 * Number(acquisitionPrice);
        } else if (factor && factor.toLowerCase() === "Percent of Acquisition Loan".toLowerCase()) {
          const rawLoan = variables?.["AQ: Max Acquisition Loan at Closing"];
          const acquisitionLoan = Number(typeof rawLoan === "string" ? rawLoan.replace(/,/g, '').trim() : rawLoan || 0);
          value = Number(cost_per)/100 * Number(acquisitionLoan);
        } else if (factor && factor.toLowerCase() === "Percent of Property Taxes".toLowerCase()) {
          const taxesAnnual = getOperatingExpenseAnnualByName({
            expenseName: "Property Taxes",
            operatingExpenses: operatingExpenses,
            modelDetails,
            units: units,
            amenityIncome: amenityIncome,
            retailIncome: retailIncome,
            retailExpenses: retailExpenses,
          });
          value = (Number(cost_per) / 100) * taxesAnnual;
        } else if (factor && factor.toLowerCase() === "Percent of Insurance Cost".toLowerCase()) {
          const insuranceAnnual = getOperatingExpenseAnnualByName({
            expenseName: "Insurance",
            operatingExpenses: operatingExpenses,
            modelDetails,
            units: units,
            amenityIncome: amenityIncome,
            retailIncome: retailIncome,
            retailExpenses: retailExpenses,
          });
          value = (Number(cost_per) / 100) * insuranceAnnual;
        }
        else if (factor && factor.toLowerCase() === "Total percent of other expenses".toLowerCase()) {

            const { id, type } = params.row;
            const otherTotals = expenses
                .filter((exp) => exp.type === type && exp.id !== id)
                .map((exp) => {
                if (exp.factor && exp.factor.toLowerCase() === "Total".toLowerCase()) return exp.cost_per;
                else if (
                    exp.factor && exp.factor.toLowerCase() === "per Unit".toLowerCase() ||
                    exp.factor && exp.factor.toLowerCase() === "per SF".toLowerCase() ||
                    exp.factor && exp.factor.toLowerCase() === "per Month".toLowerCase()
                ) {
                    return Number(exp.cost_per) * Number(exp.statistic);
                }else if (exp.factor && exp.factor.toLowerCase() === "Percent of Purchase Price".toLowerCase()) {
                  const acquisitionPriceField = modelDetails?.user_model_field_values?.find(
                    (field: any) => field.field_key && field.field_key.trim() === "Acquisition Price"
                  );
                  const acquisitionPrice = Number(acquisitionPriceField?.value ?? 0);
                  return Number(exp.cost_per)/100 * Number(acquisitionPrice);
                }else if (exp.factor && exp.factor.toLowerCase() === "Percent of Acquisition Loan".toLowerCase()) {
                  const rawLoan = variables?.["AQ: Max Acquisition Loan at Closing"];
                  const acquisitionLoan = Number(typeof rawLoan === "string" ? rawLoan.replace(/,/g, '').trim() : rawLoan || 0);
                  return Number(exp.cost_per)/100 * Number(acquisitionLoan);
                }else if (exp.factor && exp.factor.toLowerCase() === "Percent of Property Taxes".toLowerCase()) {
                  const taxesAnnual = getOperatingExpenseAnnualByName({
                    expenseName: "Property Taxes",
                    operatingExpenses: operatingExpenses || [],
                    modelDetails,
                    units: units,
                    amenityIncome: amenityIncome,
                    retailIncome: retailIncome,
                    retailExpenses: retailExpenses,
                  });
                  return (Number(exp.cost_per) / 100) * taxesAnnual;
                }else if (exp.factor && exp.factor.toLowerCase() === "Percent of Insurance Cost".toLowerCase()) {
                  const insuranceAnnual = getOperatingExpenseAnnualByName({
                    expenseName: "Insurance",
                    operatingExpenses: operatingExpenses || [],
                    modelDetails,
                    units: units,
                    amenityIncome: amenityIncome,
                    retailIncome: retailIncome,
                    retailExpenses: retailExpenses,
                  });
                  return (Number(exp.cost_per) / 100) * insuranceAnnual;
                }else{
                  return 0;
                }
                
                })
                .reduce((sum, val) => (sum ?? 0) + Number(val), 0);
      
          // For "Total percent of other expenses", total cost is cost_per (percentage) * statistic (sum of other expenses) * 0.01
          value = Number(cost_per) * Number(otherTotals) * 0.01;
        }
        return (
          <span style={{ color: "#999" }}>
            ${value ? Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 0}
          </span>
        );
      },
    },
    { field: "start_month", headerName: "Start Month", flex: flexByField.start_month, minWidth: 100, editable: false, type: "number",
      renderCell: (params: any) => {
        return <NumberInputCell prefix={"Month "} params={params} handleCellChange={handleCellChange} field="start_month" />
      }
    },
    { field: "end_month", headerName: "End Month", flex: flexByField.end_month, minWidth: 100, editable: false, type: "number",
      renderCell: (params: any) => {
        return <NumberInputCell prefix={"Month "} params={params} handleCellChange={handleCellChange} field="end_month" />
      }
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
          <IconButton
            onClick={() => deleteRow(params.id)}
            color="error"
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </span>
      ),
    },
  ], [expenses, totalPercentUsed, variables, modelDetails, operatingExpenses, expenseType, editingNameRowId, editingNameValue]);

  const columns = useMemo<GridColDef<Expense>[]>(() => {
    if (showMonths) return allColumns;
    return allColumns.filter(c => c.field !== 'start_month' && c.field !== 'end_month');
  }, [allColumns, showMonths]);

  const processRowUpdate = (newRow: Expense, oldRow: Expense) => {
    let updatedRow = { ...newRow };

    if (newRow.factor !== oldRow.factor) {
      // If factor changed, reset cost_per and statistic
      if (newRow.factor === "Total") {
        updatedRow.cost_per = 0;
        updatedRow.statistic = null;
      } else if (newRow.factor === "Total percent of other expenses") {
        // For "Total percent of other expenses", cost_per should be sum of other expenses
        const { id, type } = newRow;
        const otherTotals = expenses
          .filter((exp) => exp.type === type && exp.id !== id)
          .map((exp) => {
            if (exp.factor === "Total") return exp.cost_per;
            if (
              exp.factor && exp.factor.toLowerCase() === "per Unit".toLowerCase() ||
              exp.factor && exp.factor.toLowerCase() === "per SF".toLowerCase() ||
              exp.factor && exp.factor.toLowerCase() === "per Month".toLowerCase()
            ) {
              return Number(exp.cost_per) * Number(exp.statistic);
            }
            return 0;
          })
          .reduce((sum, val) => (sum ?? 0) + Number(val), 0);
        updatedRow.cost_per = otherTotals ?? 0;
        updatedRow.statistic = 0; // percentage starts at 0
      } else {
        updatedRow.cost_per = 0;
        updatedRow.statistic = 0;
      }
    }

    setExpenses((prev) =>
      prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
    );
    return updatedRow;
  };

  const addRow = () => {
    const newRow: Expense = {
      id: String(Date.now()),
      name: "",
      factor: "Total", // default to "Total"
      cost_per: 0,
      statistic: null,
      type: expenseType,
      start_month: 0,
      end_month: 0,
    };
    setExpenses((prev) => [...prev, newRow]);
  };
  const addRowWithName = (name: string) => {
    const newRow: Expense = {
      id: String(Date.now()),
      name: name.trim(),
      factor: "Total",
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

  const getRowClassName = (params: any) =>
    params.indexRelativeToCurrentPage % 2 === 0 ? 'u-row-odd' : 'u-row-even';

  return (
    <Box sx={{ mt: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, minWidth: '900px' }}>
        {/* <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          {step}
        </Typography> */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 'auto' }}>
      
          <FormControlLabel
            control={<Switch checked={showMonths} onChange={(e) => setShowMonths(e.target.checked)} />}
            label={showMonths ? 'Hide Start/End Months' : 'Show Start/End Months'}
          />
          {/* <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={addRow}
            // sx={{
            //   fontWeight: 600,
            //   borderRadius: 2,
            //   textTransform: 'none',
            //   px: 3,
            //   py: 1
            // }}
          >
            Add {expenseType.endsWith('s') ? expenseType.slice(0, -1) : expenseType}
          </Button> */}
        </Box>
      </Box>
      <Paper variant="outlined" sx={{ p: 0, mb: 2 }}>
        <DataGrid
          disableColumnMenu
          disableColumnFilter
          disableColumnSelector
          disableColumnSorting
          rows={filteredExpenses}
          columns={columns.map(col => ({ ...col, sortable: false }))}
          disableRowSelectionOnClick
          processRowUpdate={processRowUpdate}
          getRowId={(row) => row.id}
          isCellEditable={(params) => isCellEditable(params.field, params.row)}
          slots={{
            footer: () => (
              <CustomFooter
                expenses={expenses}
                expenseType={expenseType}
                modelDetails={modelDetails}
                variables={variables}
                operatingExpenses={operatingExpenses}
                units={units}
                amenityIncome={amenityIncome}
                retailIncome={retailIncome}
                retailExpenses={retailExpenses}
                onAdd={addRow}
                onAddWithName={addRowWithName}
              />
            )
          }}
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
            '& .MuiDataGrid-row': { background: '#f9fbfe' },
            '& .u-row-even': { background: '#fafafa' },
            '& .MuiDataGrid-row:hover': { backgroundColor: '#f5f5f5' },
            '& .u-editable-input': { border: 'none', borderBottom: '2px solid transparent', borderRadius: 0, background: 'transparent' },
            '& .MuiDataGrid-row:hover .u-editable-input, & .u-editable-input:focus': { borderBottom: '2px solid #1976d2 !important' },
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
            '& .u-caret': { opacity: 0, transition: 'opacity 120ms ease', color: 'inherit' },
            '& .u-select:focus + .u-caret': { opacity: 1 },
            '& .MuiDataGrid-row:hover .u-caret': { opacity: 1 },
            '& .MuiDataGrid-virtualScroller': { background: '#f9fbfe' },
            '& .MuiDataGrid-footerContainer': { background: '#f9fbfe' }
          }}
        />
      </Paper>
    </Box>
  );
};