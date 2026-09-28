/**
 * Google Apps Script Webhook Handler for Art Exhibition Bookmarklet
 * 
 * Instructions:
 * 1. If this script is bound directly to a Google Sheet (Extensions > Apps Script),
 *    SPREADSHEET_ID_OR_URL can be left blank ('').
 * 2. If running as a standalone script, paste your Spreadsheet ID or full Google Sheet URL below.
 */
const SPREADSHEET_ID_OR_URL = '';

/**
 * Resolves the target Google Spreadsheet instance.
 */
function resolveSpreadsheet() {
  const input = SPREADSHEET_ID_OR_URL ? SPREADSHEET_ID_OR_URL.trim() : '';

  if (!input) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      throw new Error('Spreadsheet not found. Please provide SPREADSHEET_ID_OR_URL in Code.js.');
    }
    return ss;
  }

  // Extract raw ID if a full Google Sheet URL was supplied
  const urlMatch = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const cleanId = urlMatch ? urlMatch[1] : input;

  return SpreadsheetApp.openById(cleanId);
}

/**
 * Appends an exhibition record to the primary sheet tab.
 */
function appendExhibitionRow(data) {
  const ss = resolveSpreadsheet();
  const sheet = ss.getSheets()[0];

  sheet.appendRow([
    data.title || '',
    data.venue || '',
    data.startDate || '',
    data.endDate || '',
    data.url || '',
    data.image || '',
    data.notes || data.selectedNotes || data.description || '',
    data.savedAt || new Date().toISOString()
  ]);
}

/**
 * Handles incoming POST requests containing JSON exhibition data.
 */
function doPost(e) {
  try {
    const rawContent = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const data = JSON.parse(rawContent);

    appendExhibitionRow(data);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles incoming GET requests (useful for browser-based endpoint verification).
 */
function doGet(e) {
  try {
    const testData = {
      title: (e && e.parameter && e.parameter.title) || 'Direct Browser Test Exhibition',
      venue: (e && e.parameter && e.parameter.venue) || 'Test Museum / Gallery',
      startDate: (e && e.parameter && e.parameter.startDate) || '2026-09-28',
      endDate: (e && e.parameter && e.parameter.endDate) || '2026-12-31',
      url: (e && e.parameter && e.parameter.url) || 'https://example.com',
      image: (e && e.parameter && e.parameter.image) || '',
      notes: (e && e.parameter && e.parameter.notes) || 'Added via doGet browser test',
      savedAt: new Date().toISOString()
    };

    appendExhibitionRow(testData);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', message: 'Row successfully appended via doGet' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Direct in-editor test function to satisfy OAuth permissions and verify spreadsheet binding.
 * Select 'authorizeAndTest' in the Apps Script toolbar and click 'Run'.
 */
function authorizeAndTest() {
  const ss = resolveSpreadsheet();
  const sheet = ss.getSheets()[0];
  sheet.appendRow([
    'Authorization & Verification Test',
    'Apps Script Editor',
    '',
    '',
    'https://example.com',
    '',
    'Permissions successfully verified',
    new Date().toISOString()
  ]);
  Logger.log('Success: Row added to sheet "' + sheet.getName() + '" in spreadsheet: ' + ss.getName());
}
