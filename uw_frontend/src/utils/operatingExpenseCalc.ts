import { calculateEGI } from "./egi";

export interface OperatingExpenseRow {
  id: string;
  name: string;
  factor: number;
  cost_per: string;
}

interface GetAnnualParams {
  expenseName: string;
  operatingExpenses: OperatingExpenseRow[];
  modelDetails: any;
  units: any[];
  amenityIncome: any[];
  retailIncome: any[];
  retailExpenses: any[];
}

function getGrossSquareFeet(modelDetails: any): number {
  const fv = modelDetails?.user_model_field_values?.find(
    (f: any) => f.field_key && String(f.field_key).trim() === "Gross Square Feet"
  );
  const n = Number(fv?.value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function getCommonAreaSquareFeet(modelDetails: any, units: any[]): number {
  const gross = getGrossSquareFeet(modelDetails);
  const unitSf = units.reduce((sum: number, u: any) => sum + (u?.square_feet || 0), 0);
  return gross - unitSf;
}

function computeAnnualForRow(row: OperatingExpenseRow, ctx: Omit<GetAnnualParams, 'expenseName' | 'operatingExpenses'>): number {
  const byUnit = String(row.cost_per || '').toLowerCase();
  if (byUnit === 'per unit') {
    return Number(row.factor || 0) * (ctx.units ? ctx.units.length : 0);
  }
  if (byUnit === 'total') {
    return Number(row.factor || 0);
  }
  if (byUnit === 'per ca square foot') {
    const commonAreaSf = getCommonAreaSquareFeet(ctx.modelDetails, ctx.units);
    return Math.round(Number(row.factor || 0) * commonAreaSf);
  }
  if (byUnit === 'per total square feet') {
    const gross = getGrossSquareFeet(ctx.modelDetails);
    return Math.round(Number(row.factor || 0) * gross);
  }
  if (byUnit === 'percent of egi') {
    const totalRetailIncome = ctx.retailIncome.reduce(
      (sum: number, income: any) => sum + ((income?.square_feet || 0) * (income?.rent_per_square_foot_per_year || 0)),
      0
    );
    const egi = calculateEGI({
      modelDetails: ctx.modelDetails,
      units: ctx.units,
      amenityIncome: ctx.amenityIncome,
      retailIncome: ctx.retailIncome,
      retailExpenses: ctx.retailExpenses,
      totalRetailIncome,
    });
    return (Number(row.factor || 0) * egi) / 100;
  }
  return 0;
}

export function getOperatingExpenseAnnualByName(params: GetAnnualParams): number {
  const { expenseName, operatingExpenses, modelDetails, units, amenityIncome, retailIncome, retailExpenses } = params;
  if (!expenseName || !Array.isArray(operatingExpenses)) return 0;
  const row = operatingExpenses.find((e) => String(e.name || '').trim().toLowerCase() === String(expenseName).trim().toLowerCase());
  if (!row) return 0;
  return computeAnnualForRow(row, { modelDetails, units, amenityIncome, retailIncome, retailExpenses });
} 