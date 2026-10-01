const { describe, it } = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');
const { extractExhibitionMetadata } = require('../bookmarklet/src/save-exhibition.js');

function createDoc(html, url = 'https://gallery.org/exhibitions/future-past') {
  const dom = new JSDOM(html, { url });
  return { document: dom.window.document, window: dom.window };
}

describe('Microdata, HTML Meta, and Class Extraction', () => {
  it('should extract dates from itemprop meta tags', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Future Past Exhibition</title>
        <meta itemprop="startDate" content="2026-10-15">
        <meta itemprop="endDate" content="2026-12-30">
      </head>
      <body></body>
      </html>
    `;
    const { document, window } = createDoc(html);
    const data = extractExhibitionMetadata(document, window);

    assert.strictEqual(data.startDate, '2026-10-15');
    assert.strictEqual(data.endDate, '2026-12-30');
  });

  it('should extract dates from microdata time tags with datetime attributes', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>Time Element Show</title></head>
      <body>
        <div itemscope itemtype="http://schema.org/ExhibitionEvent">
          <h1 itemprop="name">Time Element Show</h1>
          <p>
            <time itemprop="startDate" datetime="2026-11-01">Nov 1</time> –
            <time itemprop="endDate" datetime="2027-01-31">Jan 31</time>
          </p>
        </div>
      </body>
      </html>
    `;
    const { document, window } = createDoc(html);
    const data = extractExhibitionMetadata(document, window);

    assert.strictEqual(data.startDate, '2026-11-01');
    assert.strictEqual(data.endDate, '2027-01-31');
  });

  it('should extract dates from Open Graph and Event meta properties', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta property="og:title" content="Meta Property Show">
        <meta property="event:start_time" content="2026-10-01T18:00:00Z">
        <meta property="event:end_time" content="2026-11-15T21:00:00Z">
      </head>
      <body></body>
      </html>
    `;
    const { document, window } = createDoc(html);
    const data = extractExhibitionMetadata(document, window);

    assert.strictEqual(data.startDate, '2026-10-01');
    assert.strictEqual(data.endDate, '2026-11-15');
  });

  it('should extract dates from microformats .dtstart and .dtend', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>Microformat Show</title></head>
      <body>
        <div class="vevent">
          <span class="dtstart">October 1, 2026</span>
          <span class="dtend">January 15, 2027</span>
        </div>
      </body>
      </html>
    `;
    const { document, window } = createDoc(html);
    const data = extractExhibitionMetadata(document, window);

    assert.strictEqual(data.startDate, '2026-10-01');
    assert.strictEqual(data.endDate, '2027-01-15');
  });

  it('should extract dates from date container classes', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>Class Container Show</title></head>
      <body>
        <div class="exhibition-header">
          <h1>Class Container Show</h1>
          <div class="exhibition-dates">October 1 – November 30, 2026</div>
        </div>
      </body>
      </html>
    `;
    const { document, window } = createDoc(html);
    const data = extractExhibitionMetadata(document, window);

    assert.strictEqual(data.startDate, '2026-10-01');
    assert.strictEqual(data.endDate, '2026-11-30');
  });

  it('should extract dates from page body paragraphs when no structured tags exist', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Minimalist Gallery</title>
      </head>
      <body>
        <h1>New Perspectives</h1>
        <p class="subtitle">On view: October 1, 2026 – January 15, 2027</p>
        <p>Curated by Jane Doe.</p>
      </body>
      </html>
    `;
    const { document, window } = createDoc(html);
    const data = extractExhibitionMetadata(document, window);

    assert.strictEqual(data.title, 'Minimalist Gallery');
    assert.strictEqual(data.startDate, '2026-10-01');
    assert.strictEqual(data.endDate, '2027-01-15');
  });

  it('should extract dates from user selection when highlighted text contains date range', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Selection Test</title>
      </head>
      <body>
        <h1>Exhibition Title</h1>
        <p>Some text</p>
      </body>
      </html>
    `;
    const { document, window } = createDoc(html);
    // Mock user selection
    window.getSelection = () => ({
      toString: () => 'Featured artworks on display from October 1 to November 30, 2026'
    });
    const data = extractExhibitionMetadata(document, window);

    assert.strictEqual(data.startDate, '2026-10-01');
    assert.strictEqual(data.endDate, '2026-11-30');
  });
});
