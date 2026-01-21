export interface CalculateEGIParams {
	modelDetails: any;
	units: any[];
	amenityIncome: any[];
	retailIncome: any[];
	retailExpenses: any[];
	totalRetailIncome?: number; // Optional: pass precomputed retail income
}

function getFieldValue(modelDetails: any, key: string, defaultVal: number = 0): number {
	const fv = modelDetails?.user_model_field_values?.find(
		(field: any) => field.field_key && field.field_key.trim().toLowerCase() === key.trim().toLowerCase()
	);
	const num = Number(fv?.value ?? defaultVal);
	return Number.isFinite(num) ? num : defaultVal;
}

function getTotalAnnualAmenityIncome(amenityIncomeArr: any[]): number {
	return amenityIncomeArr.reduce((sum, row) => {
		const usage = Math.round(((row?.utilization || 0) / 100) * (row?.unit_count || 0));
		const monthly = usage * (row?.monthly_fee || 0);
		const annual = monthly * 12;
		return sum + annual;
	}, 0);
}

function getRentalIncome(unitsArr: any[]): number {
	return unitsArr.reduce((sum, u) => sum + (u?.current_rent || 0), 0) * 12;
}

function getRetailSF(retailIncomeArr: any[]): number {
	return retailIncomeArr.reduce((sum: number, income: any) => sum + (income?.square_feet || 0), 0);
}

export function calculateEGI(params: CalculateEGIParams): number {
	const { modelDetails, units, amenityIncome, retailIncome, retailExpenses } = params;
	const totalRetailIncome = Number(params.totalRetailIncome ?? 0) || 0;


	// Vacancy, Bad Debt, Less: Vacancy and Bad Debt
	const vacancy = getFieldValue(modelDetails, "Vacancy", 5) / 100;
	const badDebt = getFieldValue(modelDetails, "Bad Debt", 0) / 100;
	const lvbdValue = getFieldValue(modelDetails, "Less: Vacancy and Bad Debt", 0) / 100;

	// Retail side
	const retailSF = getRetailSF(retailIncome);
	const totalRetailOperatingExpenses = retailExpenses.reduce((sum: number, expense: any) => {
		const perSFYear = Number(expense?.cost_per || 0);
		return sum + perSFYear * retailSF;
	}, 0);
	const recoveryIncome = totalRetailOperatingExpenses;
	const lvbdAnnual = lvbdValue * (totalRetailIncome + recoveryIncome);
	const egiRetail = (totalRetailIncome + recoveryIncome) - (lvbdAnnual + totalRetailOperatingExpenses);

	// Residential side
	const rentalIncomeAnnual = getRentalIncome(units);
	const totalAnnualAmenityIncome = getTotalAnnualAmenityIncome(amenityIncome);

	// Lease-up related adjustments
	const freeMonthsRent = getFieldValue(modelDetails, "Free Month's Rent", 0);
	const brokerFee = getFieldValue(modelDetails, "Broker Fee", 0);
	const annualTurnover = getFieldValue(modelDetails, "Annual Turnover", 0) / 100;
	const assumedLeaseTerm = 12 + freeMonthsRent;
	const ongoingLeaseUpCost = ((freeMonthsRent + brokerFee) / (assumedLeaseTerm || 12)) * annualTurnover;

	const egi = (rentalIncomeAnnual + totalAnnualAmenityIncome + egiRetail) * (1 - vacancy - badDebt - ongoingLeaseUpCost);
	return Number.isFinite(egi) ? egi : 0;
} 