# Cloud Share Gym System

This is a separate gym web app with its own Google Apps Script backend and its own Google Sheet.

## Features

- Member registration
- Admin approval before member access
- Member dashboard with:
  - BMI
  - Calories burned today
  - QR code for gym entry
  - Workout activity logging
  - One-day local device dashboard cache
- Admin dashboard with:
  - Pending approvals
  - QR attendance scanner
  - Today's attendance list
  - Search by member name or phone
  - Membership expiry alerts

## Folder Structure

```text
gym-system/
├── index.html
├── register.html
├── member.html
├── admin.html
├── style.css
├── config.js
├── api.js
├── auth.js
├── common.js
├── register.js
├── member.js
├── admin.js
├── vendor/
│   └── zxing-browser.min.js
└── google-apps-script/
    ├── Code.gs
    └── appsscript.json
```

## Google Sheet Setup

Create one new Google Sheet for this gym system.

Then in Apps Script:

1. Create a new Apps Script project.
2. Paste `google-apps-script/Code.gs`.
3. Paste `google-apps-script/appsscript.json`.
4. Replace `PASTE_GYM_SHEET_ID_HERE` in `Code.gs` with your new gym Google Sheet ID.
5. Run `setupGymManagementSystem()`.
6. Authorize the script.
7. Deploy as Web App:
   - Execute as: Me
   - Who has access: Anyone

## Frontend Setup

In `config.js`, replace:

```js
API_URL: 'PASTE_GYM_APPS_SCRIPT_WEB_APP_URL_HERE'
```

with your deployed Apps Script web app URL.

## Default Admin Login

- Username: `admin`
- Password: `admin123`

Change this directly in the `Admins` sheet after setup if you want.

## Member Login

After approval:

- Identifier: member phone number
- Password: member NRC

Member sessions are remembered on the same device until logout.
Member dashboard data is cached locally for 1 day on that device.

## Important Notes

- QR attendance scanning works best on HTTPS hosting.
- Member expiry notifications are shown inside the dashboards for both admin and member.
- Activities are seeded automatically when you run setup.
