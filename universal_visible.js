// universal_visible.js - Universal 1-Click Visible Viewport Capture to Clipboard

(async function () {
  if (window.__geminiLensVisibleCapturing) {
    return;
  }
  window.__geminiLensVisibleCapturing = true;

  // Helper: show toast message on the page
  function showToast(title, subtitle = '', icon = '📷') {
    let container = document.getElementById('gemini-lens-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'gemini-lens-toast-container';
      Object.assign(container.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: '2147483647',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
      });
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'gemini-lens-toast';
    Object.assign(toast.style, {
      background: 'rgba(24, 25, 28, 0.96)',
      color: '#ffffff',
      border: '1px solid #a855f7',
      padding: '10px 18px',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 15px rgba(168, 85, 247, 0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '13px',
      backdropFilter: 'blur(10px)',
      opacity: '0',
      transform: 'translateY(12px) scale(0.95)',
      transition: 'opacity 0.25s ease, transform 0.25s ease'
    });

    toast.innerHTML = `
      <span style="font-size: 18px;">${icon}</span>
      <div>
        <div style="font-weight: 600;">${title}</div>
        ${subtitle ? `<div style="font-size: 11px; color: #c4b5fd; margin-top: 1px;">${subtitle}</div>` : ''}
      </div>
    `;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0) scale(1)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // 1. Wait a brief moment for the popup window to close and Chrome to repaint the screen
  await new Promise(r => setTimeout(r, 180));

  // 2. Hide any helper panels, overlays, or buttons
  const panelSelectors = [
    '#gemini-helper-panel',
    '.quick-btn-group',
    '#gemini-lens-fullpage-hud',
    '#gemini-lens-snip-banner',
    '#gemini-lens-toast-container',
    '.gemini-screenshot-btn-container',
    '.gemini-screenshot-toast',
    '[id*="gemini-helper"]',
    '[class*="gemini-helper"]'
  ];

  const hiddenEls = [];
  panelSelectors.forEach(sel => {
    try {
      document.querySelectorAll(sel).forEach(el => {
        if (el && el.style.display !== 'none') {
          const origDisplay = el.style.display;
          const origVisibility = el.style.visibility;
          el.style.setProperty('display', 'none', 'important');
          el.style.setProperty('visibility', 'hidden', 'important');
          hiddenEls.push({ el, origDisplay, origVisibility });
        }
      });
    } catch (e) {}
  });

  // Wait 2 animation frames + 50ms to ensure compositor commit of hidden elements
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise(r => setTimeout(r, 50));

  try {
    // 3. Request capture from background
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'CAPTURE_VISIBLE_TAB' }, (res) => resolve(res));
    });

    if (!response || response.error || !response.dataUrl) {
      showToast('Capture Failed', response ? response.error : 'No image data', '❌');
      return;
    }

    // 4. Fetch blob and copy to clipboard
    const res = await fetch(response.dataUrl);
    const blob = await res.blob();

    let isCopied = false;
    try {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      isCopied = true;
    } catch (clipErr) {
      console.warn('[Gemini Lens] Clipboard write failed:', clipErr);
    }

    // 5. Check download preference
    let shouldDownload = false;
    try {
      const prefs = await chrome.storage.local.get(['gemini_auto_download_pref']);
      shouldDownload = !!prefs.gemini_auto_download_pref;
    } catch (e) {}

    if (shouldDownload || !isCopied) {
      const cleanTitle = (document.title || 'screen').replace(/[^a-z0-9_-]/gi, '_').substring(0, 40);
      const a = document.createElement('a');
      a.href = response.dataUrl;
      a.download = `${cleanTitle}_visible_${Date.now()}.png`;
      a.click();
    }

    if (isCopied && shouldDownload) {
      showToast('Visible Screen Copied & Saved!', 'Clipboard ready (Ctrl+V) & Saved PNG', '💾');
    } else if (isCopied) {
      showToast('Visible Screen Copied!', 'Ready to paste anywhere (Ctrl + V)', '📷');
    } else {
      showToast('Visible Screen Downloaded!', 'Image saved to Downloads', '💾');
    }

  } catch (err) {
    console.error('[Gemini Lens] Visible screen capture error:', err);
    showToast('Capture Error', err.message || String(err), '❌');
  } finally {
    // Restore any hidden panels
    hiddenEls.forEach(({ el, origDisplay, origVisibility }) => {
      try {
        if (origDisplay) {
          el.style.display = origDisplay;
        } else {
          el.style.removeProperty('display');
        }
        if (origVisibility) {
          el.style.visibility = origVisibility;
        } else {
          el.style.removeProperty('visibility');
        }
      } catch (e) {}
    });
    window.__geminiLensVisibleCapturing = false;
  }
})();
