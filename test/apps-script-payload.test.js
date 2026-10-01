const { describe, it } = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');
const { extractExhibitionMetadata } = require('../bookmarklet/src/save-exhibition.js');

describe('Apps Script Webhook Payload Schema', () => {
  it('should generate all required fields expected by Google Apps Script appendExhibitionRow', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Exhibition</title>
        <meta property="og:title" content="Impressionist Masterpieces">
        <meta property="og:site_name" content="City Art Museum">
        <meta property="og:image" content="https://example.com/banner.jpg">
        <meta property="og:description" content="A collection of 19th-century works.">
        <meta property="event:start_time" content="2026-10-01">
        <meta property="event:end_time" content="2027-01-15">
      </head>
      <body></body>
      </html>
    `;
    const dom = new JSDOM(html, { url: 'https://example.com/exhibitions/impressionism' });
    const payload = extractExhibitionMetadata(dom.window.document, dom.window);

    // Apps Script expects: title, venue, startDate, endDate, url, image, notes, savedAt
    assert.strictEqual(payload.title, 'Impressionist Masterpieces');
    assert.strictEqual(payload.venue, 'City Art Museum');
    assert.strictEqual(payload.startDate, '2026-10-01');
    assert.strictEqual(payload.endDate, '2027-01-15');
    assert.strictEqual(payload.url, 'https://example.com/exhibitions/impressionism');
    assert.strictEqual(payload.image, 'https://example.com/banner.jpg');
    assert.strictEqual(payload.notes, 'A collection of 19th-century works.');
    assert.ok(payload.savedAt, 'savedAt should be populated');
    assert.ok(!isNaN(Date.parse(payload.savedAt)), 'savedAt should be valid ISO date string');
  });
});
