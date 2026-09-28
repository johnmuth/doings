/**
 * Exhibition Saver Bookmarklet
 * Extracts exhibition metadata (JSON-LD, Open Graph, meta tags, selections)
 * and dispatches to Google Apps Script.
 */
(async function saveExhibition() {
  // Replace with your deployed Google Apps Script Web App URL ending in /exec
  const WEBHOOK_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

  function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.textContent = message;
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: '999999',
      padding: '12px 20px',
      backgroundColor: isError ? '#dc2626' : '#16a34a',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: '600',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      transition: 'opacity 0.3s ease',
      pointerEvents: 'none'
    });
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  try {
    // 1. Extract JSON-LD metadata
    let schemaData = null;
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const parsed = JSON.parse(script.textContent);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        const match = items.find(item => 
          item && ['Event', 'ExhibitionEvent', 'VisualArtwork'].includes(item['@type'])
        );
        if (match) {
          schemaData = match;
          break;
        }
      } catch (e) {
        // Ignore unparseable JSON-LD blocks
      }
    }

    // 2. Extract Open Graph and standard meta fallbacks
    const getMeta = (prop) => {
      const el = document.querySelector(`meta[property="${prop}"], meta[name="${prop}"]`);
      return el ? el.getAttribute('content') : null;
    };

    const title = schemaData?.name ||
                  getMeta('og:title') ||
                  getMeta('twitter:title') ||
                  document.title.trim();

    const image = schemaData?.image?.url ||
                  (typeof schemaData?.image === 'string' ? schemaData.image : null) ||
                  getMeta('og:image') ||
                  getMeta('twitter:image') ||
                  '';

    const description = schemaData?.description ||
                        getMeta('og:description') ||
                        getMeta('description') ||
                        '';

    const venue = schemaData?.location?.name ||
                  getMeta('og:site_name') ||
                  window.location.hostname.replace(/^www\./, '');

    const startDate = schemaData?.startDate || '';
    const endDate = schemaData?.endDate || '';

    // 3. User Highlighted Text / Selection
    const selectedText = window.getSelection().toString().trim();

    const payload = {
      title,
      venue,
      startDate,
      endDate,
      url: window.location.href,
      image,
      notes: selectedText || description,
      selectedNotes: selectedText,
      description,
      savedAt: new Date().toISOString()
    };

    showToast('Saving exhibition...');

    // Use mode: 'no-cors' with text/plain to avoid CORS preflight blocking in browsers
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    showToast('Exhibition saved to Google Sheets!');
  } catch (err) {
    console.error('Bookmarklet error:', err);
    showToast(`Failed to save exhibition: ${err.message}`, true);
  }
})();
