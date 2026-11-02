# Navy Infosys CRM — deployment package (V1.4)

A lightweight lead-management CRM for two divisions:

- **Service** — digital marketing, IT, design and other client services.
- **Academic** — Navy Infosys Academy courses and training enquiries.

Frontend: HTML/CSS/JavaScript on Cloudflare Pages. Backend: Google Apps Script web app. Database: Google Sheets.

## Package structure

```text
navy-infosys-crm/
├── index.html                    # CRM frontend
├── _headers                      # Basic browser security headers
├── _redirects                    # SPA fallback
├── functions/
│   └── api/
│       ├── crm.js                # CRM API proxy
│       └── integrations/         # Meta and generic inbound webhook endpoints
├── apps-script/
│   └── Code.gs                   # Google Apps Script backend
├── templates/
│   ├── service-leads-sample.csv
│   └── academic-leads-sample.csv
└── README.md
```

## Upgrade an existing V1.3 installation to V1.4

V1.4 adds an Admin Settings → Integrations centre, Meta Lead Ads webhooks, a generic inbound lead webhook for website forms and automation platforms, and integration delivery logs. Your existing Google Spreadsheet, login accounts, CRM leads, Cloudflare project, `GAS_URL` and `CRM_PROXY_SECRET` remain in place. The `INTEGRATION_LOGS` sheet is created automatically the first time an administrator opens the Integrations panel.

1. Replace the Cloudflare Pages project files with this V1.4 package, preserving the root structure and the new `functions/api/integrations/` folder.
2. Replace Apps Script `Code.gs` with the V1.4 version and save.
3. In Apps Script, open **Deploy → Manage deployments → Edit → New version → Deploy**. Keep the existing Web App `/exec` URL, Execute as **Me**, and access **Anyone**.
4. Redeploy Cloudflare Pages. Keep the existing `GAS_URL` and `CRM_PROXY_SECRET` values unchanged. No new Cloudflare secrets are required for this version.
5. Sign in as System Admin and open **Admin Settings → Integrations**. Configure the generic inbound webhook and/or Meta Lead Ads when ready.

Do not run `setupDatabase()` on the existing live database. The integration log sheet is created automatically and existing CRM data is preserved.

## Upgrade an existing V1.2 installation to V1.3

V1.3 preserves the existing Google Spreadsheet, Cloudflare secrets and Apps Script deployment URL. No new tabs are required. The `USERS` sheet gets a `deletedAt` column automatically the first time an employee account is deleted; fresh installations include this column from setup.

1. Replace the Cloudflare Pages project files with this V1.3 package, keeping the root structure (`index.html`, `functions/`, `templates/`, `_headers`, `_redirects`).
2. Replace the Apps Script `Code.gs` with V1.3 and save.
3. In Apps Script, open **Deploy → Manage deployments → Edit → New version → Deploy**. Keep the existing `/exec` URL.
4. Redeploy Cloudflare Pages. Keep `GAS_URL` and `CRM_PROXY_SECRET` unchanged.
5. Sign in as admin. In **Lead Management**, set filters and choose **Save current filters as shared view** to publish reusable views for all users. Test refresh, pipeline card clicks, scoring badges and employee management.

**Do not run `setupDatabase()` again** on the existing live spreadsheet. Shared lead views are stored in the existing `SETTINGS` tab. Employee deletion is a protected archive operation: it revokes sessions, hides the account from the employee list and lets the admin reassign the employee's active leads (or leave them unassigned). Historical leads, activity and audit attribution are retained. System administrator accounts cannot be paused or deleted through the CRM.

## Historical upgrade notes: V1.1 to V1.2

This release does not require new Google Sheets tabs or columns. Keep your existing spreadsheet and Cloudflare secrets.

1. Replace the repository files with the V1.2 package contents, preserving the root structure (`index.html`, `functions/`, `templates/`, `_headers`, `_redirects`).
2. In Apps Script, replace `Code.gs` with the V1.2 `apps-script/Code.gs` and save.
3. Open **Deploy → Manage deployments → Edit → New version → Deploy** for the existing Web App deployment. Keep the same `/exec` URL.
4. Redeploy Cloudflare Pages so the updated frontend and CSV templates are published. No change is needed to `GAS_URL` or `CRM_PROXY_SECRET`.
5. Sign in as admin and test import preview, one phone-only lead, one email-only lead, conversion of a lead with a pending follow-up, export filters, scoring settings and employee pause/restore access.

**Do not run `setupDatabase()` again** on the existing live spreadsheet. The V1.3 update uses the existing tabs and adds no required schema migration.

## 1. Create the Google Sheets database

1. Create a new, blank Google Spreadsheet. Name it `Navy Infosys CRM Database`.
2. Open **Extensions → Apps Script**.
3. Replace the contents of `Code.gs` with the supplied `apps-script/Code.gs` file.
4. Save the Apps Script project.
5. In the Apps Script editor, select and run `setupDatabase` once. Approve the requested Google permissions.
6. Return to the spreadsheet. It should contain the CRM tabs and headers.

`setupDatabase()` stores the spreadsheet ID in Apps Script Script Properties and creates the initial tabs, headers and default division/status/source data. Run it only against the intended CRM spreadsheet.

## 2. Set the backend shared secret

1. Generate a long random secret (at least 32 characters). Example command on macOS/Linux: `openssl rand -hex 32`.
2. In Apps Script, open **Project Settings → Script Properties → Add script property**.
3. Add:
   - Property: `CRM_PROXY_SECRET`
   - Value: your generated random secret
4. Keep this value private. Do not put it in `index.html`, GitHub, or any public file.

## 3. Create the first administrator

In `apps-script/Code.gs`, find `createInitialAdmin()` and change:

```js
const email='admin@navyinfosys.local';
const password='CHANGE_THIS_PASSWORD_NOW';
```

to your chosen administrator email and a strong new password. Save, then run `createInitialAdmin()` once from Apps Script. After the account is created, remove the plaintext password from the source (or replace it with the placeholder again) and save the project. The password is stored as a salted SHA-256 hash in the USERS sheet.

The initial administrator should then create individual employee accounts from the CRM Employees page. Do not share one login across the team.

## 4. Deploy Apps Script as a web app

1. In Apps Script select **Deploy → New deployment**.
2. Choose type **Web app**.
3. Execute as: **Me** (the spreadsheet owner).
4. Who has access: **Anyone**. This is required because Cloudflare's server-side proxy calls the web app. The endpoint rejects requests without the private shared secret.
5. Deploy and copy the Web app URL ending in `/exec`.
6. If you change backend code later, create a new version via **Deploy → Manage deployments → Edit → New version → Deploy**.

Do not paste the Apps Script URL into frontend code. It belongs in a Cloudflare environment variable only.

## 5. Deploy to Cloudflare Pages

### Option A — GitHub deployment (recommended)

1. Create a private GitHub repository, for example `navy-infosys-crm`.
2. Upload the contents of this package to the repository root. The `index.html`, `functions/`, `templates/`, `_headers` and `_redirects` paths must remain at the root level.
3. In Cloudflare Dashboard open **Workers & Pages → Create → Pages → Connect to Git**.
4. Select the repository.
5. Framework preset: **None**.
6. Build command: leave blank (or use no build command).
7. Build output directory: `/` (repository root).
8. Deploy.

### Option B — Direct upload

Cloudflare Pages Direct Upload is suitable for static assets, but Pages Functions require a deployment path that includes the `functions/` directory. Use Git integration or Wrangler for this package so the API proxy function is deployed. Uploading only `index.html` will not deploy the backend proxy.

### Add environment variables / secrets

In your Cloudflare Pages project, open **Settings → Variables and Secrets** and add these as **encrypted secrets**, not public text variables:

| Name | Value |
|---|---|
| `GAS_URL` | Your Apps Script `/exec` Web App URL |
| `CRM_PROXY_SECRET` | The exact same secret configured in Apps Script |

Save and trigger a new deployment so the Pages Function receives the variables.

The browser calls `/api/crm`; Cloudflare's Pages Function forwards the request to Apps Script and adds the shared secret server-side.

## Admin password recovery

The `USERS` sheet intentionally stores salted password hashes, not readable passwords. An administrator can open **Employees → Reset password**, set a new password of at least 8 characters, and provide it securely to the employee. The new password itself is never written to Google Sheets or the audit log. This is safer than keeping every employee password in plain text.

## Browser draft protection and network feedback

The frontend keeps unsent lead-form drafts and interaction-remark drafts in that user's browser storage. If connectivity drops or the tab reloads, opening the form again offers to restore the draft. A top progress line and button-level saving states indicate network activity, and success/error toasts confirm the outcome. Drafts remain local until the user successfully saves; they are not a replacement for server-side records or backups. If an action fails because the connection drops, reconnect and retry it. Do not clear browser site data while you have unsent drafts.

## 6. First login and employee setup

1. Open your Cloudflare Pages URL.
2. Sign in with the initial admin email/password.
3. Open **Employees → Add employee**.
4. Create separate accounts for each team member.
5. Choose division access (`service`, `academic`, or both).
6. Grant `View all division leads` and `Take over leads` only to staff who need them.

Employees can add/import leads without assigning them. Unassigned leads remain visible in the division. Lead ownership can be changed with **Take over** (where permitted); the assignment history is retained.

## 7. Google Sheets tabs

The backend creates these tabs:

- `LEADS` — canonical lead records, one row per lead.
- `USERS` — user accounts, salted password hashes, roles and permissions.
- `ACTIVITIES` — timestamped remarks, calls, stage changes and actions.
- `FOLLOWUPS` — follow-up schedule and completion records.
- `ASSIGNMENT_HISTORY` — previous and new owner, actor, reason and timestamp.
- `SETTINGS` — general key/value settings.
- `CUSTOM_FIELDS` — additional field definitions.
- `FIELD_CONFIG` — core form field configuration (required/visible/section/order/type).
- `CUSTOM_FIELD_VALUES` — reserved normalized custom-field values.
- `IMPORT_LOGS` — bulk import summary.
- `AUDIT_LOGS` — login, import, export and administrative changes.
- `SESSIONS` — active login sessions (token hashes only).
- `DIVISIONS`, `SOURCES`, `STATUSES`, `LOST_REASONS` — configurable reference lists.

Do not rename tabs or change the header row without updating the Apps Script schema. Never sort only one column; sort the entire sheet range. The CRM uses stable IDs rather than row numbers.

### Configure required/optional core fields

Open `FIELD_CONFIG`. Each row controls a form field:

- `fieldKey`: stable key (`name`, `contact`, `email`, `interestedIn`, `source`, `priority`, `assignedTo`, `nextFollowupAt`, `remarks`). Do not rename the key.
- `division`: `both`, `service`, or `academic`.
- `required`: TRUE/FALSE.
- `visible`: TRUE/FALSE.
- `section`: `essential` or `additional`.
- `sortOrder`: display order.

The initial form applies required/optional settings to the core identity fields. For any changed field configuration, refresh the CRM. For manual single-lead creation, the configured required fields continue to apply. Bulk import intentionally uses a more flexible rule: at least one of name, contact or email is required, regardless of the manual-entry required-field configuration.

### Configure stages, sources and lost reasons

Edit the relevant reference tab:

- `STATUSES`: `statusId`, `name`, `division`, `sortOrder`, `active`, `isFinal`.
- `SOURCES`: `sourceId`, `name`, `division`, `active`.
- `LOST_REASONS`: `reasonId`, `name`, `division`, `active`.

Keep IDs stable. Use TRUE/FALSE for active flags. Stage drag-and-drop saves the selected `statusId` and adds an activity record.

### Permissions

The `USERS.permissionsJson` field accepts JSON such as:

```json
{"viewAllLeads":true,"takeover":true,"editUnassigned":true}
```

- `viewAllLeads`: can see all leads in the employee's permitted division(s).
- `takeover`: can take ownership of another employee's lead.
- `editUnassigned`: can edit unassigned leads.

Role `admin` has full access. Role `manager` can use management features and bulk assignment. Employees are limited by division access and their permissions. A view-all permission does not itself grant edit rights to another person's lead; they must take it over first.

## 8. CSV imports and exports

Use the sample files under `templates/`:

- `service-leads-sample.csv`
- `academic-leads-sample.csv`

The import parser supports quoted CSV values and commas inside quoted cells. Uploads are processed in batches of up to 500 rows. A row is accepted when at least one of name, phone number or email is present. Other fields (including interested program, source, priority and remarks) may be blank. The preview checks duplicates against the full CRM database and displays row-level issues before confirmation. Editable preview fields include name, phone, email, interested program, source, priority and remarks. Duplicate contacts/emails and rows with no identifier are skipped. Assignment is optional. The import action is available to employees as well as admins/managers, subject to their division access. Employees see the bulk-import area but not the admin export controls. Download the matching sample CSV from the import screen or from `templates/` before preparing a list. The backend now writes imported leads and their activity records in batches rather than one spreadsheet write per row.

Exports are generated as CSV and can be opened in Excel or Google Sheets. The admin/manager export screen supports filters for division, stage, owner/unassigned, source, priority, follow-up state, lost reason, created-date range and search text, plus a selectable set of output columns. Export access is enforced by the backend for managers/admins.

## 9. Daily backup and portability

The Google Spreadsheet is the operational source of truth. Recommended safeguards:

1. Keep the spreadsheet in a company-owned Google Workspace account where possible.
2. Give at least two trusted administrators appropriate ownership/backup access.
3. Enable Drive version history and periodically make a separate copy of the spreadsheet.
4. Export the full spreadsheet to `.xlsx` on a regular schedule and store a copy outside the primary account.
5. Never delete `LEADS`, `ACTIVITIES`, `FOLLOWUPS`, `USERS`, or ID columns.

If the frontend is unavailable, staff with spreadsheet access can continue working directly in Google Sheets. Keep the headers and IDs intact so the CRM can be reconnected later.

## Lead scoring and decision support (introduced in V1.2; enhanced in V1.3)

The CRM calculates an explainable 0–100 prioritisation score using available signals: phone number, email, recorded interest, source, priority, scheduled follow-up and recent activity. Each lead shows the score band and the point reasons. Administrators can open **Admin Settings → Lead scoring** to enable/disable scoring, adjust individual weights and change Hot/Warm thresholds. The Reports page includes a Decision Center with practical prompts such as unassigned hot leads, overdue follow-ups and active leads without a next action.

These scores are not statistically calibrated conversion probabilities. Treat them as a prioritisation aid until the CRM has enough reliable historical conversion outcomes to validate and calibrate a predictive model.

## V1.3 usability and administration additions

- **Shared lead views:** Admins can save, update and delete up to 30 shared filter views from Lead Management. Saved filters include division, specific program/service, stage, owner, source, priority, lead-score band and follow-up state. Shared views are visible to all users, but the lead list remains restricted by each user's existing division and lead permissions.
- **Program filtering:** Lead Management and each division workspace can filter to a specific interested program/service. The main lead view also includes owner, source, priority, score, follow-up, lost-reason and created-date filters.
- **Pipeline interactions:** Clicking anywhere on a pipeline card opens the lead. The card and name show pointer/hover feedback, and every card displays its lead score and score band.
- **Global refresh:** The top header has a Refresh data action on every page. It reloads the latest leads, users, stages, sources, scoring rules and shared views without a full browser reload.
- **Employee lifecycle:** System administrator accounts are protected from pause and deletion. Admins can pause/restore employee or manager accounts. Delete employee archives the account, revokes active sessions and reassigns owned leads to a selected active employee or leaves them unassigned. Historical activity and audit records are preserved.

## 10. Important V1.3 scope and limitations

This is a self-hosted CRM package, not a hosted/managed service. You must deploy it into your own Cloudflare and Google accounts and test it with sample data before using live customer records.

Included in V1.3: login, division-aware leads, flexible CSV import for employees and admins/managers, downloadable sample CSVs containing phone-only/email-only/name-only examples, server-checked row preview with editable values, duplicate checking, stage changes and drag/drop pipeline, timestamped interaction remarks, follow-ups, employee roles, admin password reset and pause/restore access for non-admin accounts, protected system administrator accounts, employee account archive/delete with lead reassignment, lead takeover, bulk assignment for managers/admins, configurable lead scoring, score badges in table and pipeline views, rule-based decision prompts, program/stage/owner/source/priority/score/follow-up/lost-reason/created-date filters, admin-created shared filter views, filtered CSV export and Google Sheets persistence. Lead details render immediately from the browser lead list while full interaction history loads. Stage changes update optimistically. Converted and lost leads automatically have pending follow-ups cancelled and their next-follow-up date cleared. On the first login after the V1.2 backend deployment, the backend also performs a one-time cleanup of older converted/lost leads so their stale pending follow-ups stop appearing. Browser-local drafts protect unsent lead forms, remarks and import data; reconnect and retry failed actions to sync them to Google Sheets.

Current V1 simplifications:

- Admin Settings includes visual controls for core field required/visibility settings, creating additional custom fields, and adding/editing stages, sources and lost reasons. Advanced field ordering and per-user permission editing can still be performed directly in the documented Google Sheets tabs.
- Excel `.xlsx` import is not included; use CSV. Export is CSV.
- No WhatsApp API, email automation, payment collection, receipt upload, invoicing, project management or automatic lead nurturing.
- Daily backup scheduling must be configured in Apps Script/Drive; the package documents the backup process but does not silently create a backup schedule.
- Apps Script and Google Sheets have quotas and network latency. Browser-side rendering, optimistic stage changes and short-lived sheet-read caching reduce perceived and repeated-read latency, but no Apps Script + Google Sheets system can guarantee that every server write or detail-history request completes within one second on every connection. This architecture is appropriate for a modest internal team and moderate lead volume, not a high-volume multi-tenant CRM.

## 11. Pre-launch test checklist

- [ ] Admin login works; invalid password is rejected.
- [ ] Employee can only access permitted divisions.
- [ ] Employee sees assigned/unassigned leads according to permissions.
- [ ] Employee with view-all can view but cannot edit another employee's lead before takeover.
- [ ] Takeover changes owner and adds assignment history.
- [ ] Single lead save and duplicate warning work.
- [ ] CSV import correctly counts new, duplicate and invalid rows.
- [ ] Dragging a lead to a new stage persists after refresh.
- [ ] Lost stage requires a lost reason.
- [ ] Remarks show timestamp and employee name.
- [ ] Follow-ups appear on the dashboard and can be completed.
- [ ] Bulk assignment changes ownership and records history.
- [ ] Export respects selected division/stage/program/score/columns and user access.
- [ ] Admin can create, update and delete shared lead views; employees can use them without bypassing their lead permissions.
- [ ] Program filter returns the expected program-specific leads in table and pipeline layouts.
- [ ] Clicking any part of a pipeline card opens the correct lead, and score badges match the table view.
- [ ] Header refresh updates leads, users, stages and shared views without a page reload.
- [ ] System administrator accounts cannot be paused or deleted.
- [ ] Deleting a test employee revokes their sessions and correctly reassigns or unassigns their leads.
- [ ] A spreadsheet copy can be opened independently.

For safety, start with test records and test employee accounts. Do not import sensitive personal information until permissions and backup restoration have been verified.


## Updating an existing V1 installation to V1.3

1. Replace the Cloudflare Pages project files with this updated package and redeploy, keeping the `functions/` folder and `templates/` folder in the deployment. Keep the existing `GAS_URL` and `CRM_PROXY_SECRET` encrypted environment secrets.
2. In the existing Apps Script project, replace `Code.gs` with the updated `apps-script/Code.gs`. Save, then open **Deploy → Manage deployments → Edit → New version → Deploy** for the existing web app deployment. Keep the same deployment URL so Cloudflare's `GAS_URL` does not need to change.
3. No new tabs are required; do not rerun `setupDatabase()` on a live database. V1.3 appends a `deletedAt` header to the existing `USERS` sheet automatically the first time an employee is deleted. Shared views are stored in the existing `SETTINGS` sheet.
4. Sign in as admin, reset a test employee password, verify employee login, test a saved shared view and program filter, refresh from the header, click a pipeline card, and delete a test employee with lead reassignment. Test employee bulk CSV import and filtered export using sample data before returning to normal use.


## Integrations (v1.4)

The Admin Panel now includes **Admin Settings → Integrations**.

### Meta Facebook & Instagram Lead Ads

The Meta Lead Ads receiver is implemented using a Cloudflare Pages Function and the existing Apps Script backend. New `leadgen` webhook events are verified with Meta's `X-Hub-Signature-256` HMAC signature, the lead details are retrieved through the Meta Graph API, and the lead is inserted into Google Sheets. Successful Meta lead IDs are checked to prevent duplicate imports. The CRM records success, duplicate, and failure events in `INTEGRATION_LOGS`.

1. Deploy this v1.4 project to Cloudflare Pages. Keep the existing `GAS_URL` and `CRM_PROXY_SECRET` secrets configured.
2. Update the Apps Script project with `apps-script/Code.gs`, save, and deploy a **new version** of the existing Web App deployment. Keep Execute as **Me** and access **Anyone**. Do not change the existing spreadsheet ID or proxy secret.
3. Sign in as System Admin and open **Admin Settings → Integrations → Meta Lead Ads**.
4. Create a Meta app in Meta for Developers and add the Webhooks product. Generate a Page access token for the Facebook Page used by your Lead Ads. The app must have the permissions required for lead retrieval and Page webhook subscription. Meta may require App Review, Advanced Access and business verification before production access is granted.
5. Enter the Meta App ID, App Secret, Facebook Page ID, Page Access Token and a long random Verify Token in the CRM. Select the default division, program/service, priority and optional owner. Save, then use **Test connection**.
6. In Meta Developers → Webhooks, choose the **Page** object, enter the callback URL shown in the CRM and the same Verify Token, then verify and subscribe to the `leadgen` field. Ensure the app is also subscribed to the relevant Page for leadgen events.
7. For different forms, add one mapping per line in the CRM: `FORM_ID | service-or-academic | program/service | employee_user_id`. The employee ID is optional. Use the CRM employee ID shown in the Employees screen / user record. Unmapped forms use the defaults.
8. Submit a test lead through a Meta test form and check the Integration Activity log and CRM leads list.

**Credential handling:** Meta App Secret, Page Access Token and Verify Token are saved in Google Apps Script Script Properties, not in the browser after submission and not in Google Sheets. The Apps Script proxy secret remains required. Do not paste these secrets into source files or public repositories.

### Generic inbound lead webhook

The generic endpoint supports website forms and automation services such as Make, Zapier and n8n. Google Forms can also send responses using an Apps Script trigger or an automation connector.

1. In **Admin Settings → Integrations → Generic inbound webhook**, set a secret of at least 24 characters and choose the default division, program/service, source and optional owner.
2. Send an HTTPS `POST` to the endpoint shown in the CRM (`/api/integrations/inbound`). Set `Content-Type: application/json` and `Authorization: Bearer YOUR_WEBHOOK_SECRET`. Send an `Idempotency-Key` header where the source supports it.
3. Example JSON:

```json
{
  "name": "Example Lead",
  "phone": "+9779800000000",
  "email": "lead@example.com",
  "division": "academic",
  "program": "Digital Marketing",
  "source": "website",
  "remarks": "Submitted from the website contact form"
}
```

At least one of `name`, `phone` or `email` is required. Optional fields include `division` (`service` or `academic`), `program` / `interestedIn`, `source`, `priority`, `assignedTo`, and `remarks` / `message`. A matching phone or email already in the CRM is logged as a duplicate instead of creating another lead. Keep the webhook secret private and rotate it from the Admin Panel if it is exposed.

### Integration catalogue

The hub lists the integration categories and their implementation status. Meta Lead Ads and the generic inbound webhook are active in v1.4. Google Forms, WhatsApp Business messaging, email/SMS delivery and Google Calendar are catalogue/planned items, not yet active connectors. Make, Zapier and n8n can already send leads through the generic inbound webhook; they do not need separate CRM adapters for basic lead capture.

### Meta technical notes

The implementation currently targets Graph API `v26.0`. Meta can change API versions, permission requirements and App Review requirements; check the current Meta documentation when configuring the app. Official references: [Meta Webhooks](https://developers.facebook.com/docs/graph-api/webhooks/), [Meta Lead Ads retrieval](https://developers.facebook.com/docs/marketing-api/guides/lead-ads/retrieving/), and [Meta permissions reference](https://developers.facebook.com/docs/permissions/).
