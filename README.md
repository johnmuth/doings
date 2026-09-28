# Exhibition Saver Bookmarklet & Google Sheets Pipeline

Capture art exhibition metadata from web pages and store records in a private Google Sheet.

---

### Project Structure

```text
doings/
├── apps-script/
│   ├── Code.js                  # Google Apps Script webhook handler (doPost, doGet, sheet appends)
│   ├── appsscript.json          # Script manifest (V8 runtime & anonymous access settings)
│   └── .clasp.json.example      # Configuration template for @google/clasp CLI
│
├── bookmarklet/
│   ├── src/
│   │   └── save-exhibition.js   # Human-readable ES6 extraction logic (JSON-LD, Open Graph, meta tags)
│   └── dist/
│       └── bookmarklet.min.js   # Compiled single-line `javascript:...` bookmarklet URL
│
├── scripts/
│   ├── build-bookmarklet.sh     # Minification script to compile src/ into dist/
│   └── test-endpoint.sh         # Parameterized curl verification script
│
├── .gitignore                   # Ignores credentials, node modules, and system files
└── README.md                    # Setup guide, schema definition, and runbook
```

---

### Google Sheet Schema

Create a new Google Sheet (e.g. named `Exhibitions`) and populate row 1 with the following column headers:

| Column A | Column B | Column C | Column D | Column E | Column F | Column G | Column H |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Title** | **Venue** | **Start Date** | **End Date** | **URL** | **Image URL** | **Notes** | **Saved At** |

---

### Step-by-Step Setup Guide

#### 1. Configure Google Apps Script

1. Open your Google Sheet and navigate to **Extensions > Apps Script**.
2. Replace all existing code in `Code.gs` with the content of [`apps-script/Code.js`](apps-script/Code.js).
3. If this script is bound directly to the sheet (opened via Extensions menu), leave `SPREADSHEET_ID_OR_URL` empty (`''`). If standalone, paste your spreadsheet ID.
4. Click **Save** (floppy disk icon).

#### 2. Authorize Permissions (One-Time Step)

1. In the Apps Script toolbar at the top (next to "Debug"), select the **`authorizeAndTest`** function from the dropdown.
2. Click **Run**.
3. When prompted with **"Authorization required"**:
   - Click **Review permissions** and select your Google account.
   - Click **Advanced** (bottom left).
   - Click **Go to Untitled project (unsafe)** (or your project name).
   - Click **Allow**.
4. A test row will appear in your Google Sheet immediately.

#### 3. Deploy as a Public Web App

1. Click **Deploy > New deployment** (or **Manage deployments** > edit with pencil icon).
2. Click the gear icon and select **Web app**.
3. Configure the settings:
   - **Description**: `Exhibition Webhook v1`
   - **Execute as**: `Me (your email)`
   - **Who has access**: `Anyone` *(Crucial: Do NOT select "Only myself" or "Anyone with a Google account")*
4. Click **Deploy**.
5. Copy your **Web app URL** ending in `/exec` (e.g., `https://script.google.com/macros/s/AKfycb.../exec`).

---

### Build & Install the Bookmarklet

#### Build with Your Webhook URL
Run the build script, passing your deployed Web App URL as an argument:

```bash
./scripts/build-bookmarklet.sh "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
```

The script will generate the minified `javascript:...` link in `bookmarklet/dist/bookmarklet.min.js` and print it to your terminal.

#### Install on Desktop (Chrome / Safari / Firefox / Edge)
1. In your browser, create a new bookmark or open the Bookmark Manager.
2. Set the bookmark name to `Save Exhibition`.
3. Paste the `javascript:...` string into the **URL / Location** field.
4. Drag it to your bookmarks bar for 1-click access.

#### Install on Mobile (iOS Safari / Android Chrome)
Since browser bookmarks sync automatically via your cloud account (iCloud Safari or Chrome Sync):
1. The `Save Exhibition` bookmark created on desktop will appear on your mobile device.
2. **To save while browsing on mobile**: Tap the browser address bar, type `Save Exhibition`, and tap the bookmark autocomplete result.
3. **Optional Selection**: If you highlight specific text on the page before clicking the bookmarklet, that text will be captured in your **Notes** column.

---

### Verification & Testing

#### Direct Terminal Test via `test-endpoint.sh`

Run the included verification script to confirm your endpoint is live without opening a browser:

```bash
./scripts/test-endpoint.sh "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
```

Expected output:
```json
{"status":"success"}
```

#### Direct Browser Test
Paste your `/exec` URL directly into your browser address bar. It will trigger `doGet` and return:
```json
{"status":"success","message":"Row successfully appended via doGet"}
```

---

### Troubleshooting & Key Failure Modes

- **Script hangs with `curl`**:
  Do NOT use `-X POST` with `curl -L`. Google Apps Script responds to POST requests with a 302 redirect to a GET-only echo server (`script.googleusercontent.com`). Using `curl -L -d '...' <URL>` without `-X POST` allows `curl` to switch methods properly upon redirect.
- **Bookmarklet says "saved" but sheet is empty**:
  Verify in **Deploy > Manage deployments** that **Who has access** is set to **Anyone**. If set to "Only myself", Google redirects incoming requests to a login prompt.
- **Changes in `Code.js` not taking effect**:
  Google Apps Script does not update live web app endpoints when code is saved. You must go to **Deploy > Manage deployments**, click **Edit (pencil icon)**, select **Version: New version**, and click **Deploy**.
