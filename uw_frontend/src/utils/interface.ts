export interface Expense {
    id: string;
    name: string;
    statistic: number | null;
    factor: string | null;
    cost_per: number | null;
    type: string;
    start_month: number;
    end_month: number;
    rent_type_included?: string | null;
  }
  