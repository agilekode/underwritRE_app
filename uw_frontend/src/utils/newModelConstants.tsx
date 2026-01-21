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

export const OperatingExpensesSuggested = [
  { id: '5', name: 'Bank fees', factor: 0, broker: 0, cost_per: 'Per unit' },
  { id: '7', name: 'Cleaning', factor: 0, broker: 0, cost_per: 'Per unit' },
  { id: '9', name: 'Internet', factor: 0, broker: 0, cost_per: 'Total' },
  { id: '10', name: 'Pest Control', factor: 0, broker: 0, cost_per: 'Per unit' },
]

export const GrowthRatesBasic = [
    { name: 'Fair Market', value: 2.5, type: 'rental' },
    { name: 'Rent Control', value: 1, type: 'rental' },
    { name: 'Rent Stabilized', value: 2, type: 'rental' },
    { name: 'Amenity Inflation', value: 2, type: 'amenity' },
    { name: 'Expense Inflation', value: 2, type: 'expense' },
    { name: 'Retail Expense Inflation', value: 2, type: 'retail' }
]

export const AmenityIncomeSuggested = [
  { id: '2', name: 'Storage', start_month: 0, utilization: 0, unit_count: 0, monthly_fee: 0 },
  { id: '3', name: 'Laundry', start_month: 0, utilization: 0, unit_count: 0, monthly_fee: 0 },
  { id: '4', name: 'Gym/Amenity Space', start_month: 0, utilization: 0, unit_count: 0, monthly_fee: 0 },
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


  
