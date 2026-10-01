const { describe, it } = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');
const { extractExhibitionMetadata } = require('../bookmarklet/src/save-exhibition.js');

function createDoc(html, url = 'https://example-gallery.com/exhibition-1') {
  const dom = new JSDOM(html, { url });
  return { document: dom.window.document, window: dom.window };
}

describe('JSON-LD Extraction', () => {
  it('should extract dates from standard Event JSON-LD', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sculpture in Space</title>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Event",
          "name": "Sculpture in Space",
          "startDate": "2026-10-01",
          "endDate": "2027-01-15",
          "location": {
            "@type": "Place",
            "name": "Modern Art Museum"
          }
        }
        </script>
      </head>
      <body></body>
      </html>
    `;
    const { document, window } = createDoc(html);
    const data = extractExhibitionMetadata(document, window);

    assert.strictEqual(data.title, 'Sculpture in Space');
    assert.strictEqual(data.venue, 'Modern Art Museum');
    assert.strictEqual(data.startDate, '2026-10-01');
    assert.strictEqual(data.endDate, '2027-01-15');
  });

  it('should extract dates from JSON-LD using @graph structure (WordPress / Yoast / Schema Pro)', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://example-gallery.com/#website",
              "name": "Example Gallery"
            },
            {
              "@type": "WebPage",
              "@id": "https://example-gallery.com/shows/sol-lewitt",
              "name": "Sol LeWitt: Wall Drawings"
            },
            {
              "@type": "ExhibitionEvent",
              "name": "Sol LeWitt: Wall Drawings",
              "startDate": "2026-11-05T10:00:00Z",
              "endDate": "2027-02-28T18:00:00Z",
              "location": {
                "@type": "Place",
                "name": "Downtown Gallery"
              }
            }
          ]
        }
        </script>
      </head>
      <body></body>
      </html>
    `;
    const { document, window } = createDoc(html);
    const data = extractExhibitionMetadata(document, window);

    assert.strictEqual(data.title, 'Sol LeWitt: Wall Drawings');
    assert.strictEqual(data.venue, 'Downtown Gallery');
    assert.strictEqual(data.startDate, '2026-11-05');
    assert.strictEqual(data.endDate, '2027-02-28');
  });

  it('should extract dates when @type is an array', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": ["Event", "ExhibitionEvent"],
          "name": "Abstract Futures",
          "startDate": "2026-10-12",
          "endDate": "2026-12-20"
        }
        </script>
      </head>
      <body></body>
      </html>
    `;
    const { document, window } = createDoc(html);
    const data = extractExhibitionMetadata(document, window);

    assert.strictEqual(data.title, 'Abstract Futures');
    assert.strictEqual(data.startDate, '2026-10-12');
    assert.strictEqual(data.endDate, '2026-12-20');
  });

  it('should extract dates from temporalCoverage in JSON-LD', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "VisualArtwork",
          "name": "Retrospective 2026",
          "temporalCoverage": "2026-10-01/2027-01-15"
        }
        </script>
      </head>
      <body></body>
      </html>
    `;
    const { document, window } = createDoc(html);
    const data = extractExhibitionMetadata(document, window);

    assert.strictEqual(data.title, 'Retrospective 2026');
    assert.strictEqual(data.startDate, '2026-10-01');
    assert.strictEqual(data.endDate, '2027-01-15');
  });

  it('should extract dates from nested events in Organization or Place', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Museum",
          "name": "Metropolitan Arts Center",
          "events": [
            {
              "@type": "Event",
              "name": "Summer Salon",
              "startDate": "2026-06-01",
              "endDate": "2026-08-31"
            }
          ]
        }
        </script>
      </head>
      <body></body>
      </html>
    `;
    const { document, window } = createDoc(html);
    const data = extractExhibitionMetadata(document, window);

    assert.strictEqual(data.startDate, '2026-06-01');
    assert.strictEqual(data.endDate, '2026-08-31');
  });

  it('should handle unparseable JSON-LD gracefully and fallback', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fallback Title</title>
        <meta property="og:title" content="Fallback Title">
        <meta property="event:start_time" content="2026-10-01">
        <meta property="event:end_time" content="2026-11-01">
        <script type="application/ld+json">
        { INVALID JSON BAD SYNTAX
        </script>
      </head>
      <body></body>
      </html>
    `;
    const { document, window } = createDoc(html);
    const data = extractExhibitionMetadata(document, window);

    assert.strictEqual(data.title, 'Fallback Title');
    assert.strictEqual(data.startDate, '2026-10-01');
    assert.strictEqual(data.endDate, '2026-11-01');
  });
});
