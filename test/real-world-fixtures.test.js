const { describe, it } = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');
const { extractExhibitionMetadata } = require('../bookmarklet/src/save-exhibition.js');

function createDoc(html, url = 'https://example-museum.org/exhibitions/great-wave') {
  const dom = new JSDOM(html, { url });
  return { document: dom.window.document, window: dom.window };
}

describe('Real-World Exhibition Fixtures', () => {
  it('should extract metadata from MoMA-style exhibition page', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Georgia O'Keeffe: To See Takes Time | MoMA</title>
        <meta property="og:title" content="Georgia O'Keeffe: To See Takes Time">
        <meta property="og:site_name" content="The Museum of Modern Art">
        <meta property="og:description" content="Explore drawings and watercolors by Georgia O'Keeffe.">
        <meta property="og:image" content="https://www.moma.org/media/okeeffe.jpg">
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "ExhibitionEvent",
          "name": "Georgia O'Keeffe: To See Takes Time",
          "startDate": "2026-10-09",
          "endDate": "2027-01-24",
          "location": {
            "@type": "Place",
            "name": "The Museum of Modern Art",
            "address": "11 W 53rd St, New York, NY"
          },
          "image": "https://www.moma.org/media/okeeffe.jpg",
          "description": "Explore drawings and watercolors by Georgia O'Keeffe."
        }
        </script>
      </head>
      <body>
        <main>
          <h1>Georgia O'Keeffe: To See Takes Time</h1>
          <p class="dates">Oct 9, 2026 – Jan 24, 2027</p>
        </main>
      </body>
      </html>
    `;
    const { document, window } = createDoc(html, 'https://www.moma.org/calendar/exhibitions/5555');
    const data = extractExhibitionMetadata(document, window);

    assert.strictEqual(data.title, "Georgia O'Keeffe: To See Takes Time");
    assert.strictEqual(data.venue, "The Museum of Modern Art");
    assert.strictEqual(data.startDate, '2026-10-09');
    assert.strictEqual(data.endDate, '2027-01-24');
    assert.strictEqual(data.image, 'https://www.moma.org/media/okeeffe.jpg');
    assert.strictEqual(data.url, 'https://www.moma.org/calendar/exhibitions/5555');
  });

  it('should extract metadata from Tate-style exhibition page with ISO dates in schema graph', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Hilma af Klint & Piet Mondrian | Tate Modern</title>
        <meta property="og:site_name" content="Tate">
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "VisualArtwork",
              "name": "Hilma af Klint"
            },
            {
              "@type": "Event",
              "name": "Hilma af Klint & Piet Mondrian",
              "startDate": "2026-10-20T10:00:00+01:00",
              "endDate": "2027-03-03T18:00:00+01:00",
              "location": {
                "@type": "Place",
                "name": "Tate Modern"
              }
            }
          ]
        }
        </script>
      </head>
      <body>
        <h1>Hilma af Klint & Piet Mondrian</h1>
      </body>
      </html>
    `;
    const { document, window } = createDoc(html, 'https://www.tate.org.uk/whats-on/tate-modern/exhibition');
    const data = extractExhibitionMetadata(document, window);

    assert.strictEqual(data.title, 'Hilma af Klint & Piet Mondrian');
    assert.strictEqual(data.venue, 'Tate Modern');
    assert.strictEqual(data.startDate, '2026-10-20');
    assert.strictEqual(data.endDate, '2027-03-03');
  });

  it('should extract metadata from commercial gallery site without JSON-LD (using text and meta)', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cy Twombly: Works on Paper | Hauser & Wirth</title>
        <meta property="og:title" content="Cy Twombly: Works on Paper">
        <meta property="og:site_name" content="Hauser & Wirth">
        <meta property="og:image" content="https://media.hauserwirth.com/twombly.jpg">
        <meta property="og:description" content="A major survey of works on paper from 1954 to 2011.">
      </head>
      <body>
        <div class="exhibition-view">
          <h1 class="title">Cy Twombly: Works on Paper</h1>
          <div class="info">
            <span class="location">542 West 22nd Street, New York</span>
            <span class="date-range">10 October – 20 December 2026</span>
          </div>
        </div>
      </body>
      </html>
    `;
    const { document, window } = createDoc(html, 'https://www.hauserwirth.com/urs-fischer');
    const data = extractExhibitionMetadata(document, window);

    assert.strictEqual(data.title, 'Cy Twombly: Works on Paper');
    assert.strictEqual(data.venue, 'Hauser & Wirth');
    assert.strictEqual(data.startDate, '2026-10-10');
    assert.strictEqual(data.endDate, '2026-12-20');
    assert.strictEqual(data.image, 'https://media.hauserwirth.com/twombly.jpg');
  });

  it('should extract metadata from Squarespace artist portfolio page', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Current Show — Studio of Alex Rivera</title>
        <meta property="og:site_name" content="Alex Rivera Art">
      </head>
      <body>
        <div class="sqs-block-content">
          <h2>Echoes in Clay: Solo Exhibition</h2>
          <p>October 15, 2026 – January 5, 2027</p>
          <p>Main Gallery Space</p>
        </div>
      </body>
      </html>
    `;
    const { document, window } = createDoc(html, 'https://alexrivera.com/exhibitions/echoes-in-clay');
    const data = extractExhibitionMetadata(document, window);

    assert.strictEqual(data.startDate, '2026-10-15');
    assert.strictEqual(data.endDate, '2027-01-05');
  });
});
