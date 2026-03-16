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
  developmentUnits?: any[];
  isDevelopmentModel?: boolean;
  amenityIncome: any[];
  retailIncome: any[];
  retailExpenses: any[];
}

export function getGrossSquareFeet(modelDetails: any): number {
  const fv = modelDetails?.user_model_field_values?.find(
    (f: any) => f.field_key && String(f.field_key).trim() === "Gross Square Feet"
  );
  const n = Number(fv?.value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function getGrossBuildableSquareFeet(modelDetails: any): number {
  const fv = modelDetails?.user_model_field_values?.find(
    (f: any) => f.field_key && String(f.field_key).trim() === "Gross Buildable Square Feet"
  );
  const n = Number(fv?.value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function getCommonAreaSquareFeet(modelDetails: any, units: any[], developmentUnits?: any[], retailIncome?: any[], isDevelopmentModel?: boolean): number {
  if (isDevelopmentModel && Array.isArray(developmentUnits) && developmentUnits.length > 0) {
    const grossBuildable = getGrossBuildableSquareFeet(modelDetails);
    const devUnitsSf = developmentUnits.reduce((sum: number, du: any) => {
      const avgSf = Number(du?.avg_sf || 0);
      const count = Number(du?.units || 0);
      return sum + (Number.isFinite(avgSf) && Number.isFinite(count) ? avgSf * count : 0);
    }, 0);
    const retailSf = Array.isArray(retailIncome)
      ? retailIncome.reduce((sum: number, r: any) => sum + Number(r?.square_feet || 0), 0)
      : 0;
    return Math.max(0, grossBuildable - devUnitsSf - retailSf);
  }
  const gross = getGrossSquareFeet(modelDetails);
  const unitSf = units.reduce((sum: number, u: any) => sum + (u?.square_feet || 0), 0);
  return Math.max(0, gross - unitSf);
}

/** Total SF denominator for "per total square feet": Gross Buildable for development, Gross Square Feet otherwise. */
export function getTotalSquareFeetForExpense(modelDetails: any, isDevelopmentModel?: boolean, developmentUnits?: any[]): number {
  if (isDevelopmentModel && Array.isArray(developmentUnits) && developmentUnits.length > 0) {
    return getGrossBuildableSquareFeet(modelDetails);
  }
  return getGrossSquareFeet(modelDetails);
}

function computeAnnualForRow(row: OperatingExpenseRow, ctx: Omit<GetAnnualParams, 'expenseName' | 'operatingExpenses'>): number {
  const byUnit = String(row.cost_per || '').toLowerCase();
  if (byUnit === 'per unit') {
    const perUnitCount = (ctx.isDevelopmentModel && Array.isArray(ctx.developmentUnits) && ctx.developmentUnits.length > 0)
      ? ctx.developmentUnits.reduce((sum: number, du: any) => sum + Number(du?.units || 0), 0)
      : (ctx.units ? ctx.units.length : 0);
    return Number(row.factor || 0) * perUnitCount;
  }
  if (byUnit === 'total') {
    return Number(row.factor || 0);
  }
  if (byUnit === 'per ca square foot') {
    const commonAreaSf = getCommonAreaSquareFeet(ctx.modelDetails, ctx.units, ctx.developmentUnits, ctx.retailIncome, ctx.isDevelopmentModel);
    return Math.round(Number(row.factor || 0) * commonAreaSf);
  }
  if (byUnit === 'per total square feet') {
    const gross = (ctx.isDevelopmentModel && Array.isArray(ctx.developmentUnits) && ctx.developmentUnits.length > 0)
      ? getGrossBuildableSquareFeet(ctx.modelDetails)
      : getGrossSquareFeet(ctx.modelDetails);
    return Math.round(Number(row.factor || 0) * gross);
  }
  if (byUnit === 'percent of egi') {
    const totalRetailIncome = ctx.retailIncome.reduce(
      (sum: number, income: any) => sum + ((income?.square_feet || 0) * (income?.rent_per_square_foot_per_year || 0)),
      0
    );
    let egi = 0;
    if (ctx.isDevelopmentModel && Array.isArray(ctx.developmentUnits) && ctx.developmentUnits.length > 0) {
      const devAnnualRental = ctx.developmentUnits.reduce((sum: number, du: any) => {
        const unitsCount = Number(du?.units || 0);
        const avgRentMonthly = Number(du?.avg_rent || 0);
        return sum + (Number.isFinite(unitsCount) && Number.isFinite(avgRentMonthly) ? unitsCount * avgRentMonthly * 12 : 0);
      }, 0);
      const totalAnnualAmenityIncome = (ctx.amenityIncome || []).reduce((sum: number, row: any) => {
        const usage = Math.round((Number(row?.utilization || 0) / 100) * Number(row?.unit_count || 0));
        const monthly = usage * Number(row?.monthly_fee || 0);
        const annual = monthly * 12;
        return sum + annual;
      }, 0);
      egi = devAnnualRental + totalAnnualAmenityIncome + totalRetailIncome;
    } else {
      egi = calculateEGI({
        modelDetails: ctx.modelDetails,
        units: ctx.units,
        amenityIncome: ctx.amenityIncome,
        retailIncome: ctx.retailIncome,
        retailExpenses: ctx.retailExpenses,
        totalRetailIncome,
      });
    }
    return (Number(row.factor || 0) * egi) / 100;
  }
  return 0;
}

export function getOperatingExpenseAnnualByName(params: GetAnnualParams): number {
  const { expenseName, operatingExpenses, modelDetails, units, developmentUnits, isDevelopmentModel, amenityIncome, retailIncome, retailExpenses } = params;
  if (!expenseName || !Array.isArray(operatingExpenses)) return 0;
  const row = operatingExpenses.find((e) => String(e.name || '').trim().toLowerCase() === String(expenseName).trim().toLowerCase());
  if (!row) return 0;
  return computeAnnualForRow(row, { modelDetails, units, developmentUnits, isDevelopmentModel, amenityIncome, retailIncome, retailExpenses });
} 