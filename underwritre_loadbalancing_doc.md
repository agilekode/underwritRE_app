# 🌐 Underwritre App — Load Balancer & Certificate Manager Docs

This document explains how our HTTPS Load Balancer and Google Certificate Manager are configured for **`app.underwritre.com`** and **`www.app.underwritre.com`**, and what to check during maintenance.

---

## 🔧 Current Setup
- **Frontend:** Cloud Run service (`underwritre-web-prod`)
- **Load Balancer:** Global external HTTPS LB with:
  - **Serverless NEG** pointing to Cloud Run
  - **Backend service:** `uwr-backend`
  - **URL map:** `uwr-urlmap`
    - `app.underwritre.com` → backend
    - `www.app.underwritre.com` → 301 redirect → `app.underwritre.com` (preserves path/query)
  - **HTTPS proxy:** `uwr-https-proxy`
  - **Global static IP:** `34.96.95.178`
- **Certificate Manager:**
  - Cert: `uwr-managed-cert` (Google-managed, DNS-authorized)
  - Cert map: `uwr-cert-map`
  - Cert map entries: `app-entry`, `www-entry`
- **Squarespace DNS:**
  - `app` → **A record** → `34.96.95.178`
  - `www.app` → **A record** → `34.96.95.178`
  - `_acme-challenge.app` → CNAME → `*.authorize.certificatemanager.goog`
  - `_acme-challenge.www.app` → CNAME → `*.authorize.certificatemanager.goog`
  - Other MX/TXT/CNAME → untouched (Google Workspace + Squarespace defaults)

---

## 🛠️ Regular Checks

### 1. Certificate Status
Verify cert is `ACTIVE`:
```bash
gcloud certificate-manager certificates describe uwr-managed-cert   --location=global --format="get(managed.status)"
```
Should be `ACTIVE`. If not:
- Check `_acme-challenge` CNAMEs in Squarespace.
- Ensure DNS still resolves to `authorize.certificatemanager.goog`.

---

### 2. DNS Resolution
Confirm `app` and `www.app` both point to LB IP:
```bash
dig +short app.underwritre.com
dig +short www.app.underwritre.com
```
Expected: `34.96.95.178`

---

### 3. HTTPS Response
Check backend + redirect:
```bash
curl -I https://app.underwritre.com/
# Expect 200 OK

curl -I "https://www.app.underwritre.com/test?x=1"
# Expect 301 Moved Permanently → Location: https://app.underwritre.com/test?x=1
```

---

### 4. Load Balancer Config
List and confirm resources are present:
```bash
gcloud compute url-maps list --global
gcloud compute target-https-proxies list
gcloud compute forwarding-rules list --global
```

---

## 🚨 Troubleshooting

- **Cert stuck in PROVISIONING**
  - Run `dig` on `_acme-challenge` records; verify they match Certificate Manager.
  - Check for CAA DNS records that may block issuance; allow `pki.goog`.

- **Wrong site served**
  - Confirm URL map has correct host rules (`app` → backend, `www.app` → redirect).

- **DNS not resolving**
  - Check Squarespace DNS editor.
  - Ensure A records for `app` and `www.app` still point to `34.96.95.178`.

---

## 🔄 Rollback Plan

If needed, revert DNS to old Cloud Run direct mapping:
- Delete A records for `app` / `www.app`.
- Add CNAMEs back:
  - `app` → `ghs.googlehosted.com`
  - `www.app` → `ghs.googlehosted.com`

This will bypass the LB and send traffic directly to Cloud Run (not recommended long-term, but safe if LB is broken).

---

## 📅 Maintenance Tips
- Certificate Manager auto-renews, but keep `_acme-challenge` CNAMEs permanently in Squarespace.
- Consider lowering DNS TTL to 300s during migrations for faster cutover.
- Document changes in Git / infra notes to avoid drift between DNS, GCP, and certs.

---

✅ With this setup, HTTPS, redirects, and certificates are handled entirely at Google’s edge. Squarespace DNS only needs to keep A records + ACME CNAMEs correct.
