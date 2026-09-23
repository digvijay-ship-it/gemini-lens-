// universal_snip.js - Universal Element Snipping Tool for Any Webpage

(function () {
  // Prevent duplicate instances on the same page
  if (window.__geminiLensSnipperActive) {
    console.log('[Gemini Lens] Snipper already active.');
    return;
  }
  window.__geminiLensSnipperActive = true;

  const STYLE_ID = 'gemini-lens-universal-style';
  let existingStyle = document.getElementById(STYLE_ID);
  if (!existingStyle) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .gemini-lens-selectable-hover {
        outline: 2.5px solid #a855f7 !important;
        outline-offset: 3px !important;
        box-shadow: 0 0 16px rgba(168, 85, 247, 0.6) !important;
        cursor: crosshair !important;
        transition: outline 0.05s ease !important;
      }

      body.gemini-lens-snip-active {
        cursor: crosshair !important;
      }

      #gemini-lens-snip-banner {
        position: fixed !important;
        top: 14px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        z-index: 2147483647 !important;
        background: rgba(24, 25, 28, 0.95) !important;
        color: #ffffff !important;
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        padding: 8px 18px !important;
        border-radius: 30px !important;
        border: 1px solid #a855f7 !important;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 15px rgba(168, 85, 247, 0.3) !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        user-select: none !important;
        pointer-events: none !important;
        animation: gl-banner-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }

      @keyframes gl-banner-in {
        from { opacity: 0; transform: translate(-50%, -10px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }

      #gemini-lens-toast-container {
        position: fixed !important;
        bottom: 24px !important;
        right: 24px !important;
        z-index: 2147483647 !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
        pointer-events: none !important;
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif !important;
      }

      .gemini-lens-toast {
        background: #18191c !important;
        color: #ffffff !important;
        border: 1px solid #a855f7 !important;
        padding: 10px 16px !important;
        border-radius: 12px !important;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35) !important;
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        font-size: 13px !important;
        animation: gl-toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
      }

      @keyframes gl-toast-in {
        from { opacity: 0; transform: translateY(12px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  // Helper: show toast message on the page
  function showToast(title, subtitle = '', icon = '📋') {
    let container = document.getElementById('gemini-lens-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'gemini-lens-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'gemini-lens-toast';
    toast.innerHTML = `
      <span style="font-size: 18px;">${icon}</span>
      <div>
        <div style="font-weight: 600;">${title}</div>
        ${subtitle ? `<div style="font-size: 11px; color: #c4b5fd; margin-top: 1px;">${subtitle}</div>` : ''}
      </div>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // Create top notification banner
  const banner = document.createElement('div');
  banner.id = 'gemini-lens-snip-banner';
  banner.innerHTML = `<span>🎯</span> Click any element to snip & copy <span style="opacity: 0.6; font-size: 11px;">(Esc to Cancel)</span>`;
  document.body.appendChild(banner);
  document.body.classList.add('gemini-lens-snip-active');

  let currentHovered = null;

  function getTargetElement(el) {
    if (!el || el === document.body || el === document.documentElement) return null;
    if (el.id === 'gemini-lens-snip-banner' || el.closest('#gemini-lens-toast-container')) return null;

    let target = el;
    // Walk up to find meaningful content element
    while (target && target !== document.body) {
      const tag = target.tagName.toLowerCase();
      if (['img', 'p', 'pre', 'code', 'table', 'tr', 'ul', 'ol', 'li', 'blockquote', 'article', 'section', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figure'].includes(tag)) {
        return target;
      }
      if (tag === 'div') {
        const rect = target.getBoundingClientRect();
        // Ignore full-page overlay wrappers
        if (rect.width > 20 && rect.height > 20 && rect.width < window.innerWidth * 0.98) {
          return target;
        }
      }
      target = target.parentElement;
    }
    return el;
  }

  function onMouseMove(e) {
    const target = getTargetElement(e.target);
    if (target !== currentHovered) {
      if (currentHovered) {
        currentHovered.classList.remove('gemini-lens-selectable-hover');
      }
      if (target) {
        target.classList.add('gemini-lens-selectable-hover');
      }
      currentHovered = target;
    }
  }

  function cleanup() {
    window.__geminiLensSnipperActive = false;
    if (currentHovered) {
      currentHovered.classList.remove('gemini-lens-selectable-hover');
      currentHovered = null;
    }
    const b = document.getElementById('gemini-lens-snip-banner');
    if (b) b.remove();
    document.body.classList.remove('gemini-lens-snip-active');

    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      cleanup();
      showToast('Snipping Cancelled', '', '❌');
    }
  }

  async function onClick(e) {
    e.preventDefault();
    e.stopPropagation();

    const target = currentHovered || getTargetElement(e.target);
    cleanup();

    if (!target) return;

    try {
      // Scroll into view if needed
      target.scrollIntoView({ behavior: 'instant', block: 'nearest' });
      await new Promise(r => setTimeout(r, 60));

      const rect = target.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;

      // Hide any floating helper panels or toolbars during element capture
      const extraHide = [];
      ['#gemini-helper-panel', '.quick-btn-group', '.gemini-screenshot-btn-container', '#gemini-lens-toast-container', '[id*="gemini-helper"]', '[class*="gemini-helper"]'].forEach(sel => {
        try {
          document.querySelectorAll(sel).forEach(el => {
            if (el && !el.contains(target) && el !== target && el.style.display !== 'none') {
              const orig = el.style.display;
              el.style.setProperty('display', 'none', 'important');
              extraHide.push({ el, orig });
            }
          });
        } catch (e) {}
      });

      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise(r => setTimeout(r, 40));

      // Ask background script for visible tab capture
      chrome.runtime.sendMessage({ action: 'CAPTURE_VISIBLE_TAB' }, async (response) => {
        // Restore hidden panels
        extraHide.forEach(({ el, orig }) => {
          try {
            if (orig) el.style.display = orig;
            else el.style.removeProperty('display');
          } catch (e) {}
        });

        if (!response || response.error || !response.dataUrl) {
          showToast('Capture Failed', response ? response.error : 'No data returned', '❌');
          return;
        }

        const img = new Image();
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            const cropX = Math.max(0, Math.floor(rect.left * scale));
            const cropY = Math.max(0, Math.floor(rect.top * scale));
            const cropW = Math.min(img.width - cropX, Math.floor(rect.width * scale));
            const cropH = Math.min(img.height - cropY, Math.floor(rect.height * scale));

            if (cropW <= 0 || cropH <= 0) {
              showToast('Capture Failed', 'Element size is zero or out of viewport', '❌');
              return;
            }

            canvas.width = cropW;
            canvas.height = cropH;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

            canvas.toBlob(async (blob) => {
              if (!blob) {
                showToast('Capture Failed', 'Could not create image blob', '❌');
                return;
              }

              let isCopied = false;
              try {
                const item = new ClipboardItem({ 'image/png': blob });
                await navigator.clipboard.write([item]);
                isCopied = true;
                showToast('Copied to Clipboard!', 'Ready to paste anywhere (Ctrl + V)', '📋');
              } catch (clipErr) {
                console.warn('[Gemini Lens] Direct clipboard write blocked, downloading fallback...', clipErr);
              }

              // Check user download preference
              const prefs = await chrome.storage.local.get(['gemini_auto_download_pref']);
              if (prefs.gemini_auto_download_pref || !isCopied) {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `snip_${Date.now()}.png`;
                a.click();
                if (prefs.gemini_auto_download_pref && isCopied) {
                  showToast('Copied & Downloaded!', 'Saved PNG to Downloads', '💾');
                }
              }
            }, 'image/png');
          } catch (err) {
            console.error('[Gemini Lens] Canvas crop error:', err);
            showToast('Crop Error', err.message, '❌');
          }
        };
        img.src = response.dataUrl;
      });
    } catch (err) {
      console.error('[Gemini Lens] Snipping error:', err);
      showToast('Error', err.message, '❌');
    }
  }

  document.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown, true);
})();
