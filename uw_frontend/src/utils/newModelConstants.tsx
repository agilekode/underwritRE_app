export const FIELD_TITLE_CONSTANTS = {
  ASKING_PRICE_LAND: "Asking Price of Land",
  ACQUISITION_VALUE_LAND: "Acquisition / Value of Land"
};

export const OperatingExpensesBasic = [
    { id: '1', name: 'Property Taxes', factor: 0, broker: 0, cost_per: 'Per unit' },
    { id: '2', name: 'Insurance', factor: 0, broker: 0, cost_per: 'Per unit' },
    { id: '3', name: 'Water / Sewer', factor: 0, broker: 0, cost_per: 'Per unit' },
    { id: '4', name: 'Repairs & Maintenance', factor: 0, broker: 0, cost_per: 'Per unit' },
    { id: '6', name: 'Trash', factor: 0, broker: 0, cost_per: 'Total' },
    { id: '11', name: 'Super (Payroll)', factor: 0, broker: 0, cost_per: 'Per unit' },
    { id: '12', name: 'Heat (Gas)', factor: 0, broker: 0, cost_per: 'Per unit' },
    { id: '13', name: 'Common Area Electric', factor: 0, broker: 0, cost_per: 'Per CA Square Foot' },
    { id: '14', name: 'Landscaping / Snow Removal', factor: 0, broker: 0, cost_per: 'Total' },
    { id: '15', name: 'Property Management', factor: 0, broker: 0, cost_per: 'Percent of EGI' },
    { id: '16', name: 'Reserves', factor: 0, broker: 0, cost_per: 'Percent of EGI' },
]

export const OperatingExpensesBasicDevelopment = [
  { id: 'd1',  name: 'Property Taxes',            factor: 0, broker: 0, cost_per: 'Per unit' },
  { id: 'd2',  name: 'Insurance',                 factor: 0, broker: 0, cost_per: 'Per unit' }
]

export const OperatingExpensesSuggested = [
  { id: '5', name: 'Bank fees', factor: 0, broker: 0, cost_per: 'Per unit' },
  { id: '7', name: 'Cleaning', factor: 0, broker: 0, cost_per: 'Per unit' },
  { id: '9', name: 'Internet', factor: 0, broker: 0, cost_per: 'Total' },
  { id: '10', name: 'Pest Control', factor: 0, broker: 0, cost_per: 'Per unit' },
]


export const OperatingExpensesSuggestedDevelopment = [
  { id: 'd3',  name: 'Repairs & Maintenance',     factor: 0, broker: 0, cost_per: 'Per unit' },
  { id: 'd4',  name: 'Water & Sewer',             factor: 0, broker: 0, cost_per: 'Per unit' },
  { id: 'd5',  name: 'Super',                      factor: 0, broker: 0, cost_per: 'Per unit' },
  { id: 'd6',  name: 'Cleaning',                  factor: 0, broker: 0, cost_per: 'Per unit' },
  { id: 'd7',  name: 'Unit Turns',                factor: 0, broker: 0, cost_per: 'Per unit' },
  { id: 'd8',  name: 'Pest Control',              factor: 0, broker: 0, cost_per: 'Per unit' },
  { id: 'd9',  name: 'Landscaping',               factor: 0, broker: 0, cost_per: 'Per unit' },
  { id: 'd10', name: 'Snow Removal',              factor: 0, broker: 0, cost_per: 'Per unit' },
  { id: 'd11', name: 'Security',                  factor: 0, broker: 0, cost_per: 'Per unit' },
  { id: 'd12', name: 'Doorman',                   factor: 0, broker: 0, cost_per: 'Per unit' },
  { id: 'd13', name: 'General & Administrative',  factor: 0, broker: 0, cost_per: 'Per unit' },
  { id: 'd14', name: 'Property Management',       factor: 0, broker: 0, cost_per: 'Percent of EGI' },
  { id: 'd15', name: 'Bank Fees',                 factor: 0, broker: 0, cost_per: 'Per unit' },
  { id: 'd16', name: 'Reserves',                  factor: 0, broker: 0, cost_per: 'Percent of EGI' },
]

export const GrowthRatesBasic = [
    { name: 'Fair Market', value: 2.5, type: 'rental' },
    { name: 'Rent Control', value: 1, type: 'rental' },
    { name: 'Rent Stabilized', value: 2, type: 'rental' },
    { name: 'Amenity Inflation', value: 2, type: 'amenity' },
    { name: 'Expense Inflation', value: 2, type: 'expense' },
    { name: 'Retail Expense Inflation', value: 2, type: 'retail' }
]

export const GrowthRatesDevelopment = [
  { name: 'Rental Inflation', value: 3.0, type: 'rental' },
  { name: 'Amenity Inflation', value: 2, type: 'amenity' },
  { name: 'Expense Inflation', value: 2, type: 'expense' },
  { name: 'Retail Expense Inflation', value: 2, type: 'retail' }
]

export const AmenityIncomeSuggested = [
  { id: '2', name: 'Storage', start_month: 0, utilization: 0, unit_count: 0, monthly_fee: 0 },
  { id: '3', name: 'Laundry', start_month: 0, utilization: 0, unit_count: 0, monthly_fee: 0 },
  { id: '4', name: 'Gym/Amenity Space', start_month: 0, utilization: 0, unit_count: 0, monthly_fee: 0 },
  { id: '5', name: 'RUBS', start_month: 0, utilization: 0, unit_count: 0, monthly_fee: 0 },
]

export const AmenityIncomeBasic = [
    { id: '1', name: 'Parking', start_month: 0, utilization: 0, unit_count: 0, monthly_fee: 0 },
]

export const MarketRentAssumptionsBasic = [
    { layout: 'Studio', pf_rent: 0 },
    { layout: '1BR', pf_rent: 0 },
    { layout: '2BR', pf_rent: 0 },
    { layout: '3BR', pf_rent: 0 },
    { layout: '4BR', pf_rent: 0 },
]


export const ExpensesSuggested = [
  {
    "id": "34",
    "name": "Transfer Fees",
    "statistic": null,
    "factor": "Total",
    "cost_per": 0,
    "type": "Closing Costs",
    "start_month": 0,
    "end_month": 0
  },
  {
    "id": "35",
    "name": "Loan Processing Fees",
    "statistic": null,
    "factor": "Total",
    "cost_per": 0,
    "type": "Closing Costs",
    "start_month": 0,
    "end_month": 0
  },
  {
    "id": "36",
    "name": "Filing and Recording Fees",
    "statistic": null,
    "factor": "Total",
    "cost_per": 0,
    "type": "Closing Costs",
    "start_month": 0,
    "end_month": 0
  },
  {
    "id": "21",
    "name": "C/O Fees, Permits",
    "statistic": null,
    "factor": "Total",
    "cost_per": 0,
    "type": "Legal and Pre-Development Costs",
    "start_month": 0,
    "end_month": 0
},
{
  "id": "25",
  "name": "Cost Segregation Study",
  "statistic": null,
  "factor": "Total",
  "cost_per": 0,
  "type": "Legal and Pre-Development Costs",
  "start_month": 0,
  "end_month": 0
},
    {
        "id": "4",
        "name": "Green Card Repairs",
        "statistic": 0,
        "factor": "per SF",
        "cost_per": 0,
        "type": "Hard Costs",
        "start_month": 0,
        "end_month": 0
    },
    {
        "id": "5",
        "name": "Mechancial repairs",
        "statistic": null,
        "factor": "Total",
        "cost_per": 0,
        "type": "Hard Costs",
        "start_month": 0,
        "end_month": 0
    },
        {
        "id": "7",
        "name": "Exterior Façade",
        "statistic": null,
        "factor": "Total",
        "cost_per": 0,
        "type": "Hard Costs",
        "start_month": 0,
        "end_month": 0
    },
    {
        "id": "8",
        "name": "Roof repair",
        "statistic": null,
        "factor": "Total",
        "cost_per": 0,
        "type": "Hard Costs",
        "start_month": 0,
        "end_month": 0
    },
    {
        "id": "9",
        "name": "Parking lot seal cracks",
        "statistic": null,
        "factor": "Total",
        "cost_per": 0,
        "type": "Hard Costs",
        "start_month": 0,
        "end_month": 0
    },
        {
        "id": "11",
        "name": "Unit Rehabs",
        "statistic": 0,
        "factor": "per Unit",
        "cost_per": 0,
        "type": "Hard Costs",
        "start_month": 0,
        "end_month": 0
    },
        {
        "id": "17",
        "name": "Cash Reserve: Cash for Keys",
        "statistic": 0,
        "factor": "per Unit",
        "cost_per": 0,
        "type": "Reserves",
        "start_month": 0,
        "end_month": 0
    },
    {
      "id": "13",
      "name": "Loan Draws",
      "statistic": null,
      "factor": "Total",
      "cost_per": 0,
      "type": "Reserves",
      "start_month": 0,
      "end_month": 0
  },
  {
    "id": "2",
    "name": "Storage Buildout",
    "statistic": 0,
    "factor": "per Unit",
    "cost_per": 0,
    "type": "Hard Costs",
    "start_month": 0,
    "end_month": 0
},
{
  "id": "3",
  "name": "Permits",
  "statistic": null,
  "factor": "per SF",
  "cost_per": 0,
  "type": "Hard Costs",
  "start_month": 0,
  "end_month": 0
},
      {
        "id": "32",
        "name": "Application Fee",
        "statistic": null,
        "factor": "Total",
        "cost_per": 0,
        "type": "Closing Costs",
        "start_month": 0,
        "end_month": 0
      },
]

export const ExpensesBasic = [
    {   
        "id": "1",
        "name": "Demo",
        "statistic": null,
        "factor": "Total",
        "cost_per": 0,
        "type": "Hard Costs",
        "start_month": 0,
        "end_month": 0
    },
    {
        "id": "6",
        "name": "Common Area",
        "statistic": null,
        "factor": "Total",
        "cost_per": 0,
        "type": "Hard Costs",
        "start_month": 0,
        "end_month": 0
    },

    {
        "id": "10",
        "name": "Unit Rehabs",
        "statistic": 0,
        "factor": "per Unit",
        "cost_per": 0,
        "type": "Hard Costs",
        "start_month": 0,
        "end_month": 0
    },

    {
        "id": "12",
        "name": "Contingency",
        "statistic": null,
        "factor": "Total percent of other expenses",
        "cost_per": 0,
        "type": "Hard Costs",
        "start_month": 0,
        "end_month": 0
    },

    {
        "id": "14",
        "name": "Cash Reserve: Debt Service",
        "statistic": 0,
        "factor": "per Month",
        "cost_per": 0,
        "type": "Reserves",
        "start_month": 0,
        "end_month": 0
    },
    {
        "id": "15",
        "name": "Cash Reserve: Mechanicals",
        "statistic": 0,
        "factor": "per SF",
        "cost_per": 0,
        "type": "Reserves",
        "start_month": 0,
        "end_month": 0
    },
    {
        "id": "16",
        "name": "Cash Reserve: Roof",
        "statistic": null,
        "factor": "Total",
        "cost_per": 0,
        "type": "Reserves",
        "start_month": 0,
        "end_month": 0
    },

    {
        "id": "18",
        "name": "Leasing Cost Reserves",
        "statistic": 0,
        "factor": "per Unit",
        "cost_per": 0,
        "type": "Reserves",
        "start_month": 0,
        "end_month": 0
    },
    {
        "id": "19",
        "name": "Contingency",
        "statistic": null,
        "factor": "Total percent of other expenses",
        "cost_per": 0,
        "type": "Reserves",
        "start_month": 0,
        "end_month": 0
    },
    {
        "id": "20",
        "name": "Business Formation, Partnership Legal",
        "statistic": null,
        "factor": "Total",
        "cost_per": 0,
        "type": "Legal and Pre-Development Costs",
        "start_month": 0,
        "end_month": 0
    },

    {
        "id": "22",
        "name": "Environmental Testing (Tank Sweep)",
        "statistic": null,
        "factor": "Total",
        "cost_per": 0,
        "type": "Legal and Pre-Development Costs",
        "start_month": 0,
        "end_month": 0
    },
    {
        "id": "23",
        "name": "Lender's Legal for Financing",
        "statistic": null,
        "factor": "Total",
        "cost_per": 0,
        "type": "Legal and Pre-Development Costs",
        "start_month": 0,
        "end_month": 0
    },
    {
        "id": "24",
        "name": "Borrower's Legal for Financing",
        "statistic": null,
        "factor": "Total",
        "cost_per": 0,
        "type": "Legal and Pre-Development Costs",
        "start_month": 0,
        "end_month": 0
    },

    {
        "id": "26",
        "name": "Contingency",
        "statistic": null,
        "factor": "Total percent of other expenses",
        "cost_per": 0,
        "type": "Legal and Pre-Development Costs",
        "start_month": 0,
        "end_month": 0
    },
    {
        "id": "27",
        "name": "Acquisition Fee",
        "statistic": null,
        "factor": "Percent of Purchase Price",
        "cost_per": 0,
        "type": "Closing Costs",
        "start_month": 0,
        "end_month": 0
      },
      {
        "id": "28",
        "name": "Financing Fees: Acquisition Loan",
        "statistic": null,
        "factor": "Percent of Acquisition Loan",
        "cost_per": 0,
        "type": "Closing Costs",
        "start_month": 0,
        "end_month": 0
      },
      {
        "id": "29",
        "name": "Title Insurance",
        "statistic": null,
        "factor": "Percent of Purchase Price",
        "cost_per": 0,
        "type": "Closing Costs",
        "start_month": 0,
        "end_month": 0
      },
      {
        "id": "30",
        "name": "Appraisal",
        "statistic": null,
        "factor": "Total",
        "cost_per": 0,
        "type": "Closing Costs",
        "start_month": 0,
        "end_month": 0
      },
      {
        "id": "31",
        "name": "Inspection",
        "statistic": null,
        "factor": "Total",
        "cost_per": 0,
        "type": "Closing Costs",
        "start_month": 0,
        "end_month": 0
      },

      {
        "id": "33",
        "name": "Legal Closing Costs",
        "statistic": null,
        "factor": "Total",
        "cost_per": 0,
        "type": "Closing Costs",
        "start_month": 0,
        "end_month": 0
      },
      {
        "id": "37",
        "name": "Escrow / Prepaid: Insurance",
        "statistic": null,
        "factor": "Percent of Insurance Cost",
        "cost_per": 100,
        "type": "Closing Costs",
        "start_month": 0,
        "end_month": 0
      },
      {
        "id": "38",
        "name": "Escrow / Prepaid: Property Taxes",
        "statistic": null,
        "factor": "Percent of Property Taxes",
        "cost_per": 25,
        "type": "Closing Costs",
        "start_month": 0,
        "end_month": 0
      },
      {
        "id": "39",
        "name": "Contingency",
        "statistic": null,
        "factor": "Total percent of other expenses",
        "cost_per": 0,
        "type": "Closing Costs",
        "start_month": 0,
        "end_month": 0
      },
      {
        "id": "40",
        "name": "CAM",
        "statistic": null,
        "factor": "per SF",
        "cost_per": 0,
        "type": "Retail",
        "start_month": 0,
        "end_month": 0
      },
      {
        "id": "41",
        "name": "Management Fee",
        "statistic": null,
        "factor": "per SF",
        "cost_per": 0,
        "type": "Retail",
        "start_month": 0,
        "end_month": 0
      },
      {
        "id": "42",
        "name": "Insurance",
        "statistic": null,
        "factor": "per SF",
        "cost_per": 0,
        "type": "Retail",
        "start_month": 0,
        "end_month": 0
      },
      {
        "id": "43",
        "name": "Property Taxes",
        "statistic": null,
        "factor": "per SF",
        "cost_per": 0,
        "type": "Retail",
        "start_month": 0,
        "end_month": 0
      }
]





export const ExpensesIndustrial = [
  {   
      "id": "1",
      "name": "Demo",
      "statistic": null,
      "factor": "Total",
      "cost_per": 0,
      "type": "Hard Costs",
      "start_month": 0,
      "end_month": 0
  },
  {
      "id": "6",
      "name": "Common Area",
      "statistic": null,
      "factor": "Total",
      "cost_per": 0,
      "type": "Hard Costs",
      "start_month": 0,
      "end_month": 0
  },
  {
    "id": "44",
    "name": "Storage Buildout",
    "statistic": 0,
    "factor": "per Unit",
    "cost_per": 0,
    "type": "Hard Costs",
    "start_month": 0,
    "end_month": 0
},
{
    "id": "45",
    "name": "Permits",
    "statistic": 0,
    "factor": "per SF",
    "cost_per": 0,
    "type": "Hard Costs",
    "start_month": 0,
    "end_month": 0
},
{
    "id": "46",
    "name": "Interior",
    "statistic": 0,
    "factor": "per SF",
    "cost_per": 0,
    "type": "Hard Costs",
    "start_month": 0,
    "end_month": 0
},
  {
      "id": "10",
      "name": "Unit Rehabs",
      "statistic": 0,
      "factor": "per Unit",
      "cost_per": 0,
      "type": "Hard Costs",
      "start_month": 0,
      "end_month": 0
  },

  {
      "id": "12",
      "name": "Contingency",
      "statistic": null,
      "factor": "Total percent of other expenses",
      "cost_per": 0,
      "type": "Hard Costs",
      "start_month": 0,
      "end_month": 0
  },
  {
    "id": "13",
    "name": "Loan Draws",
    "statistic": null,
    "factor": "Total",
    "cost_per": 0,
    "type": "Reserves",
    "start_month": 0,
    "end_month": 0
  },

  {
      "id": "14",
      "name": "Cash Reserve: Debt Service",
      "statistic": 0,
      "factor": "per Month",
      "cost_per": 0,
      "type": "Reserves",
      "start_month": 0,
      "end_month": 0
  },
  {
      "id": "15",
      "name": "Cash Reserve: Mechanicals",
      "statistic": 0,
      "factor": "per SF",
      "cost_per": 0,
      "type": "Reserves",
      "start_month": 0,
      "end_month": 0
  },
  {
      "id": "16",
      "name": "Cash Reserve: Roof",
      "statistic": null,
      "factor": "Total",
      "cost_per": 0,
      "type": "Reserves",
      "start_month": 0,
      "end_month": 0
  },

  {
      "id": "18",
      "name": "Leasing Cost Reserves",
      "statistic": 0,
      "factor": "per Unit",
      "cost_per": 0,
      "type": "Reserves",
      "start_month": 0,
      "end_month": 0
  },
  {
      "id": "19",
      "name": "Contingency",
      "statistic": null,
      "factor": "Total percent of other expenses",
      "cost_per": 0,
      "type": "Reserves",
      "start_month": 0,
      "end_month": 0
  },
  {
      "id": "20",
      "name": "Business Formation, Partnership Legal",
      "statistic": null,
      "factor": "Total",
      "cost_per": 0,
      "type": "Legal and Pre-Development Costs",
      "start_month": 0,
      "end_month": 0
  },
  {
    "id": "21",
    "name": "C/O Fees, Permits",
    "statistic": null,
    "factor": "Total",
    "cost_per": 0,
    "type": "Legal and Pre-Development Costs",
    "start_month": 0,
    "end_month": 0
  },

  {
      "id": "22",
      "name": "Environmental Testing",
      "statistic": null,
      "factor": "Total",
      "cost_per": 0,
      "type": "Legal and Pre-Development Costs",
      "start_month": 0,
      "end_month": 0
  },
  {
      "id": "23",
      "name": "Lender's Legal for Financing",
      "statistic": null,
      "factor": "Total",
      "cost_per": 0,
      "type": "Legal and Pre-Development Costs",
      "start_month": 0,
      "end_month": 0
  },
  {
      "id": "26",
      "name": "Contingency",
      "statistic": null,
      "factor": "Total percent of other expenses",
      "cost_per": 0,
      "type": "Legal and Pre-Development Costs",
      "start_month": 0,
      "end_month": 0
  },
  {
      "id": "27",
      "name": "Acquisition Fee",
      "statistic": null,
      "factor": "Percent of Purchase Price",
      "cost_per": 0,
      "type": "Closing Costs",
      "start_month": 0,
      "end_month": 0
    },
    {
      "id": "28",
      "name": "Financing Fees: Acquisition Loan",
      "statistic": null,
      "factor": "Percent of Acquisition Loan",
      "cost_per": 0,
      "type": "Closing Costs",
      "start_month": 0,
      "end_month": 0
    },
    {
      "id": "29",
      "name": "Title Insurance",
      "statistic": null,
      "factor": "Percent of Purchase Price",
      "cost_per": 0,
      "type": "Closing Costs",
      "start_month": 0,
      "end_month": 0
    },
    {
      "id": "30",
      "name": "Appraisal",
      "statistic": null,
      "factor": "Total",
      "cost_per": 0,
      "type": "Closing Costs",
      "start_month": 0,
      "end_month": 0
    },
    {
      "id": "31",
      "name": "Inspection",
      "statistic": null,
      "factor": "Total",
      "cost_per": 0,
      "type": "Closing Costs",
      "start_month": 0,
      "end_month": 0
    },

    {
      "id": "33",
      "name": "Legal Closing Costs",
      "statistic": null,
      "factor": "Total",
      "cost_per": 0,
      "type": "Closing Costs",
      "start_month": 0,
      "end_month": 0
    },
    {
      "id": "37",
      "name": "Escrow / Prepaid: Insurance",
      "statistic": null,
      "factor": "Total",
      "cost_per": 0,
      "type": "Closing Costs",
      "start_month": 0,
      "end_month": 0
    },
    {
      "id": "38",
      "name": "Escrow / Prepaid: Property Taxes",
      "statistic": null,
      "factor": "Total",
      "cost_per": 0,
      "type": "Closing Costs",
      "start_month": 0,
      "end_month": 0
    },
    {
      "id": "39",
      "name": "Contingency",
      "statistic": null,
      "factor": "Total percent of other expenses",
      "cost_per": 0,
      "type": "Closing Costs",
      "start_month": 0,
      "end_month": 0
    },
    {
      "id": "40",
      "name": "CAM",
      "statistic": null,
      "factor": "Annual",
      "cost_per": 0,
      "type": "Retail",
      "start_month": 0,
      "end_month": 0,
      "rent_type_included": "Both",
    },
    {
      "id": "41",
      "name": "Management Fee",
      "statistic": null,
      "factor": "Percent of Base Rent",
      "cost_per": 0,
      "type": "Retail",
      "start_month": 0,
      "end_month": 0,
      "rent_type_included": "Neither",
    },
    {
      "id": "42",
      "name": "Insurance",
      "statistic": null,
      "factor": "per SF / Yr.",
      "cost_per": 0,
      "type": "Retail",
      "start_month": 0,
      "end_month": 0,
      "rent_type_included": "NNN",
    },
    {
      "id": "43",
      "name": "Property Taxes",
      "statistic": null,
      "factor": "Annual",
      "cost_per": 0,
      "type": "Retail",
      "start_month": 0,
      "end_month": 0,
      "rent_type_included": "NNN",
    },
    {
      "id": "44",
      "name": "Misc.",
      "statistic": null,
      "factor": "Annual",
      "cost_per": 0,
      "type": "Retail",
      "start_month": 0,
      "end_month": 0,
      "rent_type_included": "Neither",
    }
]


export const ExpensesBasicDevelopment = [
  // Hard Costs
  {
    id: "201",
    name: "General Requirements / Logistics",
    statistic: null,
    factor: "Total",
    cost_per: 0,
    type: "Hard Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "202",
    name: "Demo / Site Clearing",
    statistic: null,
    factor: "Total",
    cost_per: 0,
    type: "Hard Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "203",
    name: "Stage 1",
    statistic: 0,
    factor: "$ / buildable sf",
    cost_per: 0,
    type: "Hard Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "204",
    name: "Stage 2",
    statistic: 0,
    factor: "$ / buildable sf",
    cost_per: 0,
    type: "Hard Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "205",
    name: "Stage 3",
    statistic: 0,
    factor: "$ / buildable sf",
    cost_per: 0,
    type: "Hard Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "207",
    name: "Contingency",
    statistic: null,
    factor: "Total percent of other expenses",
    cost_per: 0,
    type: "Hard Costs",
    start_month: 0,
    end_month: 0
  },
  // Soft Costs
  {
    id: "208",
    name: "General Liability / Worker's Comp",
    statistic: null,
    factor: "Total",
    cost_per: 0,
    type: "Soft Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "209",
    name: "Building Permits",
    statistic: null,
    factor: "Total",
    cost_per: 0,
    type: "Soft Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "206",
    name: "GC Fee",
    statistic: null,
    factor: "Percent of Hard Costs",
    cost_per: 0,
    type: "Soft Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "210",
    name: "Property Tax",
    statistic: null,
    factor: "Total",
    cost_per: 0,
    type: "Soft Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "211",
    name: "Utility Hookup Fees",
    statistic: null,
    factor: "Total",
    cost_per: 0,
    type: "Soft Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "212",
    name: "Leasing Broker Fees",
    statistic: null,
    factor: "Total",
    cost_per: 0,
    type: "Soft Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "213",
    name: "Builder's Risk",
    statistic: null,
    factor: "Total",
    cost_per: 0,
    type: "Soft Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "214",
    name: "Developer's Fee",
    statistic: null,
    factor: "Total",
    cost_per: 0,
    type: "Soft Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "215",
    name: "Contingency",
    statistic: null,
    factor: "Total percent of other expenses",
    cost_per: 0,
    type: "Soft Costs",
    start_month: 0,
    end_month: 0
  },
  // Legal and Pre-Development Costs
  {
    id: "216",
    name: "Site & Civil Engineering",
    statistic: null,
    factor: "Total",
    cost_per: 0,
    type: "Legal and Pre-Development Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "217",
    name: "Building Architect",
    statistic: null,
    factor: "Total",
    cost_per: 0,
    type: "Legal and Pre-Development Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "218",
    name: "MEP Engineers",
    statistic: null,
    factor: "Total",
    cost_per: 0,
    type: "Legal and Pre-Development Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "219",
    name: "Land Use Attorney",
    statistic: null,
    factor: "Total",
    cost_per: 0,
    type: "Legal and Pre-Development Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "220",
    name: "Construction Loan - Lender's Legal",
    statistic: null,
    factor: "Total",
    cost_per: 0,
    type: "Legal and Pre-Development Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "221",
    name: "Construction Loan - Borrower's Legal",
    statistic: null,
    factor: "Total",
    cost_per: 0,
    type: "Legal and Pre-Development Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "222",
    name: "Contingency",
    statistic: null,
    factor: "Total percent of other expenses",
    cost_per: 0,
    type: "Legal and Pre-Development Costs",
    start_month: 0,
    end_month: 0
  },
  // Closing Costs
  {
    id: "223",
    name: "Acquisition Fee",
    statistic: null,
    factor: "Percent of Purchase Price",
    cost_per: 0,
    type: "Closing Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "224",
    name: "Financing Fees: Construction Loan",
    statistic: null,
    factor: "Percent of Construction Loan",
    cost_per: 0,
    type: "Closing Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "225",
    name: "Financing Fees: Pref / Mezz Loan",
    statistic: null,
    factor: "Percent of Pref / Mezz Loan",
    cost_per: 0,
    type: "Closing Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "226",
    name: "Title Insurance & Other",
    statistic: null,
    factor: "Percent of Purchase Price",
    cost_per: 0,
    type: "Closing Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "227",
    name: "Appraisal",
    statistic: null,
    factor: "Total",
    cost_per: 0,
    type: "Closing Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "228",
    name: "Property Closing Costs",
    statistic: null,
    factor: "Total",
    cost_per: 0,
    type: "Closing Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "229",
    name: "Legal Closing Costs",
    statistic: null,
    factor: "Total",
    cost_per: 0,
    type: "Closing Costs",
    start_month: 0,
    end_month: 0
  },
  {
    id: "230",
    name: "Contingency",
    statistic: null,
    factor: "Total percent of other expenses",
    cost_per: 0,
    type: "Closing Costs",
    start_month: 0,
    end_month: 0
  }
]


  export const ExpensesSuggestedDevelopment = [
    // Closing Costs
    { id: "2010", name: "Broker Fee", statistic: null, factor: "Total", cost_per: 0, type: "Closing Costs", start_month: 0, end_month: 0 },
    { id: "2011", name: "Due Diligence Fees", statistic: null, factor: "Total", cost_per: 0, type: "Closing Costs", start_month: 0, end_month: 0 },
    { id: "2012", name: "Transfer Fees", statistic: null, factor: "Total", cost_per: 0, type: "Closing Costs", start_month: 0, end_month: 0 },
    { id: "2013", name: "LLC Formation", statistic: null, factor: "Total", cost_per: 0, type: "Closing Costs", start_month: 0, end_month: 0 },

    // Legal and Pre-Development Costs
    { id: "2020", name: "Survey", statistic: null, factor: "Total", cost_per: 0, type: "Legal and Pre-Development Costs", start_month: 0, end_month: 0 },
    { id: "2021", name: "Testing Fees", statistic: null, factor: "Total", cost_per: 0, type: "Legal and Pre-Development Costs", start_month: 0, end_month: 0 },
    { id: "2022", name: "Geotech", statistic: null, factor: "Total", cost_per: 0, type: "Legal and Pre-Development Costs", start_month: 0, end_month: 0 },
    { id: "2023", name: "Landscape Architect", statistic: null, factor: "Total", cost_per: 0, type: "Legal and Pre-Development Costs", start_month: 0, end_month: 0 },
    { id: "2024", name: "Accounting & Audit", statistic: null, factor: "Total", cost_per: 0, type: "Legal and Pre-Development Costs", start_month: 0, end_month: 0 },

    // Soft Costs
    { id: "2030", name: "Environmental Phase I & II", statistic: null, factor: "Total", cost_per: 0, type: "Soft Costs", start_month: 0, end_month: 0 },
    { id: "2031", name: "3rd Party Inspections", statistic: null, factor: "Total", cost_per: 0, type: "Soft Costs", start_month: 0, end_month: 0 },
    { id: "2032", name: "Water Hook-up Fees", statistic: null, factor: "Total", cost_per: 0, type: "Soft Costs", start_month: 0, end_month: 0 },
    { id: "2033", name: "Sanitation & Sewer Fees", statistic: null, factor: "Total", cost_per: 0, type: "Soft Costs", start_month: 0, end_month: 0 },
    { id: "2034", name: "Electric and Gas Hookups", statistic: null, factor: "Total", cost_per: 0, type: "Soft Costs", start_month: 0, end_month: 0 },
    { id: "2035", name: "Interior & Exterior Design", statistic: null, factor: "Total", cost_per: 0, type: "Soft Costs", start_month: 0, end_month: 0 },
    { id: "2036", name: "Consultants", statistic: null, factor: "Total", cost_per: 0, type: "Soft Costs", start_month: 0, end_month: 0 },

    // Hard Costs
    { id: "2040", name: "Excavation & Foundation", statistic: null, factor: "Total", cost_per: 0, type: "Hard Costs", start_month: 0, end_month: 0 },
    { id: "2041", name: "Site Work and Utilities", statistic: null, factor: "Total", cost_per: 0, type: "Hard Costs", start_month: 0, end_month: 0 },
    { id: "2042", name: "Framing", statistic: null, factor: "Total", cost_per: 0, type: "Hard Costs", start_month: 0, end_month: 0 },
    { id: "2043", name: "Rough-ins", statistic: null, factor: "Total", cost_per: 0, type: "Hard Costs", start_month: 0, end_month: 0 },
    { id: "2044", name: "Finishes", statistic: null, factor: "Total", cost_per: 0, type: "Hard Costs", start_month: 0, end_month: 0 },
    { id: "2045", name: "Project Manager", statistic: null, factor: "Total", cost_per: 0, type: "Hard Costs", start_month: 0, end_month: 0 },
    { id: "2046", name: "Fencing", statistic: null, factor: "Total", cost_per: 0, type: "Hard Costs", start_month: 0, end_month: 0 },
  ]