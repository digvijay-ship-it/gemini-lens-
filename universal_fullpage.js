// universal_fullpage.js - True Full-Page Auto-Scroll & Stitch Engine for Any Webpage

(async function () {
  if (window.__geminiLensFullPageRunning) {
    console.warn('[Gemini Lens] Full-page capture already in progress.');
    return;
  }
  window.__geminiLensFullPageRunning = true;

  const originalScrollX = window.scrollX;
  const originalScrollY = window.scrollY;

  // Read user preference for download
  let shouldDownload = false;
  try {
    const res = await chrome.storage.local.get(['gemini_auto_download_pref']);
    shouldDownload = !!res.gemini_auto_download_pref;
  } catch (e) {}

  // 1. Inject temporary styles for clean capture
  const styleEl = document.createElement('style');
  styleEl.id = 'gemini-lens-fullpage-temp-style';
  styleEl.textContent = `
    html::-webkit-scrollbar, body::-webkit-scrollbar {
      width: 0 !important;
      height: 0 !important;
      display: none !important;
    }
    html, body {
      scrollbar-width: none !important;
      scroll-behavior: auto !important;
    }
    *, *::before, *::after {
      transition: none !important;
      animation-duration: 0s !important;
      animation-delay: 0s !important;
    }
    .gemini-lens-hide-fixed {
      visibility: hidden !important;
      opacity: 0 !important;
      transition: none !important;
    }
  `;
  document.head.appendChild(styleEl);

  // 2. Floating progress HUD
  const hud = document.createElement('div');
  hud.id = 'gemini-lens-fullpage-hud';
  Object.assign(hud.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: '2147483647',
    background: 'rgba(24, 25, 28, 0.95)',
    color: '#ffffff',
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    fontSize: '13px',
    padding: '12px 18px',
    borderRadius: '14px',
    border: '1px solid #a855f7',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(168, 85, 247, 0.35)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: '220px',
    userSelect: 'none',
    pointerEvents: 'none',
    transition: 'opacity 0.3s ease, transform 0.3s ease'
  });

  hud.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 600;">
      <span>📜 Capturing Full Page...</span>
      <span id="gl-hud-pct" style="color: #c084fc;">0%</span>
    </div>
    <div style="width: 100%; height: 6px; background: #374151; border-radius: 3px; overflow: hidden;">
      <div id="gl-hud-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #7c3aed, #c084fc); transition: width 0.2s ease;"></div>
    </div>
  `;
  document.body.appendChild(hud);

  function updateProgress(pct) {
    const p = Math.min(100, Math.max(0, Math.round(pct)));
    const pctEl = document.getElementById('gl-hud-pct');
    const barEl = document.getElementById('gl-hud-bar');
    if (pctEl) pctEl.textContent = `${p}%`;
    if (barEl) barEl.style.width = `${p}%`;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function captureTab() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'CAPTURE_VISIBLE_TAB' }, (res) => {
        if (!res) return reject(new Error('No response from background'));
        if (res.error) return reject(new Error(res.error));
        resolve(res.dataUrl);
      });
    });
  }

  // Safe capture that completely hides the HUD and any floating helper panels so they NEVER appear in the screenshot!
  async function safeCaptureTab() {
    hud.style.setProperty('display', 'none', 'important');
    hud.style.setProperty('visibility', 'hidden', 'important');
    hud.style.setProperty('opacity', '0', 'important');

    // Also hide any on-page panels or banners
    const extraHide = [];
    ['#gemini-helper-panel', '.quick-btn-group', '.gemini-screenshot-btn-container', '#gemini-lens-snip-banner', '#gemini-lens-toast-container'].forEach(sel => {
      try {
        document.querySelectorAll(sel).forEach(el => {
          if (el && el.style.display !== 'none') {
            const orig = el.style.display;
            el.style.setProperty('display', 'none', 'important');
            extraHide.push({ el, orig });
          }
        });
      } catch (e) {}
    });

    // Wait 2 animation frames + 60ms delay to guarantee Chrome GPU compositor has painted the frame with HUD completely gone!
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await sleep(60);

    try {
      const dataUrl = await captureTab();
      return dataUrl;
    } finally {
      hud.style.removeProperty('display');
      hud.style.removeProperty('visibility');
      hud.style.removeProperty('opacity');
      extraHide.forEach(({ el, orig }) => {
        try {
          if (orig) el.style.display = orig;
          else el.style.removeProperty('display');
        } catch (e) {}
      });
    }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image slice'));
      img.src = src;
    });
  }

  const modifiedSticky = [];
  const hiddenFixed = [];

  // Hide sticky and fixed elements so they don't duplicate down the page
  function hideFloatingAndSticky() {
    // Explicitly hide any Gemini helper panels or toolbars
    ['#gemini-helper-panel', '.quick-btn-group', '.gemini-screenshot-btn-container', '[id*="gemini-helper"]', '[class*="gemini-helper"]'].forEach(sel => {
      try {
        document.querySelectorAll(sel).forEach(el => {
          if (!el.classList.contains('gemini-lens-hide-fixed')) {
            el.classList.add('gemini-lens-hide-fixed');
            hiddenFixed.push(el);
          }
        });
      } catch (e) {}
    });

    document.querySelectorAll('*').forEach((el) => {
      if (el === hud || hud.contains(el)) return;
      try {
        const comp = window.getComputedStyle(el);
        if (comp.position === 'fixed') {
          if (!el.classList.contains('gemini-lens-hide-fixed')) {
            el.classList.add('gemini-lens-hide-fixed');
            hiddenFixed.push(el);
          }
        } else if (comp.position === 'sticky') {
          modifiedSticky.push({ el, original: el.style.position });
          el.style.setProperty('position', 'relative', 'important');
        }
      } catch (e) {}
    });
  }

  try {
    // 3. Measure dimensions
    const doc = document.documentElement;
    const body = document.body;

    const fullWidth = Math.max(
      doc.scrollWidth,
      body ? body.scrollWidth : 0,
      doc.clientWidth
    );
    const fullHeight = Math.max(
      doc.scrollHeight,
      body ? body.scrollHeight : 0,
      doc.clientHeight
    );
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Scroll to top to begin
    window.scrollTo(0, 0);
    await sleep(350);

    // Initial capture (includes header for top slice)
    const firstDataUrl = await safeCaptureTab();
    const firstImg = await loadImage(firstDataUrl);

    // Device Pixel Ratio scaling factor
    const scale = firstImg.width / viewportWidth;

    // Safety limit: Browser canvas max dimension is typically 32,767px
    const MAX_CANVAS_DIM = 32000;
    const canvasWidth = Math.min(Math.round(fullWidth * scale), MAX_CANVAS_DIM);
    const canvasHeight = Math.min(Math.round(fullHeight * scale), MAX_CANVAS_DIM);

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    // Fill background color
    const bodyBg = window.getComputedStyle(body || doc).backgroundColor;
    ctx.fillStyle = bodyBg && bodyBg !== 'transparent' && !bodyBg.includes('rgba(0, 0, 0, 0)') ? bodyBg : '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw first slice
    const firstSliceH = Math.min(viewportHeight, fullHeight);
    ctx.drawImage(
      firstImg,
      0, 0, firstImg.width, Math.round(firstSliceH * scale),
      0, 0, canvasWidth, Math.round(firstSliceH * scale)
    );

    updateProgress((viewportHeight / fullHeight) * 100);

    // Immediately hide fixed and sticky headers so they don't repeat on subsequent scroll steps
    hideFloatingAndSticky();

    let currentY = viewportHeight;
    const maxSteps = Math.min(Math.ceil(fullHeight / viewportHeight) + 2, 50);
    let stepCount = 0;

    while (currentY < fullHeight && stepCount < maxSteps) {
      stepCount++;
      window.scrollTo(0, currentY);
      await sleep(400); // Wait for repaint

      // Re-apply to catch any dynamic sticky/fixed bars added on scroll (e.g. Google search bar)
      hideFloatingAndSticky();

      const actualScrollY = window.scrollY;
      const isAtBottom = actualScrollY + viewportHeight >= fullHeight;

      const dataUrl = await safeCaptureTab();
      const img = await loadImage(dataUrl);

      if (isAtBottom) {
        // Last slice: calculate delta so bottom isn't duplicated
        const remainingH = fullHeight - currentY;
        const sourceY = Math.max(0, (viewportHeight - remainingH) * scale);
        const sourceH = Math.min(remainingH * scale, img.height - sourceY);
        const destY = Math.min(Math.round(currentY * scale), canvasHeight - 1);
        const destH = Math.min(Math.round(remainingH * scale), canvasHeight - destY);

        if (sourceH > 0 && destH > 0) {
          ctx.drawImage(img, 0, sourceY, img.width, sourceH, 0, destY, canvasWidth, destH);
        }
        break;
      } else {
        const destY = Math.round(actualScrollY * scale);
        const destH = Math.round(viewportHeight * scale);
        if (destY < canvasHeight) {
          ctx.drawImage(img, 0, 0, img.width, img.height, 0, destY, canvasWidth, Math.min(destH, canvasHeight - destY));
        }
      }

      currentY += viewportHeight;
      updateProgress((Math.min(currentY, fullHeight) / fullHeight) * 100);
    }

    updateProgress(100);

    // Export & Save
    hud.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; color: #4ade80;">
        <span style="font-size: 16px;">✅</span>
        <span>${shouldDownload ? 'Full Page Copied & Saved!' : 'Full Page Copied to Clipboard!'}</span>
      </div>
      <div style="font-size: 11px; color: #d1d5db;">${shouldDownload ? 'Clipboard ready (Ctrl+V) & Downloaded' : 'Ready to paste anywhere (Ctrl+V)'}</div>
    `;

    canvas.toBlob(async (blob) => {
      if (blob) {
        // 1. Always copy to clipboard
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          console.log('[Gemini Lens] Full-page image copied to clipboard.');
        } catch (clipErr) {
          console.warn('[Gemini Lens] Clipboard write blocked:', clipErr);
        }

        // 2. Only download if user enabled the download checkbox!
        if (shouldDownload) {
          const cleanTitle = (document.title || 'webpage').replace(/[^a-z0-9_-]/gi, '_').substring(0, 40);
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `${cleanTitle}_fullpage_${Date.now()}.png`;
          a.click();
        }
      }
    }, 'image/png');

  } catch (err) {
    console.error('[Gemini Lens] Full-page capture error:', err);
    hud.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; color: #f87171;">
        <span style="font-size: 16px;">❌</span>
        <span>Capture Failed</span>
      </div>
      <div style="font-size: 11px; color: #fca5a5;">${err.message || 'Error occurred'}</div>
    `;
  } finally {
    // Restore DOM state
    styleEl.remove();
    modifiedSticky.forEach(({ el, original }) => {
      el.style.position = original;
    });
    hiddenFixed.forEach((el) => {
      el.classList.remove('gemini-lens-hide-fixed');
    });

    // Restore original scroll position
    window.scrollTo(originalScrollX, originalScrollY);

    setTimeout(() => {
      hud.style.opacity = '0';
      hud.style.transform = 'translateY(12px)';
      setTimeout(() => {
        hud.remove();
        window.__geminiLensFullPageRunning = false;
      }, 350);
    }, 2800);
  }
})();
