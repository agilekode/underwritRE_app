export const FIELD_TYPE_OPTIONS = [
    { value: 'percent', label: 'Percent' },
    { value: 'yes_no', label: 'Yes/No' },
    { value: 'dollars', label: 'Dollars' },
    { value: 'dollars_per_sf', label: 'Dollars per SF' },
    { value: 'number', label: 'Number' },
    { value: 'month', label: 'Month' },
    { value: 'months', label: 'Months' },
    { value: 'year', label: 'Year' },
    { value: 'text', label: 'Text' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'date', label: 'Date' },
    { value: 'acres', label: 'Acres' },
    { value: 'number_no_commas', label: 'Number (no commas)' },
    { value: 'select_options', label: 'Select Options' },
  ];


  export const modelTypePresetsIndustrial = 
    {
        "sections":  [{
        "active": true,
        "fields": [
            {
                "active": true,
                "default_value": "0",
                "description": "Price to Compare the Purchase Price to",
                "field_key": "Asking Price",
                "field_title": "Asking Price",
                "field_type": "dollars",
                "id": "35c0233b-9fe8-4d37-a81c-72bae936bcd4",
                "order": 0,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "0",
                "description": "Price at which property acquired",
                "field_key": "Acquisition Price",
                "field_title": "Acquisition Price",
                "field_type": "dollars",
                "id": "66e8d99b-1fed-46a5-b605-57960ab01af2",
                "order": 1,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "",
                "description": "Date the model will start",
                "field_key": "Model Start Date",
                "field_title": "Model Start Date",
                "field_type": "date",
                "id": "10b859a9-ba2c-4824-bd5e-dff5d88bad09",
                "order": 2,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "",
                "description": "Gross Square Feet of Property",
                "field_key": "Gross Buildable Square Feet",
                "field_title": "Gross Buildable Square Feet",
                "field_type": "number",
                "id": "3834e543-40c8-4bde-a747-1ee48781088b",
                "order": 3,
                "required": false,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "0",
                "description": "Share of Equity from Sponsor",
                "field_key": "Share of Equity from Sponsor",
                "field_title": "Share of Equity from Sponsor",
                "field_type": "percent",
                "id": "e594f0d8-99dd-4a36-8dbe-81f6461ccd0e",
                "order": 4,
                "required": true,
                "time_phased": false
            }
        ],
        "id": "f8ad2355-50b8-4490-8f03-3a745e41e6a6",
        "name": "General Property Assumptions",
        "order": 0
    },
    {
        "active": true,
        "fields": [
            {
                "active": true,
                "default_value": "1",
                "description": "Uncollectible rental income and other charges that are ultimately written off as losses",
                "field_key": "Bad Debt",
                "field_title": "Bad Debt / Collection Loss",
                "field_type": "percent",
                "id": "deb5d638-017d-4b23-8f65-00149a254b53",
                "order": 0,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "5",
                "description": "Long-term expected vacancy rate (standard assumption of 5% is given as default value)",
                "field_key": "Vacancy",
                "field_title": "Vacancy",
                "field_type": "percent",
                "id": "e09d75ea-d361-479b-a836-182690dfdb1c",
                "order": 1,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "",
                "description": "",
                "field_key": "Months of Lease-Up",
                "field_title": "Months of Lease-Up",
                "field_type": "months",
                "id": "0bc142aa-4861-419d-be79-353cc4f0ea8f",
                "order": 2,
                "required": true,
                "time_phased": false
            }
        ],
        "id": "fb65067b-c12a-4db7-a88a-2c7b5e0a94d7",
        "name": "Leasing Assumptions",
        "order": 1
    },
    {
        "active": true,
        "fields": [
            {
                "active": true,
                "default_value": "60",
                "description": "",
                "field_key": "Multifamily Exit Month",
                "field_title": "Multifamily Exit Month",
                "field_type": "month",
                "id": "a3f9b65b-bff1-4228-8016-3ffa57022c80",
                "order": 0,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "6",
                "description": "",
                "field_key": "Multifamily Applied Exit Cap Rate",
                "field_title": "Multifamily Applied Exit Cap Rate",
                "field_type": "percent",
                "id": "92fbdc48-ca16-49cd-a3e9-9b56120e98ba",
                "order": 1,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "3",
                "description": "%",
                "field_key": "Multifamily Less: Selling Costs",
                "field_title": "Multifamily Less: Selling Costs",
                "field_type": "percent",
                "id": "cc9556ed-75c1-441e-850b-4682121715da",
                "order": 2,
                "required": true,
                "time_phased": false
            }
        ],
        "id": "9e5839db-e2c0-4716-bc6b-0cf2dc1cdfae",
        "name": "Exit Assumptions",
        "order": 2
    },
    {
        "active": true,
        "fields": [
            {
                "active": true,
                "default_value": "Yes",
                "description": "",
                "field_key": "Permanent Loan Issued?",
                "field_title": "Would you like to model in a refinancing of the acquisition loan?",
                "field_type": "yes_no",
                "id": "130fef6c-7fb2-4c21-9ec0-dbd1e936e883",
                "order": 0,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "36",
                "description": "",
                "field_key": "Refinancing Month",
                "field_title": "What month is the refinancing to take place?",
                "field_type": "month",
                "id": "0b8cf978-9c0e-4e2a-81bb-6eb77f890944",
                "order": 1,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "30",
                "description": "",
                "field_key": "Refi Amortization",
                "field_title": "Refi Amortization",
                "field_type": "year",
                "id": "17a5ebcb-fd8a-4ae8-b426-60577d9560ea",
                "order": 3,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "1.1",
                "description": "",
                "field_key": "Origination Cost (Includes Title)",
                "field_title": "Origination Cost (Includes Title)",
                "field_type": "percent",
                "id": "49fc4379-52e5-4c61-bd3f-9f36ff3401f1",
                "order": 4,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "6",
                "description": "",
                "field_key": "Applied Cap Rate for Valuation at Refi",
                "field_title": "Applied Cap Rate for Valuation at Refi",
                "field_type": "percent",
                "id": "894bea83-14c3-4fb9-8653-4a477d9cc3e7",
                "order": 5,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "75",
                "description": "LTV Max",
                "field_key": "LTV Max",
                "field_title": "LTV Max",
                "field_type": "percent",
                "id": "38de2820-3045-40bc-bbcd-d8980d1a3f39",
                "order": 6,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "1.25",
                "description": "",
                "field_key": "Minimum Debt-Service-Coverage Ratio",
                "field_title": "Minimum Debt-Service-Coverage Ratio",
                "field_type": "number",
                "id": "f84f67d0-d58f-4eee-8be5-a480b1406484",
                "order": 7,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "8.75",
                "description": "Net Operating Income Divided by Loan Size",
                "field_key": "Debt Yield Min",
                "field_title": "Minimum Debt Yield",
                "field_type": "percent",
                "id": "b1e025e2-adb0-44ff-8558-3230283b607e",
                "order": 8,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "0",
                "description": "Share of Equity Contributed by the Sponsor or Lead Investor",
                "field_key": "Share of Equity from Sponsor",
                "field_title": "Share of Equity from Sponsor",
                "field_type": "percent",
                "id": "5d2efd50-a8fd-4a41-bbd5-610a6f296d92",
                "order": 9,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "5",
                "description": "",
                "field_key": "Refinancing: Fixed Interest Rate",
                "field_title": "Refinancing: Fixed Interest Rate",
                "field_type": "percent",
                "id": "e0f90ea0-614f-416d-84e5-ed00355749a6",
                "order": 10,
                "required": true,
                "time_phased": false
            }
        ],
        "id": "30ad7385-4fbd-4132-b98a-ca6b1a871cba",
        "name": "Refinancing",
        "order": 3
    },
    {
        "active": true,
        "fields": [
            {
                "active": true,
                "default_value": "5",
                "description": "",
                "field_key": "Less: Vacancy and Bad Debt",
                "field_title": "Less: Vacancy and Bad Debt",
                "field_type": "percent",
                "id": "2c190fa6-41cf-4d02-bc6b-6b48d79243e8",
                "order": 1,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "70",
                "description": "",
                "field_key": "Renewal Property: Renewal Lease",
                "field_title": "Renewal Property: Renewal Lease",
                "field_type": "percent",
                "id": "8fa4fa7c-9fee-4227-a22e-2e118e661cd0",
                "order": 2,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "0",
                "description": "",
                "field_key": "Retail Rent: New Lease",
                "field_title": "Retail Rent: New Lease",
                "field_type": "dollars_per_sf",
                "id": "3a2f28b8-d1ae-4f9d-97e3-73c5b231f0c4",
                "order": 3,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "0",
                "description": "",
                "field_key": "Retail Rent: Renewal Lease",
                "field_title": "Retail Rent: Renewal Lease",
                "field_type": "dollars_per_sf",
                "id": "b804931a-1840-498b-95ca-975524be63c3",
                "order": 4,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "0",
                "description": "",
                "field_key": "TI's: New Lease",
                "field_title": "TI's: New Lease",
                "field_type": "dollars_per_sf",
                "id": "2367ed1e-8874-4082-99e9-d1c2c05b6ac8",
                "order": 5,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "0",
                "description": "",
                "field_key": "TI's: Renewal Lease",
                "field_title": "TI's: Renewal Lease",
                "field_type": "dollars_per_sf",
                "id": "36314f37-c472-417b-b023-5d51bab54931",
                "order": 6,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "0",
                "description": "",
                "field_key": "Leasing Commissions: New Lease",
                "field_title": "Leasing Commissions: New Lease",
                "field_type": "percent",
                "id": "bca8e2a7-c1a4-42b5-a4c2-256c698cb872",
                "order": 7,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "0",
                "description": "",
                "field_key": "Leasing Commissions: Renewal Lease",
                "field_title": "Leasing Commissions: Renewal Lease",
                "field_type": "percent",
                "id": "67817ac6-b90e-418e-87c4-09f741b6c163",
                "order": 8,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "1",
                "description": "",
                "field_key": "Lease Term: New Lease",
                "field_title": "Lease Term: New Lease",
                "field_type": "year",
                "id": "a7baa6f8-73c9-4c05-80eb-1ed9ae25b760",
                "order": 9,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "1",
                "description": "",
                "field_key": "Lease Term: Renewal Lease",
                "field_title": "Lease Term: Renewal Lease",
                "field_type": "year",
                "id": "e3b6b8c9-904f-4e72-b594-3be99b295f2e",
                "order": 10,
                "required": true,
                "time_phased": false
            }
        ],
        "id": "a06806b1-2a79-41fc-bfc6-658b32f4ff4c",
        "name": "Retail Leasing Assumptions",
        "order": 4
    },
    {
        "active": true,
        "fields": [
            {
                "active": true,
                "default_value": "",
                "description": "",
                "field_key": "Sr. Cons: Exact Loan Amount",
                "field_title": "Sr. Cons: Exact Loan Amount",
                "field_type": "dollars",
                "id": "0ce23500-4dfb-4ec1-8b26-5f193c9341da",
                "order": 1,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "7.5",
                "description": "",
                "field_key": "Fixed Rate for Sr. Cons. Loan",
                "field_title": "Fixed Rate for Sr. Cons. Loan",
                "field_type": "percent",
                "id": "09e453ba-aa28-42a1-8420-fc7b24e283f9",
                "order": 3,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "400",
                "description": "",
                "field_key": "Floating: Spread Over Base Rate",
                "field_title": "Floating: Spread Over Base Rate",
                "field_type": "number",
                "id": "f64371c5-7507-4c39-9ac6-5bfa700b5565",
                "order": 5,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "Floating",
                "description": "Fixed,Floating",
                "field_key": "Sr. Cons: Interest Rate Type",
                "field_title": "Sr. Cons: Interest Rate Type",
                "field_type": "select_options",
                "id": "380ce977-86c2-4780-a9ed-aa19b8ac58e5",
                "order": 2,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "400",
                "description": "",
                "field_key": "Floating: Base Rate",
                "field_title": "Floating: Base Rate",
                "field_type": "number",
                "id": "3f7f2a2a-4436-4d98-a6df-1e521e0600d4",
                "order": 4,
                "required": true,
                "time_phased": false
            }
        ],
        "id": "333e5736-6ada-4520-82db-d9d1aecbb3e3",
        "name": "Senior Construction Loan Financing",
        "order": 5
    },
    {
        "active": true,
        "fields": [
            {
                "active": true,
                "default_value": "5",
                "description": "",
                "field_key": "Interest Rate (Accrual)",
                "field_title": "Interest Rate (Accrual)",
                "field_type": "percent",
                "id": "ad95364e-abd3-43e1-82a6-9275ae1cc995",
                "order": 2,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "10",
                "description": "",
                "field_key": "Participation",
                "field_title": "Participation",
                "field_type": "percent",
                "id": "12c2e9bd-5e2b-4a7a-b2e5-6b13612683ec",
                "order": 4,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "",
                "description": "",
                "field_key": "Pref. Equity / Mezz. Loan Amount",
                "field_title": "Pref. Equity / Mezz. Loan Amount",
                "field_type": "dollars",
                "id": "bbbb394d-420d-47d7-a99a-db65a9e16bea",
                "order": 1,
                "required": true,
                "time_phased": false
            },
            {
                "active": true,
                "default_value": "",
                "description": "",
                "field_key": "Origination Fee",
                "field_title": "Origination Fee",
                "field_type": "dollars",
                "id": "182c7c40-b75e-4629-a21f-55ad80c2a7e8",
                "order": 3,
                "required": false,
                "time_phased": false
            }
        ],
        "id": "f2b2600e-4f4d-473b-9fe5-a7843582a032",
        "name": "Second Lien",
        "order": 6
    }
]}

export const modelTypePresets = {
    "sections": [
        {
            "active": true,
            "fields": [
                {
                    "active": true,
                    "default_value": "0",
                    "description": "Price to Compare the Purchase Price to",
                    "field_key": "Asking Price",
                    "field_title": "Asking Price",
                    "field_type": "dollars",
                    "id": "35c0233b-9fe8-4d37-a81c-72bae936bcd4",
                    "order": 0,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "0",
                    "description": "Price at which property acquired",
                    "field_key": "Acquisition Price",
                    "field_title": "Acquisition Price",
                    "field_type": "dollars",
                    "id": "66e8d99b-1fed-46a5-b605-57960ab01af2",
                    "order": 1,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "",
                    "description": "Date the model will start",
                    "field_key": "Model Start Date",
                    "field_title": "Model Start Date",
                    "field_type": "date",
                    "id": "10b859a9-ba2c-4824-bd5e-dff5d88bad09",
                    "order": 2,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "",
                    "description": "Gross Square Feet of Property",
                    "field_key": "Gross Buildable Square Feet",
                    "field_title": "Gross Buildable Square Feet",
                    "field_type": "number",
                    "id": "3834e543-40c8-4bde-a747-1ee48781088b",
                    "order": 3,
                    "required": false,
                    "time_phased": false
                },
                // {
                //     "active": true,
                //     "default_value": "0",
                //     "description": "Share of Equity from Sponsor",
                //     "field_key": "Share of Equity from Sponsor",
                //     "field_title": "Share of Equity from Sponsor",
                //     "field_type": "percent",
                //     "id": "e594f0d8-99dd-4a36-8dbe-81f6461ccd0e",
                //     "order": 4,
                //     "required": true,
                //     "time_phased": false
                // }
            ],
            "id": "f8ad2355-50b8-4490-8f03-3a745e41e6a6",
            "name": "General Property Assumptions",
            "order": 0
        },
        {
            "active": true,
            "fields": [
                {
                    "active": true,
                    "default_value": "1",
                    "description": "Uncollectible rental income and other charges that are ultimately written off as losses",
                    "field_key": "Bad Debt",
                    "field_title": "Bad Debt / Collection Loss",
                    "field_type": "percent",
                    "id": "deb5d638-017d-4b23-8f65-00149a254b53",
                    "order": 0,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "5",
                    "description": "Long-term expected vacancy rate (standard assumption of 5% is given as default value)",
                    "field_key": "Vacancy",
                    "field_title": "Vacancy",
                    "field_type": "percent",
                    "id": "e09d75ea-d361-479b-a836-182690dfdb1c",
                    "order": 1,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "",
                    "description": "",
                    "field_key": "Months of Lease-Up",
                    "field_title": "Months of Lease-Up",
                    "field_type": "months",
                    "id": "0bc142aa-4861-419d-be79-353cc4f0ea8f",
                    "order": 2,
                    "required": true,
                    "time_phased": false
                }
            ],
            "id": "fb65067b-c12a-4db7-a88a-2c7b5e0a94d7",
            "name": "Leasing Assumptions",
            "order": 1
        },
        {
            "active": true,
            "fields": [
                {
                    "active": true,
                    "default_value": "60",
                    "description": "",
                    "field_key": "Multifamily Exit Month",
                    "field_title": "Multifamily Exit Month",
                    "field_type": "month",
                    "id": "a3f9b65b-bff1-4228-8016-3ffa57022c80",
                    "order": 0,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "6",
                    "description": "",
                    "field_key": "Multifamily Applied Exit Cap Rate",
                    "field_title": "Multifamily Applied Exit Cap Rate",
                    "field_type": "percent",
                    "id": "92fbdc48-ca16-49cd-a3e9-9b56120e98ba",
                    "order": 1,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "3",
                    "description": "%",
                    "field_key": "Multifamily Less: Selling Costs",
                    "field_title": "Multifamily Less: Selling Costs",
                    "field_type": "percent",
                    "id": "cc9556ed-75c1-441e-850b-4682121715da",
                    "order": 2,
                    "required": true,
                    "time_phased": false
                }
            ],
            "id": "9e5839db-e2c0-4716-bc6b-0cf2dc1cdfae",
            "name": "Exit Assumptions",
            "order": 2
        },
        {
            "active": true,
            "fields": [
                {
                    "active": true,
                    "default_value": "Yes",
                    "description": "",
                    "field_key": "Permanent Loan Issued?",
                    "field_title": "Would you like to model in a refinancing of the acquisition loan?",
                    "field_type": "yes_no",
                    "id": "130fef6c-7fb2-4c21-9ec0-dbd1e936e883",
                    "order": 0,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "36",
                    "description": "",
                    "field_key": "Refinancing Month",
                    "field_title": "What month is the refinancing to take place?",
                    "field_type": "month",
                    "id": "0b8cf978-9c0e-4e2a-81bb-6eb77f890944",
                    "order": 1,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "30",
                    "description": "",
                    "field_key": "Refi Amortization",
                    "field_title": "Refi Amortization",
                    "field_type": "year",
                    "id": "17a5ebcb-fd8a-4ae8-b426-60577d9560ea",
                    "order": 3,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "1.1",
                    "description": "",
                    "field_key": "Origination Cost (Includes Title)",
                    "field_title": "Origination Cost (Includes Title)",
                    "field_type": "percent",
                    "id": "49fc4379-52e5-4c61-bd3f-9f36ff3401f1",
                    "order": 4,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "6",
                    "description": "",
                    "field_key": "Applied Cap Rate for Valuation at Refi",
                    "field_title": "Applied Cap Rate for Valuation at Refi",
                    "field_type": "percent",
                    "id": "894bea83-14c3-4fb9-8653-4a477d9cc3e7",
                    "order": 5,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "75",
                    "description": "LTV Max",
                    "field_key": "LTV Max",
                    "field_title": "LTV Max",
                    "field_type": "percent",
                    "id": "38de2820-3045-40bc-bbcd-d8980d1a3f39",
                    "order": 6,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "1.25",
                    "description": "",
                    "field_key": "Minimum Debt-Service-Coverage Ratio",
                    "field_title": "Minimum Debt-Service-Coverage Ratio",
                    "field_type": "number",
                    "id": "f84f67d0-d58f-4eee-8be5-a480b1406484",
                    "order": 7,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "8.75",
                    "description": "Net Operating Income Divided by Loan Size",
                    "field_key": "Debt Yield Min",
                    "field_title": "Minimum Debt Yield",
                    "field_type": "percent",
                    "id": "b1e025e2-adb0-44ff-8558-3230283b607e",
                    "order": 8,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "0",
                    "description": "Share of Equity Contributed by the Sponsor or Lead Investor",
                    "field_key": "Share of Equity from Sponsor",
                    "field_title": "Share of Equity from Sponsor",
                    "field_type": "percent",
                    "id": "5d2efd50-a8fd-4a41-bbd5-610a6f296d92",
                    "order": 9,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "5",
                    "description": "",
                    "field_key": "Refinancing: Fixed Interest Rate",
                    "field_title": "Refinancing: Fixed Interest Rate",
                    "field_type": "percent",
                    "id": "e0f90ea0-614f-416d-84e5-ed00355749a6",
                    "order": 10,
                    "required": true,
                    "time_phased": false
                }
            ],
            "id": "30ad7385-4fbd-4132-b98a-ca6b1a871cba",
            "name": "Refinancing",
            "order": 3
        },
        {
            "active": true,
            "fields": [
                {
                    "active": true,
                    "default_value": "5",
                    "description": "",
                    "field_key": "Less: Vacancy and Bad Debt",
                    "field_title": "Less: Vacancy and Bad Debt",
                    "field_type": "percent",
                    "id": "2c190fa6-41cf-4d02-bc6b-6b48d79243e8",
                    "order": 1,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "70",
                    "description": "",
                    "field_key": "Renewal Property: Renewal Lease",
                    "field_title": "Renewal Property: Renewal Lease",
                    "field_type": "percent",
                    "id": "8fa4fa7c-9fee-4227-a22e-2e118e661cd0",
                    "order": 2,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "0",
                    "description": "",
                    "field_key": "Retail Rent: New Lease",
                    "field_title": "Retail Rent: New Lease",
                    "field_type": "dollars_per_sf",
                    "id": "3a2f28b8-d1ae-4f9d-97e3-73c5b231f0c4",
                    "order": 3,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "0",
                    "description": "",
                    "field_key": "Retail Rent: Renewal Lease",
                    "field_title": "Retail Rent: Renewal Lease",
                    "field_type": "dollars_per_sf",
                    "id": "b804931a-1840-498b-95ca-975524be63c3",
                    "order": 4,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "0",
                    "description": "",
                    "field_key": "TI's: New Lease",
                    "field_title": "TI's: New Lease",
                    "field_type": "dollars_per_sf",
                    "id": "2367ed1e-8874-4082-99e9-d1c2c05b6ac8",
                    "order": 5,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "0",
                    "description": "",
                    "field_key": "TI's: Renewal Lease",
                    "field_title": "TI's: Renewal Lease",
                    "field_type": "dollars_per_sf",
                    "id": "36314f37-c472-417b-b023-5d51bab54931",
                    "order": 6,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "0",
                    "description": "",
                    "field_key": "Leasing Commissions: New Lease",
                    "field_title": "Leasing Commissions: New Lease",
                    "field_type": "percent",
                    "id": "bca8e2a7-c1a4-42b5-a4c2-256c698cb872",
                    "order": 7,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "0",
                    "description": "",
                    "field_key": "Leasing Commissions: Renewal Lease",
                    "field_title": "Leasing Commissions: Renewal Lease",
                    "field_type": "percent",
                    "id": "67817ac6-b90e-418e-87c4-09f741b6c163",
                    "order": 8,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "1",
                    "description": "",
                    "field_key": "Lease Term: New Lease",
                    "field_title": "Lease Term: New Lease",
                    "field_type": "year",
                    "id": "a7baa6f8-73c9-4c05-80eb-1ed9ae25b760",
                    "order": 9,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "1",
                    "description": "",
                    "field_key": "Lease Term: Renewal Lease",
                    "field_title": "Lease Term: Renewal Lease",
                    "field_type": "year",
                    "id": "e3b6b8c9-904f-4e72-b594-3be99b295f2e",
                    "order": 10,
                    "required": true,
                    "time_phased": false
                }
            ],
            "id": "a06806b1-2a79-41fc-bfc6-658b32f4ff4c",
            "name": "Retail Leasing Assumptions",
            "order": 4
        },
        {
            "active": true,
            "fields": [
                {
                    "active": true,
                    "default_value": "",
                    "description": "",
                    "field_key": "Sr. Cons: Exact Loan Amount",
                    "field_title": "Sr. Cons: Exact Loan Amount",
                    "field_type": "dollars",
                    "id": "0ce23500-4dfb-4ec1-8b26-5f193c9341da",
                    "order": 1,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "Floating",
                    "description": "Fixed,Floating",
                    "field_key": "Sr. Cons: Interest Rate Type",
                    "field_title": "Sr. Cons: Interest Rate Type",
                    "field_type": "select_options",
                    "id": "380ce977-86c2-4780-a9ed-aa19b8ac58e5",
                    "order": 2,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "7.5",
                    "description": "",
                    "field_key": "Fixed Rate for Sr. Cons. Loan",
                    "field_title": "Fixed Rate for Sr. Cons. Loan",
                    "field_type": "percent",
                    "id": "09e453ba-aa28-42a1-8420-fc7b24e283f9",
                    "order": 3,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "400",
                    "description": "",
                    "field_key": "Floating: Base Rate",
                    "field_title": "Floating: Base Rate",
                    "field_type": "number",
                    "id": "3f7f2a2a-4436-4d98-a6df-1e521e0600d4",
                    "order": 4,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "400",
                    "description": "",
                    "field_key": "Floating: Spread Over Base Rate",
                    "field_title": "Floating: Spread Over Base Rate",
                    "field_type": "number",
                    "id": "f64371c5-7507-4c39-9ac6-5bfa700b5565",
                    "order": 5,
                    "required": true,
                    "time_phased": false
                }
            ],
            "id": "333e5736-6ada-4520-82db-d9d1aecbb3e3",
            "name": "Senior Construction Loan Financing",
            "order": 5
        },
        {
            "active": true,
            "fields": [
                {
                    "active": true,
                    "default_value": "",
                    "description": "",
                    "field_key": "Pref. Equity / Mezz. Loan Amount",
                    "field_title": "Pref. Equity / Mezz. Loan Amount",
                    "field_type": "dollars",
                    "id": "bbbb394d-420d-47d7-a99a-db65a9e16bea",
                    "order": 1,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "5",
                    "description": "",
                    "field_key": "Interest Rate (Accrual)",
                    "field_title": "Interest Rate (Accrual)",
                    "field_type": "percent",
                    "id": "ad95364e-abd3-43e1-82a6-9275ae1cc995",
                    "order": 2,
                    "required": true,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "",
                    "description": "",
                    "field_key": "Origination Fee",
                    "field_title": "Origination Fee",
                    "field_type": "dollars",
                    "id": "182c7c40-b75e-4629-a21f-55ad80c2a7e8",
                    "order": 3,
                    "required": false,
                    "time_phased": false
                },
                {
                    "active": true,
                    "default_value": "10",
                    "description": "",
                    "field_key": "Participation",
                    "field_title": "Participation",
                    "field_type": "percent",
                    "id": "12c2e9bd-5e2b-4a7a-b2e5-6b13612683ec",
                    "order": 4,
                    "required": true,
                    "time_phased": false
                }
            ],
            "id": "f2b2600e-4f4d-473b-9fe5-a7843582a032",
            "name": "Second Lien",
            "order": 6
        }
    ]
}

// export const modelTypePresets = {
//     "sections": [
//         {
//             "fields": [
//                 {
//                     "default_value": "0",
//                     "description": "Price to Compare the Purchase Price to",
//                     "field_key": "Asking Price",
//                     "field_title": "Asking Price",
//                     "field_type": "dollars",
//                     "id": "8b4cba7c-3c05-4adb-9719-99d3069078c2",
//                     "order": 0,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "0",
//                     "description": "Price at which property acquired",
//                     "field_key": "Acquisition Price",
//                     "field_title": "Acquisition Price",
//                     "field_type": "dollars",
//                     "id": "710fee0a-af9d-454d-9ea2-c610acb2f90f",
//                     "order": 1,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "",
//                     "description": "Date the model will start",
//                     "field_key": "Model Start Date",
//                     "field_title": "Model Start Date",
//                     "field_type": "date",
//                     "id": "97a3cff6-5dff-4159-ba65-4d6a5209ed36",
//                     "order": 1,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "0",
//                     "description": "Month closing on property ",
//                     "field_key": "Closing on Property",
//                     "field_title": "Closing on Property",
//                     "field_type": "month",
//                     "id": "28890465-b944-4367-bd74-f8309fc58c6c",
//                     "order": 2,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "",
//                     "description": "Gross Square Feet of Property",
//                     "field_key": "Gross Square Feet",
//                     "field_title": "Gross Square Feet",
//                     "field_type": "number",
//                     "id": "994dcd17-cbf9-48d8-b282-3666c0e212df",
//                     "order": 3,
//                     "required": false,
//                     "time_phased": false
//                 }
//             ],
//             "id": "fc1f0cc0-9436-415d-b9a0-0a278700f993",
//             "name": "General Property Assumptions",
//             "order": 0
//         },
//         {
//             "fields": [
//                 {
//                     "default_value": "2",
//                     "description": "Enter the number of months a unit is expected to be offline during renovations",
//                     "field_key": "Rehab time",
//                     "field_title": "Rehab time",
//                     "field_type": "months",
//                     "id": "e29019c4-ef92-46b4-98f3-275251275448",
//                     "order": 0,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "2",
//                     "description": "Enter the number of months you expect it to take to lease a ready-to-rent unit; i.e. how long it will be on the market",
//                     "field_key": "Lease-up Time",
//                     "field_title": "Lease-up Time",
//                     "field_type": "months",
//                     "id": "79ccbd1b-f8ae-4c68-9b3b-12e6959311ae",
//                     "order": 1,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "1",
//                     "description": "Uncollectible rental income and other charges that are ultimately written off as losses",
//                     "field_key": "Bad Debt",
//                     "field_title": "Bad Debt",
//                     "field_type": "percent",
//                     "id": "4abe9ecb-ed34-4175-a1ca-d699e52a3a7d",
//                     "order": 2,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "5",
//                     "description": "Long-term expected vacancy rate (standard assumption of 5% is given as default value)",
//                     "field_key": "Vacancy",
//                     "field_title": "Vacancy",
//                     "field_type": "percent",
//                     "id": "bf98fa28-5f0b-458c-b0f5-4255386f0bba",
//                     "order": 3,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "0",
//                     "description": "List the number of free months rent concessions, if any, expected to be given in ongoing re-leasing",
//                     "field_key": "Free Month's Rent",
//                     "field_title": "Free Month's Rent",
//                     "field_type": "months",
//                     "id": "fb75fc00-cc68-4f89-a8f0-8961fdf859bb",
//                     "order": 4,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "1",
//                     "description": "List the broker fees you expect to pay in the form of month's rent, if any, expected to be paid in ongoing re-leasing",
//                     "field_key": "Broker Fee",
//                     "field_title": "Broker Fee",
//                     "field_type": "months",
//                     "id": "2838452b-95ab-427d-81f8-2bf44cd003e7",
//                     "order": 5,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "20",
//                     "description": "The percentage of units that are expected to not renew their leases in a given year",
//                     "field_key": "Annual Turnover",
//                     "field_title": "Annual Turnover",
//                     "field_type": "percent",
//                     "id": "907ef84c-b471-406d-a06d-d51527501d71",
//                     "order": 6,
//                     "required": true,
//                     "time_phased": false
//                 }
//             ],
//             "id": "196e1638-ff2e-4f1c-9268-093ab81f2498",
//             "name": "Leasing Assumptions",
//             "order": 1
//         },
//         {
//             "fields": [
//                 {
//                     "default_value": "yes",
//                     "description": "",
//                     "field_key": "Acquisition Loan: LTV Calculation",
//                     "field_title": "Acquisition Loan: LTV Calculation",
//                     "field_type": "yes_no",
//                     "id": "b6740d14-d148-47ed-9555-d9e9f040e2d9",
//                     "order": 0,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "75",
//                     "description": "",
//                     "field_key": "Loan-to-Value (LTV)",
//                     "field_title": "Loan-to-Value (LTV)",
//                     "field_type": "percent",
//                     "id": "b0b7b03d-7830-4299-af85-ea094d1fdee0",
//                     "order": 1,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "0",
//                     "description": "",
//                     "field_key": "LTC on Hard Costs",
//                     "field_title": "LTC on Hard Costs",
//                     "field_type": "percent",
//                     "id": "b988fea2-adef-4425-8b4e-6405e78add86",
//                     "order": 2,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "7.5",
//                     "description": "",
//                     "field_key": "Acquisition Loan Interest Rate",
//                     "field_title": "Acquisition Loan Interest Rate",
//                     "field_type": "percent",
//                     "id": "25a9709a-290c-43d4-82d8-641fa090588e",
//                     "order": 3,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "0",
//                     "description": "",
//                     "field_key": "Hard Cost Amount",
//                     "field_title": "Hard Cost Amount",
//                     "field_type": "dollars",
//                     "id": "a15d92c7-d0d6-4039-af20-025696eb83cc",
//                     "order": 4,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "0",
//                     "description": "",
//                     "field_key": "Lender's Minimum Required Interest Reserve",
//                     "field_title": "Lender's Minimum Required Interest Reserve",
//                     "field_type": "dollars",
//                     "id": "1e7c088c-545a-4530-891e-ea9d13aa0c92",
//                     "order": 5,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "yes",
//                     "description": "",
//                     "field_key": "Acquisition Loan: Debt-Service Coverage Ratio Calculation",
//                     "field_title": "Acquisition Loan: Debt-Service Coverage Ratio Calculation",
//                     "field_type": "yes_no",
//                     "id": "3b1acc4e-749f-42b0-94d4-cbe10e5eba33",
//                     "order": 6,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "1",
//                     "description": "",
//                     "field_key": "Minimum DSCR",
//                     "field_title": "Minimum DSCR",
//                     "field_type": "number",
//                     "id": "025b0776-e3c5-48e7-859d-d7c50bb535f8",
//                     "order": 7,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "30",
//                     "description": "",
//                     "field_key": "Acquisition Loan Amortization",
//                     "field_title": "Acquisition Loan Amortization",
//                     "field_type": "year",
//                     "id": "292a898f-19f0-49e4-bfd7-d6b0d111868d",
//                     "order": 8,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "0",
//                     "description": "",
//                     "field_key": "Fixed Loan Amount",
//                     "field_title": "Fixed Loan Amount",
//                     "field_type": "dollars",
//                     "id": "56bed136-b1ff-4015-aa4f-db5b7d337f25",
//                     "order": 9,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "no",
//                     "description": "",
//                     "field_key": "Acquisition Loan: Fixed Loan Amount Selected",
//                     "field_title": "Acquisition Loan: Fixed Loan Amount Selected",
//                     "field_type": "yes_no",
//                     "id": "638b64fe-70a3-4c3d-bcae-7fffff6c1f68",
//                     "order": 10,
//                     "required": true,
//                     "time_phased": false
//                 }
//             ],
//             "id": "6849128e-8cd9-4a77-bff5-744e4bd58959",
//             "name": "Acquisition Financing",
//             "order": 2
//         },
//         {
//             "fields": [
//                 {
//                     "default_value": "60",
//                     "description": "",
//                     "field_key": "Multifamily Exit Month",
//                     "field_title": "Multifamily Exit Month",
//                     "field_type": "month",
//                     "id": "e65166a5-6b72-4346-a7a5-19b08e26a563",
//                     "order": 0,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "6",
//                     "description": "",
//                     "field_key": "Multifamily Applied Exit Cap Rate",
//                     "field_title": "Multifamily Applied Exit Cap Rate",
//                     "field_type": "percent",
//                     "id": "e117c63c-9322-48cf-897a-430c15ab4d69",
//                     "order": 1,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "3",
//                     "description": "%",
//                     "field_key": "Multifamily Less: Selling Costs",
//                     "field_title": "Multifamily Less: Selling Costs",
//                     "field_type": "percent",
//                     "id": "5efd3020-cb02-43b4-871f-796c9fb36d89",
//                     "order": 2,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "60",
//                     "description": "",
//                     "field_key": "Retail Exit Month",
//                     "field_title": "Retail Exit Month",
//                     "field_type": "month",
//                     "id": "d4aed50d-332f-439a-b985-1470da0e9194",
//                     "order": 3,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "8",
//                     "description": "",
//                     "field_key": "Retail Applied Exit Cap Rate",
//                     "field_title": "Retail Applied Exit Cap Rate",
//                     "field_type": "percent",
//                     "id": "298153ba-4d08-4eb7-8e66-2e660e16a0b8",
//                     "order": 4,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "4",
//                     "description": "",
//                     "field_key": "Retail Less: Selling Costs",
//                     "field_title": "Retail Less: Selling Costs",
//                     "field_type": "percent",
//                     "id": "76bd2d1a-cc44-48f7-956c-e08ab764a792",
//                     "order": 5,
//                     "required": true,
//                     "time_phased": false
//                 }
//             ],
//             "id": "f83fa884-9ac0-466f-a086-fe434a7b8b37",
//             "name": "Exit Assumptions",
//             "order": 3
//         },
//         {
//             "fields": [
//                 {
//                     "default_value": "Yes",
//                     "description": "",
//                     "field_key": "Permanent Loan Issued?",
//                     "field_title": "Would you like to model in a refinancing of the acquisition loan?",
//                     "field_type": "yes_no",
//                     "id": "b21d6856-3a5f-45c1-8059-474c8bdf7b43",
//                     "order": 0,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "36",
//                     "description": "",
//                     "field_key": "Refinancing Month",
//                     "field_title": "What month is the refinancing to take place?",
//                     "field_type": "month",
//                     "id": "f3655148-5a95-412a-8727-67f91f317b80",
//                     "order": 1,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "30",
//                     "description": "",
//                     "field_key": "Refi Amortization",
//                     "field_title": "Refi Amortization",
//                     "field_type": "year",
//                     "id": "105f2dbe-12a1-4057-806c-33a276b4a025",
//                     "order": 3,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "1.1",
//                     "description": "",
//                     "field_key": "Origination Cost (Includes Title)",
//                     "field_title": "Origination Cost (Includes Title)",
//                     "field_type": "percent",
//                     "id": "d1475917-e791-4e2a-b484-45645104d2af",
//                     "order": 4,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "6",
//                     "description": "",
//                     "field_key": "Applied Cap Rate for Valuation at Refi",
//                     "field_title": "Applied Cap Rate for Valuation at Refi",
//                     "field_type": "percent",
//                     "id": "17ea7fa7-acbc-4bcb-a767-a9d0d3abf74b",
//                     "order": 5,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "75",
//                     "description": "LTV Max",
//                     "field_key": "LTV Max",
//                     "field_title": "LTV Max",
//                     "field_type": "percent",
//                     "id": "a06df8c3-0953-4bc4-a51a-da698c5317b5",
//                     "order": 6,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "1.25",
//                     "description": "",
//                     "field_key": "Minimum Debt-Service-Coverage Ratio",
//                     "field_title": "Minimum Debt-Service-Coverage Ratio",
//                     "field_type": "number",
//                     "id": "6295c972-6a11-46e5-9079-5c77871276cd",
//                     "order": 7,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "8.75",
//                     "description": "Net Operating Income Divided by Loan Size",
//                     "field_key": "Debt Yield Min",
//                     "field_title": "Minimum Debt Yield",
//                     "field_type": "percent",
//                     "id": "d69325e3-09ea-4562-b436-fc1a8a0908ba",
//                     "order": 8,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "0",
//                     "description": "Share of Equity Contributed by the Sponsor or Lead Investor",
//                     "field_key": "Share of Equity from Sponsor",
//                     "field_title": "Share of Equity from Sponsor",
//                     "field_type": "percent",
//                     "id": "9c37f89a-901f-49c1-b116-9e8b8a39f668",
//                     "order": 9,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "active": true,
//                     "default_value": "5",
//                     "description": "",
//                     "field_key": "Refinancing: Fixed Interest Rate",
//                     "field_title": "Refinancing: Fixed Interest Rate",
//                     "field_type": "percent",
//                     "id": "a4068855-6f6d-4b64-ab0f-9a95ebac9104",
//                     "order": 10,
//                     "required": true,
//                     "time_phased": false
//                 }
//             ],
//             "id": "72fafe92-b12b-4794-8416-c8f82b55986b",
//             "name": "Refinancing",
//             "order": 4
//         },
//         {
//             "fields": [
//                 {
//                     "default_value": "5",
//                     "description": "",
//                     "field_key": "Less: Vacancy and Bad Debt",
//                     "field_title": "Less: Vacancy and Bad Debt",
//                     "field_type": "percent",
//                     "id": "f51caf65-bea9-4675-ae17-e748ea61aad8",
//                     "order": 1,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "70",
//                     "description": "",
//                     "field_key": "Renewal Property: Renewal Lease",
//                     "field_title": "Renewal Property: Renewal Lease",
//                     "field_type": "percent",
//                     "id": "d84a85e8-2ea0-47bb-8b2c-c71950a48eca",
//                     "order": 2,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "0",
//                     "description": "",
//                     "field_key": "Retail Rent: New Lease",
//                     "field_title": "Retail Rent: New Lease",
//                     "field_type": "dollars_per_sf",
//                     "id": "e23686a2-12a5-4544-95ef-3c5456740226",
//                     "order": 3,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "0",
//                     "description": "",
//                     "field_key": "Retail Rent: Renewal Lease",
//                     "field_title": "Retail Rent: Renewal Lease",
//                     "field_type": "dollars_per_sf",
//                     "id": "09de4b1b-f06c-401c-b5bd-299ee0ea2b61",
//                     "order": 4,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "0",
//                     "description": "",
//                     "field_key": "TI's: New Lease",
//                     "field_title": "TI's: New Lease",
//                     "field_type": "dollars_per_sf",
//                     "id": "02e37b22-94a1-4b3e-a14f-5469a8ad6ec1",
//                     "order": 5,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "0",
//                     "description": "",
//                     "field_key": "TI's: Renewal Lease",
//                     "field_title": "TI's: Renewal Lease",
//                     "field_type": "dollars_per_sf",
//                     "id": "c6bcac06-b320-464e-81d2-520542892f54",
//                     "order": 6,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "0",
//                     "description": "",
//                     "field_key": "Leasing Commissions: New Lease",
//                     "field_title": "Leasing Commissions: New Lease",
//                     "field_type": "percent",
//                     "id": "27e69ea2-ad24-4c1b-bee5-b858a897fdb0",
//                     "order": 7,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "0",
//                     "description": "",
//                     "field_key": "Leasing Commissions: Renewal Lease",
//                     "field_title": "Leasing Commissions: Renewal Lease",
//                     "field_type": "percent",
//                     "id": "4dbe3671-4cc7-4ec2-8969-2f37a4b448b4",
//                     "order": 8,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "1",
//                     "description": "",
//                     "field_key": "Lease Term: New Lease",
//                     "field_title": "Lease Term: New Lease",
//                     "field_type": "year",
//                     "id": "5b34d54d-cf60-4e69-8cbe-850b4866ca9a",
//                     "order": 9,
//                     "required": true,
//                     "time_phased": false
//                 },
//                 {
//                     "default_value": "1",
//                     "description": "",
//                     "field_key": "Lease Term: Renewal Lease",
//                     "field_title": "Lease Term: Renewal Lease",
//                     "field_type": "year",
//                     "id": "1e584335-630c-4198-b7e2-73293cf8dfec",
//                     "order": 10,
//                     "required": true,
//                     "time_phased": false
//                 }
//             ],
//             "id": "2cb1e6cc-cda2-4dee-919f-d2997f106923",
//             "name": "Retail Leasing Assumptions",
//             "order": 5
//         }
//     ]
// }


export const NON_DELETABLE_FIELDS = ["Asking Price"
// ,"Acquisition Price"
// ,"Model Start Date"
// ,"Gross Square Feet"
// ,"Share of Equity from Sponsor"
// ,"Refinancing: Fixed Interest Rate"
// ,"Rehab time"
// ,"Lease-up Time"
// ,"Bad Debt"
// ,"Vacancy"
// ,"Free Month's Rent"
// ,"Broker Fee"
// ,"Annual Turnover"
// ,"Acquisition Loan: LTV Calculation"
// ,"Loan-to-Value (LTV)"
// ,"LTC on Hard Costs"
// ,"Acquisition Loan Interest Rate"
// ,"Hard Cost Amount"
// ,"Lender's Minimum Required Interest Reserve"
// ,"Acquisition Loan: Debt-Service Coverage Ratio Calculation"
// ,"Minimum DSCR"
// ,"Acquisition Loan Amortization"
// ,"Acquisition Loan: Fixed Loan Amount Selected"
// ,"Fixed Loan Amount"
// ,"Permanent Loan Issued?"
// ,"Refinancing Month"
// ,"Refi Amortization"
// ,"Origination Cost (Includes Title)"
// ,"Applied Cap Rate for Valuation at Refi"
// ,"LTV Max"
// ,"Minimum Debt-Service-Coverage Ratio"
// ,"Debt Yield Min"
// ,"Multifamily Exit Month"
// ,"Multifamily Applied Exit Cap Rate"
// ,"Multifamily Less: Selling Costs"
// ,"Estimated Pro Forma Rent Roll"
// ,"Net Rentable SF"
// ,"Growth Rates Header"
// ,"Re-Stabilization Occurs"
// ,"Lease-up Time"
// ,"Rehab Time"
// ,"Address"
// ,"Sensitivity Purchase Price 1"
// ,"Sensitivity Purchase Price 2"
// ,"Sensitivity Exit Cap Rate 1"
// ,"Sensitivity Exit Cap Rate 2"
// ,"Levered IRR"
// ,"Levered MOIC"
// ,"Max Loan Size"
]



export const createModelSubheaders = {
    "Property Address" : "",
    "General Property Assumptions" : "",
    "Residential Rental Units" : "",
    "Market Rent Assumptions" : 'Now that we established current and market rents, use the “Vacate” columns to decide which units will be reset to market rents',
    "Retail Income" : "",
    "Amenity Income" : "",
    "Operating Expenses" : "",
    "Rental Unit Growth Rates" : "Now it's time to create the current rent roll. If a unit is vacant, be sure to add it, and leave the current rent as zero. You can establish different rent growth rates in the Rent Type column.",
    "Acquisition Financing" : "Configure your acquisition loan parameters by selecting and configuring the columns below.",
    "Leasing Assumptions" : "",
    "Refinancing" : "Model refinancing options for your acquisition loan",
    "Exit Assumptions" : ""
}