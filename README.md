# underwritRE_app

This repository contains both the frontend and backend for the **underwritRE** application.

---

## Project Structure

<pre>
underwritre_app/
├── uw_frontend/         <b># React frontend</b>
│   ├── public/              <i># Static assets served as-is</i>
│   ├── src/
│   │   ├── assets/         <i># Images & logos used by the app</i>
│   │   ├── api/            <i># Helpers for calling backend (Flask) endpoints</i>
│   │   ├── auth/           <i># Auth0 integration (hooks, providers)</i>
│   │   ├── components/     <i># Reusable UI (tables, inputs, PDF, etc.)</i>
│   │   ├── context/        <i># React contexts (User, Models)</i>
│   │   ├── pages/          <i># Route-based views</i>
│   │   │   ├── Home.tsx                <i># Landing/dashboard</i>
│   │   │   ├── ModelDetails.tsx        <i># Model view/edit, images, notes, PDF</i>
│   │   │   ├── CreateModel.tsx         <i># Create a new model, or create new version of existing model.</i>
│   │   │   ├── Settings.tsx            <i># Company settings (logo, contact info)</i>
│   │   │   ├── AdminUsers.tsx          <i># Admin: manage users</i>
│   │   │   ├── UserMgmt.tsx            <i># Admin: assign roles, reset, etc.</i>
│   │   │   ├── AdminModelTypes.tsx     <i># Admin: list model types</i>
│   │   │   ├── CreateModelType.tsx     <i># Admin: create model type/sections/fields</i>
│   │   │   ├── ModelTypeDetail.tsx     <i># Admin: edit model type definition</i>
│   │   │   └── UserIssues.tsx          <i># Issue reporting and triage</i>
│   │   ├── utils/          <i># Helpers, constants, calculators</i>
│   │   ├── types/          <i># TypeScript type definitions</i>
│   │   ├── App.tsx
│   │   ├── AppRoutes.tsx
│   │   ├── index.tsx
│   │   └── index.css
│   ├── deploy_to_cloud_run.sh <i># Build/push frontend image & deploy to Cloud Run</i>
│   ├── Dockerfile          <i># Container build for frontend (Nginx)</i>
│   ├── nginx.conf          <i># Nginx config for serving React build</i>
│   ├── tsconfig.json       <i># TypeScript configuration</i>
│   ├── package.json        <i># Frontend dependencies & scripts</i>
│   └── package-lock.json   <i># Locked dependency tree</i>
│
├── uw_backend/          <b># Flask backend</b>
│   ├── app/                <i># Application code</i>
│   │   ├── __init__.py     <i># Creates Flask app, registers blueprints</i>
│   │   ├── db.py           <i># DB engine/session setup</i>
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   └── auth0.py    <i># Auth0 helpers (token validation, etc.)</i>
│   │   ├── routes/         <i># Flask Blueprints</i>
│   │   │   ├── billing.py  <i># Billing endpoints</i>
│   │   │   ├── health.py   <i># Health check</i>
│   │   │   ├── model.py    <i># Model CRUD & data APIs</i>
│   │   │   └── user.py     <i># User management APIs</i>
│   │   ├── models/         <i># ORM/data models</i>
│   │   │   ├── model.py
│   │   │   └── user.py
│   │   ├── services/
│   │   │   └── google_drive_service.py  <i># Google Sheets/Drive integration</i>
│   │   └── utils/
│   │       └── __init__.py
│   ├── main.py             <i># Service entry point (Gunicorn/Flask)</i>
│   ├── requirements.txt    <i># Python dependencies (pip)</i>
│   ├── Dockerfile          <i># Container build for backend (Cloud Run)</i>
│   ├── deploy_to_cloud_run.sh <i># Build/push backend image & deploy to Cloud Run</i>
│   ├── create_db.py        <i># Utility: create DB schema</i>
│   ├── drop_tables.py      <i># Utility: drop DB tables</i>
│   ├── list_tables.py      <i># Utility: list DB tables</i>
│   ├── test_drive_access.py<i># Utility: validate Drive access</i>
│   ├── dev_db_service_account.json      <i># Dev SA (local)</i>
│   └── secrets/
│       └── service_account_key.json     <i># Service account for prod</i>
│
└── README.md
</pre>


## Local development setup 

- Prerequisites:
  - Node 18+ and npm 10+ (frontend)
  - Python 3.13 (backend) and pip
  - PostgreSQL running locally (connect via `DATABASE_URL`; no Cloud SQL Proxy needed)

- Backend (Flask + local Postgres):
  - `cd uw_backend`
  - Create venv and install deps: `python3.13 -m venv venv && source venv/bin/activate && pip install -r requirements.txt`
  - Create `.env` with at least:
    - `DATABASE_URL=postgresql+psycopg2://<user>:<pass>@127.0.0.1:5432/underwritre_dev`
    - `CORS_ALLOWED_ORIGINS=http://localhost:3000`
    - Auth0: `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`
    - Optional for billing/dev: `STRIPE_SECRET_KEY`, `PRICE_ID`, `APP_URL=http://localhost:3000`
    - Google (for Drive/Sheets features): `SERVICE_ACCOUNT_FILE=secrets/service_account_key.json` or `GOOGLE_APPLICATION_CREDENTIALS=/abs/path/to/service_account_key.json`
  - Create database/tables: ensure a local DB exists, then run `python create_db.py`
  - Start API: `python main.py` (serves on `http://127.0.0.1:5000`)

- Frontend (React):
  - `cd uw_frontend && npm ci`
  - Create `.env` with:
    - `REACT_APP_AUTH0_DOMAIN`, `REACT_APP_AUTH0_CLIENT_ID`, `REACT_APP_AUTH0_AUDIENCE`
    - `REACT_APP_BACKEND_URL=http://127.0.0.1:5000`
    - `REACT_APP_STRIPE_PK` (for Settings → Billing)
  - Start UI: `npm start` (opens `http://localhost:3000`)

- Notes:
  - The app reads/writes Google Sheets when a service account is provided and has access to the shared drive. For basic UI and local DB testing, Sheets is optional.
  - If CORS errors appear, confirm `CORS_ALLOWED_ORIGINS` includes the frontend origin.


## Deployment 
Below are the steps to deploy the frontend and backend to Cloud Run for dev and prod. These mirror the checked-in Dockerfiles and deploy scripts.

### Frontend (uw_frontend)
- Prerequisites:
  - Install gcloud SDK and authenticate: `gcloud auth login`
  - Set project: `gcloud config set project underwritre`
- Build & Deploy:
  - Dev vs Prod: in `uw_frontend/deploy_to_cloud_run.sh`, set:
    - `SERVICE_NAME="underwritre-web-dev"` (Dev) or uncomment/change to `"underwritre-web-prod"` (Prod)
    - `GCP_PROJECT` and `REGION` should match your target (currently `underwritre`, `us-east1`)
  - Run:
    - `cd uw_frontend`
    - `bash deploy_to_cloud_run.sh`
  - What it does:
    - Builds the React app with the multi-stage Dockerfile (Node builder → Nginx static server)
    - Creates (if needed), tags, and pushes the image to Artifact Registry
    - Deploys to Cloud Run with `--allow-unauthenticated`
- Notes:
  - Frontend Dockerfile serves the built app via Nginx on port 8080 (Cloud Run standard).
  - The Artifact Registry repo is named from `SERVICE_NAME` (e.g., `underwritre-web-dev-repo`). Ensure the repo location aligns with `REGION`.

### Backend (uw_backend)
- Prerequisites:
  - Install gcloud SDK and authenticate: `gcloud auth login`
  - Set project: `gcloud config set project underwritre`
- Build & Deploy:
  - Dev vs Prod: in `uw_backend/deploy_to_cloud_run.sh` set:
    - Dev:
      - `SERVICE_NAME=underwritre-api-dev`
      - `VPC_CONNECTOR=underwritre-db-dev`
      - `CONNECTION_NAME=underwritre:$REGION:underwritre-api-dev`
    - Prod (uncomment and set the corresponding prod values)
  - Run:
    - `cd uw_backend`
    - `bash deploy_to_cloud_run.sh`
  - What it does:
    - Builds and pushes the image to Artifact Registry
    - Deploys to Cloud Run, attaching:
      - `--add-cloudsql-instances=$CONNECTION_NAME`
      - `--vpc-connector=$VPC_CONNECTOR`
      - `--ingress all`
- Notes:
  - Backend Dockerfile runs Gunicorn binding to `:8080` with `main:app`.
  - Ensure required secrets/vars are provided (e.g., service account JSON, env vars for database creds) per runtime setup.

## Authentication 
The app uses Auth0 for user authentication and JWT-based API authorization.

- Frontend (Auth0 React SDK):
  - `useAuth0()` manages login/logout and token retrieval.
  - Tokens are requested via `getAccessTokenSilently` with `audience` and `scope` and sent as `Authorization: Bearer <token>` on API requests.
  - After login, the app calls `/api/check_user` to ensure the user exists server-side, then fetches `/api/user_info` to drive UX (e.g., Terms modal).
  - Error handling: Auth0 redirect errors are detected from URL params; the app shows a warning and performs a one-time logout to reset session.
  - Required env (frontend): `REACT_APP_AUTH0_DOMAIN`, `REACT_APP_AUTH0_CLIENT_ID`, `REACT_APP_AUTH0_AUDIENCE`, and any admin lists such as `REACT_APP_ADMIN_EMAILS`.

- Backend (Flask):
  - All protected routes use `@requires_auth` (see `app/auth/auth0.py`) to validate the Auth0 JWT and populate `g.current_user`.
  - CORS is enabled via `@cross_origin(..., supports_credentials=True)` with allowed origins from `CORS_ALLOWED_ORIGINS`.
  - The API expects `Authorization: Bearer <token>` and also reads the caller email from header `X-User-Email` to look up the user record.
  - `/api/check_user` ensures a `User` exists (creating one if necessary) and attempts to refresh Stripe subscription metadata; subsequent endpoints like `/api/user_info`, `/company_info`, and `/company_logo/*` use the same auth pattern.
  - Required env (backend): `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `CORS_ALLOWED_ORIGINS`, and any provider keys (e.g., `STRIPE_SECRET_KEY`).

- Auth0 tenant configuration:
Tenant located at [Auth0 Dashboard](https://manage.auth0.com/dashboard/us/underwritre/)
  - Create a Machine-to-Web/API in Auth0 representing your backend; set its Identifier as the API `audience`.
  - Add your frontend origin(s) and callback/logout URLs to the Auth0 application.
  - Grant “RS256” signing for tokens and use the well-known JWKS URL in the backend validator (handled in `requires_auth`).

## Overall application flow

- Entry and authentication
  - Unauthenticated users land on the login screen and authenticate via Auth0.
  - After login, the frontend calls `/api/check_user` to ensure a `users` record exists, then fetches `/api/user_info`. If Terms are not accepted, `TermsModal` is shown for one-time acceptance.
  - Relevant files: `uw_frontend/src/App.tsx`, `uw_frontend/src/components/TermsModal.tsx`, backend routes in `uw_backend/app/routes/user.py`.

- Home (Your Models)
  - Shows the signed-in user’s models and actions to create a new model or open an existing one.
  - Relevant file: `uw_frontend/src/pages/Home.tsx`.

- Create / Edit Model
  - Create new:
    - Select a `Model Type`, enter property info, then proceed through steps.
    - On finish, a `user_models` record and its first `user_model_versions` record are created; a Google Sheet is generated and linked to the version.
  - Edit (new version from an existing one):
    - When opened with an existing version id, the page loads that version’s data, generates a fresh Google Sheet for edits, and marks primary steps complete to jump into editing.
    - “Save & Exit” creates a new `user_model_versions` record via `/api/user_models_new_version` and navigates to the new version’s details page.
    - Section transitions may trigger partial saves (`/api/user_models_intermediate`), and single-field changes are coalesced and posted to `/api/user_models_single_field_updates`.
  - Relevant files: `uw_frontend/src/pages/CreateModel.tsx`, backend endpoints in `uw_backend/app/routes/model.py`.
  - Sheet lifecycle and update rules (based on Primary vs Secondary steps in `CreateModel.tsx`):
    - Primary steps: `"Property Address"`, `"General Property Assumptions"`, `"Residential Rental Units"`, `"Market Rent Assumptions"`, `"Retail Income"`, `"Amenity Income"`, `"Operating Expenses"`, `"Base Income"`, `"Recoverable Operating Expenses"`, `"Recovery and Gross Potential Income"`, `"Leasing Cost Reserves"`, `"Income Summary"`.
    - Secondary steps: `"Net Operating Income"`, `"Acquisition Financing"`, `"Leasing Assumptions"`, `"Refinancing"`, `Closing Costs`, `Legal and Pre-Development Costs`, `Reserves`, `Hard Costs`, `"Exit Assumptions"`.
    - New sheet is generated:
      - When the user starts a new model (after selecting a model type).
      - When opening to edit an existing version (fresh sheet for that edit session).
      - When navigating from any Secondary step back to a Primary step.
    - Intermediate/batch updates to the sheet:
      - When navigating from any Primary step to any Secondary step, the app posts an intermediate save (`/api/user_models_intermediate`) to update the sheet with the latest inputs.
      - While on expense-specific steps (e.g., `Closing Costs`, `Reserves`), updates are posted to `/api/user_models_expense` for that sheet/section.
    - Single-field updates:
      - While staying within a step, individual changes (excluding “General Property Assumptions” and “Retail Leasing Assumptions”) are queued and debounced (~500ms), then sent to `/api/user_models_single_field_updates` once the model mapping and sheet URL are ready.

- View Model
  - Central workspace for a model version with ability to look through versions. 
  - Also allows upload for property images (JPEG/PNG, stored in GCloud Bucket), add notes, and reorder PDF sections.
  - Retail/Industrial read-only summaries are rendered to mirror editable tables; various inputs enforce formatting (e.g., integer months, decimal bumps).
  - Company info/logo can be shown in PDFs; company settings are managed on the Settings page.
  - Other tabs and summary tables are driven by the Google Sheet’s “Table Mapping” tab in the template. The backend reads this mapping to determine which sheet ranges feed which rendered tables/sections, their order, and whether they are summary outputs.

  - Relevant files: `uw_frontend/src/pages/ModelDetails.tsx`, `uw_frontend/src/pages/Settings.tsx`, and components referenced within (`RetailSummary.tsx`, `RetailIncomeTable.tsx`, `GrossPotentialRetailIncomeTable*.tsx`, etc.).

- Downloads (PDF & Excel/Sheets)
  - PDF: Use the Download Options dialog to include/exclude sections, include notes, company info/logo, and set section order. Retail-only layouts are supported. PDFs render with dividers, correct pagination, and totals.
  - Excel/Sheets: From Model Details, open the linked Google Sheet (`user_model_versions.google_sheet_url`) for full spreadsheet access/export.
  - Relevant files: `uw_frontend/src/components/PdfSummaryDocument.tsx`, `uw_frontend/src/pages/ModelDetails.tsx`.

- Admin flows
  - Model Types (templates):
    - List/manage types: `uw_frontend/src/pages/AdminModelTypes.tsx`
    - Create type with sections/fields (including tag-style `select_options`): `uw_frontend/src/pages/CreateModelType.tsx`
    - Update an existing type definition: `uw_frontend/src/pages/ModelTypeDetail.tsx`
  - Users and org:
    - View/manage users and roles: `uw_frontend/src/pages/AdminUsers.tsx`, `uw_frontend/src/pages/UserMgmt.tsx`
  - Feedback and issues:
    - View user-submitted issues/feedback: `uw_frontend/src/pages/UserIssues.tsx`

## Reading and writing to Google Sheets

- Shared Drive and templates
  - Shared Drive root: [UnderwritRE Models](https://drive.google.com/drive/folders/0AF_DHa_-DVHBUk9PVA?dmr=1&ec=wgc-drive-hero-goto)
  - Folder structure:
    - UnderwritRE Models/
      - User Models PROD
      - User Models DEV
      - Templates/
        - Mixed‑Use template - PROD
        - Multifamily template - PROD
        - Industrial Model DEV
        - (other in‑progress templates)
  - Conventions:
    - Templates suffixed with “- PROD” are the sheets currently used in production.
    - The template used by each `Model Type` is managed in the Admin UI: `Admin → Model Types` (`/admin/model-types`). Open a type to view/update its template Google Sheet URL.
  - .env references (backend):
    - `GOOGLE_APPLICATION_CREDENTIALS` → path to the service account JSON with Drive/Sheets scopes.
    - Optional (if you prefer static IDs vs. name discovery):  
      `GDRIVE_MODELS_ROOT_NAME=UnderwritRE Models`,  
      `GDRIVE_TEMPLATES_FOLDER_NAME=Templates`,  
      `GDRIVE_USER_MODELS_DEV_FOLDER_NAME=User Models DEV`,  
      `GDRIVE_USER_MODELS_PROD_FOLDER_NAME=User Models PROD`.
    - If these NAME vars are not set, the backend discovers/creates folders by name under the shared drive.

- Template, copy, and mapping
  - A new Google Sheet is created per model/version by copying a template into a Drive folder, then updating values: see `generate_google_sheet_for_user_model`, `copy_template_to_folder`, `create_drive_folder`.
  - The app reads three mapping tabs from the template:
    - “Model Variable Mapping” → source of truth for where inputs are written (cell locations); used by debounced/single-field updates. See `extract_variables_from_sheet(_batch)` and helpers like `get_mapped_cell_location`.
    - “Variables” → computed outputs to return to the UI to render real‑time results (IRR/MOIC/NOI/etc.). See `extract_variables_from_sheet(_batch)`.
    - “Table Mapping” → defines which sheet ranges feed end tables in Model Details (and PDFs), plus order/summary flags. See `extract_tables_for_storage(_batch)`.
  - Helpers like `get_sheet_id`, `a1_to_row_col`, and `get_mapped_cell_location` translate A1 ranges and connect fields to cells.

- Update models into Sheets
  - Full/initial update: `run_full_sheet_update` and `update_google_sheet_and_get_values` push all core inputs (market, units, growth, amenity, operating expenses, retail, address, property name) and return computed outputs for the UI.
  - Step-to-step intermediate update (Primary → Secondary): `update_google_sheet_and_get_values_intermediate` writes latest inputs before moving into secondary outputs.
  - Debounced single-field updates while editing: `update_google_sheet_field_values_and_get_values` uses the model/variable mappings to write only changed fields and re-fetch outputs.
  - Final pass on finish/save flows: `update_google_sheet_and_get_values_final`.

- Section-specific writers (selected)
  - Amenity Income: `get_amenity_income_*` insert/update/format/formula helpers (Amenity Income and NOI Walk sheets).
  - Operating Expenses: `get_operating_expenses_*`, `get_operating_expense_formula_update_payloads(_industrial)`, and NOI linking helpers (`get_noi_expense_rows_insert_and_update(_industrial)`).
  - Retail (Industrial/Retail modes): `get_retail_assumptions_inserts(_industrial)`, `get_retail_recovery_inserts(_industrial)`, `get_retail_expenses_inserts(_industrial)` plus matching summary-row helpers.
  - Expenses tables (Retail recoverable, etc.): row insert/clear/update via `insert_expense_rows_to_sheet`, `clear_expense_table_rows`, and API wrapper `update_user_model_expense_table`.
  - Sensitivity: `generate_sensitivity_analysis_tables` and `update_sensitivity_reference_cells`.

- Formatting and presentation
  - Formatting payloads apply number formats, bolding, borders, and totals styling across inserted ranges (e.g., `get_amenity_income_format_requests`, `get_operating_expenses_format_payload`). Newly inserted data rows are set to regular weight; totals rows are bold.
  - A convenience helper `add_blank_row_and_column_to_sheets` ensures safe edges for formulas/page breaks.

- Export
  - Sheets can be exported to Excel via `export_google_sheet` when needed for offline sharing.

- Key file
  - All Google Sheets logic lives in `uw_backend/app/services/google_drive_service.py`. The frontend orchestrates calls based on step transitions and debounced edits (see “Create / Edit Model”).

## Google Cloud Platform References

- Cloud Run (services):  
  https://console.cloud.google.com/run/overview?referrer=search&project=underwritre
- Cloud SQL (instances):  
  https://console.cloud.google.com/sql/instances?referrer=search&project=underwritre
- Cloud Storage (buckets/objects):  
  https://console.cloud.google.com/storage/browser?referrer=search&project=underwritre&prefix=&forceOnBucketsSortingFiltering=true&bucketType=live
- IAM Service Accounts:  
  https://console.cloud.google.com/iam-admin/serviceaccounts?referrer=search&project=underwritre

Storage buckets (Multi‑region: us, Standard class):
- underwritre_image_uploads
  - Purpose: user-uploaded images (e.g., company logos, property images).
  - Access: private by default; read via signed URLs or via GCS client from the backend.
  - Related env (backend): `GCS_LOGO_BUCKET_NAME` (default: `underwritre_image_uploads`), optional `GCS_LOGO_FOLDER` (default: `logos`), `GCS_LOGO_MAKE_PUBLIC` (optional).
  - Typical object path: `logos/<user_id>/<uuid>.<ext>` (see `/company_logo/upload`).
- uw_dev_database_1_20
  - Purpose: development database exports/backups and related artifacts.
  - Access: restricted; not public. Use service account with least privilege for exports/imports.
  - Recommendation: apply lifecycle/retention policy for old exports.
- uw_resources
  - Purpose: public/static resources used by the app (templates, public images, docs).
  - Access: public or distributed via signed URLs depending on need; avoid PII.
  - Use for long‑lived, read‑mostly assets referenced by the frontend.

## Database structure 

Core entities and relationships (PostgreSQL via SQLAlchemy):

- Users
  - Defined in `uw_backend/app/models/user.py`.
  - `users`: Auth0-linked users (`auth0_user_id`, `email`, `is_active`) and billing fields (Stripe IDs/status).
  - 1:1 profiles
    - `user_info`: demographics, preferences, and Terms acceptance timestamps.
    - `company_info`: company name/email/phone and `company_logo_url`.

- Model definitions (admin-configured)
  - Defined in `uw_backend/app/models/model.py`.
  - `model_types`: high-level template (flags: `show_retail`, `show_rental_units`, optional `google_sheet_url`).
  - `model_type_sections`: ordered sections per type.
  - `model_type_section_fields`: fields per section with metadata (`field_key`, `field_type`, `time_phased`, `required`, `default_value`, `description`).

- User models and versions
  - Defined in `uw_backend/app/models/model.py`.
  - `user_models`: a user’s property/model shell (name, address, `model_type_id`, `user_id`, `active`).
  - `user_model_versions`: versioned snapshots per model (linked Google Sheet URL, derived metrics like `levered_irr`, `levered_moic`, plus JSON blobs for `table_mapping_output`, `variables`, `sensitivity_tables`).
  - `user_model_field_values`: field values captured for a specific version and field; supports time-phased via `start_month`/`end_month`.

- Version-scoped detail tables (all keyed by `user_model_version_id`)
  - Defined in `uw_backend/app/models/model.py`.
  - `units`: unit inventory and current rents.
  - `market_rent_assumptions`: market PF rent by layout.
  - `growth_rates`: named growth rates with type and numeric value.
  - `amenity_income`: amenity assumptions (utilization, unit counts, monthly fee).
  - `operating_expenses`: operating expense assumptions (factor, broker, cost basis).
  - `expenses`: recoverable/non-recoverable retail expenses with factors, statistics, months, and `rent_type_included`.
  - `retail_income`: retail/industrial income rows (suite, tenant, SF, start months, `annual_bumps`, PSF/year, `rent_type`, lease term bounds).

- Model annotations (not versioned; attached to the model)
  - Defined in `uw_backend/app/models/model.py`.
  - `model_notes`: free-form notes with status and timestamps.
  - `model_pictures`: ordered picture URLs and descriptions.
  - `model_tags`: simple tagging for organization.

- Feedback
  - Defined in `uw_backend/app/models/model.py`.
  - `issues`: user-submitted issue reports tied to a user, with page/subsection context and timestamp.


## API Overview

- Base path: `/api/*`. All endpoints require Auth0 JWT unless noted.

- Health
  - GET `/health` → service health.

- User and Account
  - GET `/check_user` → ensures a `users` record exists; refreshes Stripe metadata if present.
  - GET/PUT `/user_info` → read/update the caller’s profile and terms acceptance.
  - GET/PUT `/company_info` → read/update company profile (name/email/phone/logo URL).
  - GET `/company_logo/data_url` → proxy company logo as data URL.
  - POST `/company_logo/upload` → upload company logo to GCS.

- Billing (Stripe)
  - POST `/billing/setup-intent` → create Setup Intent to collect a payment method.
  - POST `/billing/start-subscription` → start subscription (short trial for first-time customers).
  - POST `/billing/start-promo-subscription` → start promo subscription (uses `STRIPE_PROMO_CODE` and `PROMO_TRIAL_DAYS`).
  - POST `/billing/portal` → Stripe Billing Portal session.
  - GET `/billing/subscription` → subscription details and eligibility.
  - POST `/stripe/webhook` → webhook (unauthenticated; verified via `STRIPE_WEBHOOK_SECRET`).

- Model Types (templates)
  - GET `/model_types`, GET `/model_types/{id}`
  - POST `/model_types/full`, PUT/PATCH `/model_types/{id}`, DELETE `/model_types/{id}`
  - POST `/model_types/{id}/google_sheet` → set/validate template Sheet URL.
  - POST `/model_types/{id}/generate_sheet` → copy template for a user and return new sheet URL.
  - Sections/Fields CRUD:
    - POST `/model_type_sections`, PUT/PATCH `/model_type_sections/{id}`, DELETE `/model_type_sections/{id}`
    - POST `/model_type_section_fields`, PUT/PATCH `/model_type_section_fields/{id}`, DELETE `/model_type_section_fields/{id}`

- User Models and Versions
  - POST `/user_models` → create model + version 1 (persists inputs, pulls outputs from Sheets).
  - POST `/user_models_new_version` → create new version from edits.
  - GET `/user_models/{id}` → model details with latest or requested version.
  - GET `/user_models_version/{version_id}` → specific version details.
  - GET `/user_models?user_id={uuid}` → list a user’s models with latest KPIs and tags.
  - PATCH `/user_models/{id}/active` → toggle active flag.

- In-session Sheet Updates
  - POST `/user_models_intermediate` → batch write when moving Primary → Secondary step.
  - POST `/user_models_single_field_updates` → debounced single-field writes via Model Variable Mapping.
  - POST `/user_models_expense` → write expense table rows to the named sheet.

- Pictures, Notes, Tags
  - Pictures: POST `/user_models/{id}/pictures/upload`, GET `/user_models/{id}/pictures`, GET `/user_models/{id}/pictures/data_urls`, PATCH `/pictures/{picture_id}`, PATCH `/pictures/{picture_id}/remove`
  - Notes: POST/GET `/user_models/{id}/notes`, PATCH `/notes/{note_id}`, PATCH `/notes/{note_id}/remove`
  - Tags: POST `/user_models/{id}/tags`, PATCH `/tags/{tag_id}`, PATCH `/tags/{tag_id}/remove`

- Outputs and Exports
  - POST `/sensitivity-analysis` → generate sensitivity tables in the sheet and persist.
  - GET/POST `/download_worksheet/{version_id}` → export the linked sheet as Excel; POST may include `notes` to write before export.


## Roles and Access

- Admin determination (frontend):
  - Admins are derived from `REACT_APP_ADMIN_EMAILS` (comma‑separated). If the logged‑in user’s email matches, admin routes and controls are enabled in the UI.
  - The backend still enforces ownership/authorization per resource; admin UI is primarily a capability unlock on the client.

- Admin capabilities:
  - Model Types: create/update sections and fields; set template Google Sheet URL (`/admin/model-types`).
  - Users: view users and high‑level stats;
  - Issues: view user‑submitted feedback (`/admin/issues`).

## Env and untracked files reference

Locations (not committed):
- Frontend env: `uw_frontend/.env`
  - `REACT_APP_AUTH0_DOMAIN`, `REACT_APP_AUTH0_CLIENT_ID`, `REACT_APP_AUTH0_AUDIENCE`
  - `REACT_APP_BACKEND_URL` (e.g., `http://127.0.0.1:5000`)
  - `REACT_APP_STRIPE_PK` (Stripe publishable key)
  - `REACT_APP_ADMIN_EMAILS` (comma‑separated admin emails)
- Backend env: `uw_backend/.env`
  - Database/CORS: `DATABASE_URL`, `CORS_ALLOWED_ORIGINS`
  - Auth0: `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`
  - Stripe: `STRIPE_SECRET_KEY`, `PRICE_ID`, `STRIPE_PROMO_CODE` (opt), `PROMO_TRIAL_DAYS` (opt), `STRIPE_WEBHOOK_SECRET`, `APP_URL`
  - Google: `SERVICE_ACCOUNT_FILE=secrets/service_account_key.json` or `GOOGLE_APPLICATION_CREDENTIALS=/abs/path/key.json`
  - Drive/Sheets (optional names): `GDRIVE_MODELS_ROOT_NAME`, `GDRIVE_TEMPLATES_FOLDER_NAME`, `GDRIVE_USER_MODELS_DEV_FOLDER_NAME`, `GDRIVE_USER_MODELS_PROD_FOLDER_NAME`
  - Storage: `GCS_LOGO_BUCKET_NAME`, `GCS_PROPERTY_IMAGES_FOLDER` (default `property_images`), `GCS_LOGO_MAKE_PUBLIC`
- Untracked keys:
  - `uw_backend/dev_db_service_account.json` (local dev only)
  - `uw_backend/secrets/service_account_key.json` (service account for Drive/Sheets in staging/prod)

Never commit `.env` or key files. Ensure the service account has Drive and Sheets scopes and read/write access to the shared drive folders.


## Stripe 

- Frontend (Settings page):
  - The Settings page embeds Stripe Elements to collect a payment method and start subscriptions.
  - Flow:
    - “Start 14‑day free trial” calls POST `/billing/setup-intent` to get a `clientSecret`, renders `<PaymentElement />`, then confirms the setup intent and calls POST `/billing/start-subscription` with the saved `payment_method`.
    - “Manage billing” calls POST `/billing/portal` and redirects the user to Stripe’s Billing Portal.
    - Subscription details (status, trial dates, price, current period, payment method, invoices) are fetched from GET `/billing/subscription` and shown in a summary grid.
    - Trial eligibility logic relies on `eligible_for_trial` returned by the backend; after successful start the page opens the Billing Portal.
  - Frontend env var: `REACT_APP_STRIPE_PK` (publishable key used by `loadStripe`).
  - Relevant file: `uw_frontend/src/pages/Settings.tsx`.

- Backend / Key endpoints (all require Auth0 JWT):
  - POST `/billing/setup-intent` → creates a Setup Intent for saving a payment method.
  - POST `/billing/start-promo-subscription` → starts a subscription with a long free trial when a valid promo code is supplied; no payment method required up front.
  - POST `/billing/start-subscription` → starts a paid subscription using a provided `payment_method`. If the customer has never had any subscription, a short trial is applied.
  - POST `/billing/portal` → creates a Stripe Billing Portal session and returns a URL for account management. Return URL is derived from `APP_URL` and the current host.
  - GET `/billing/subscription` → returns current subscription details and eligibility flags (e.g., `eligible_for_trial`).
  - POST `/stripe/webhook` → webhook handler that persists subscription changes; configure Stripe to send events here.

- Environment variables:
  - `STRIPE_SECRET_KEY` → required; secret API key.
  - `PRICE_ID` → required; the Stripe Price to subscribe users to.
  - `STRIPE_PROMO_CODE` → optional; case-insensitive promo code enabling promo subscription flow.
  - `PROMO_TRIAL_DAYS` → optional; number of free trial days for promo subscriptions (default 60). No payment method is required for this flow.
  - For non‑promo subscriptions, first‑time customers get a short trial (14 days) automatically; returning customers do not.
  - `STRIPE_WEBHOOK_SECRET` → required for webhook verification.
  - `APP_URL` → used to build the return URL for the Billing Portal (defaults to `http://localhost:3000`).

- Persistence and synchronization:
  - User and subscription identifiers/statuses are stored on the `users` table.
  - Webhooks and the subscription detail endpoint backfill/refresh local fields to avoid stale data.

