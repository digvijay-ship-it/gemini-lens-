// popup.js - Gemini Lens & Universal Screenshot Popup

const STORAGE_KEY = 'gemini_chat_width_pref';
const widthLabel = document.getElementById('current-width-label');
const slider = document.getElementById('width-slider');
const presetBtns = document.querySelectorAll('.preset-btn');
const fullPageBtn = document.getElementById('btn-fullpage-scroll');
const snipBtn = document.getElementById('btn-snip-element');
const captureScreenBtn = document.getElementById('btn-capture-screen');
const widthSection = document.getElementById('gemini-width-section');

// =========================================================================
// UNIVERSAL SCREENSHOT ACTIONS (ANY WEBSITE)
// =========================================================================

// 0. Full Page Auto-Scroll & Stitch (GoFullPage-style full webpage capture)
fullPageBtn?.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;

    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
      alert('Cannot run screenshot tools on browser system pages.');
      return;
    }

    // Inject universal_fullpage.js into current page
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['universal_fullpage.js']
    });

    // Close popup so the page can scroll and show progress HUD
    window.close();
  } catch (err) {
    console.error('[Popup] Failed to start full page capture:', err);
    alert('Could not start full-page capture: ' + (err.message || String(err)));
  }
});

// 1. Snip Any Element on the active tab
snipBtn?.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;

    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
      alert('Cannot run screenshot tools on browser system pages.');
      return;
    }

    // Inject universal_snip.js into current page
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['universal_snip.js']
    });

    // Close popup so the user can immediately click any element on the page
    window.close();
  } catch (err) {
    console.error('[Popup] Failed to inject snipper:', err);
    alert('Could not start snipping on this tab: ' + (err.message || String(err)));
  }
});

// 2. Capture Full Visible Viewport to Clipboard
captureScreenBtn?.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
    alert('Cannot screenshot browser internal pages.');
    return;
  }

  const originalHTML = captureScreenBtn.innerHTML;
  captureScreenBtn.innerHTML = '<span>⏳</span> Capturing...';
  captureScreenBtn.disabled = true;

  chrome.runtime.sendMessage({ action: 'CAPTURE_VISIBLE_TAB' }, async (response) => {
    if (response && response.dataUrl) {
      try {
        const res = await fetch(response.dataUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        captureScreenBtn.innerHTML = '<span>✅</span> Copied!';

        const storage = await chrome.storage.local.get([PREF_KEY_DOWNLOAD]);
        if (storage[PREF_KEY_DOWNLOAD]) {
          const a = document.createElement('a');
          a.href = response.dataUrl;
          a.download = `screenshot_${Date.now()}.png`;
          a.click();
          captureScreenBtn.innerHTML = '<span>💾</span> Copied & Saved!';
        }
      } catch (err) {
        console.warn('[Popup] Direct clipboard write failed, downloading...', err);
        const a = document.createElement('a');
        a.href = response.dataUrl;
        a.download = `screenshot_${Date.now()}.png`;
        a.click();
        captureScreenBtn.innerHTML = '<span>💾</span> Downloaded!';
      }
    } else {
      captureScreenBtn.innerHTML = '<span>❌</span> Failed';
    }

    setTimeout(() => {
      captureScreenBtn.innerHTML = originalHTML;
      captureScreenBtn.disabled = false;
    }, 2000);
  });
});

// Manage download preference checkbox
const PREF_KEY_DOWNLOAD = 'gemini_auto_download_pref';
const autoDownloadChk = document.getElementById('chk-auto-download');

chrome.storage.local.get([PREF_KEY_DOWNLOAD], (res) => {
  if (autoDownloadChk) {
    autoDownloadChk.checked = !!res[PREF_KEY_DOWNLOAD];
  }
});

autoDownloadChk?.addEventListener('change', (e) => {
  chrome.storage.local.set({ [PREF_KEY_DOWNLOAD]: e.target.checked });
});

// =========================================================================
// GEMINI SPECIFIC CHAT WIDTH CONTROLLER
// =========================================================================

function updateUI(widthVal, isGemini = true) {
  if (widthLabel) {
    if (!isGemini) {
      widthLabel.textContent = 'Gemini Only';
      widthLabel.style.color = '#9ca3af';
      widthLabel.style.background = 'rgba(255, 255, 255, 0.08)';
    } else {
      widthLabel.textContent = widthVal === 'default' ? 'Default (860px)' : (widthVal === '96vw' ? 'Full (96%)' : widthVal);
      widthLabel.style.color = '#c084fc';
      widthLabel.style.background = 'rgba(168, 85, 247, 0.15)';
    }
  }

  presetBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.width === widthVal);
  });

  if (slider && widthVal && widthVal.endsWith('px')) {
    slider.value = parseInt(widthVal, 10);
  }
}

function broadcastWidthChange(widthVal) {
  chrome.storage.local.set({ [STORAGE_KEY]: widthVal }, () => {
    chrome.tabs.query({ url: '*://gemini.google.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'SET_CHAT_WIDTH',
          width: widthVal
        }).catch(() => {});
      });
    });
  });
}

presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const widthVal = btn.dataset.width;
    updateUI(widthVal, true);
    broadcastWidthChange(widthVal);
  });
});

slider?.addEventListener('input', (e) => {
  const widthVal = `${e.target.value}px`;
  updateUI(widthVal, true);
  broadcastWidthChange(widthVal);
});

// Initialize on popup open
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get([STORAGE_KEY], (res) => {
    const saved = res[STORAGE_KEY] || 'default';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      const isGemini = activeTab && activeTab.url && activeTab.url.includes('gemini.google.com');

      updateUI(saved, isGemini);

      if (isGemini && activeTab.id) {
        chrome.tabs.sendMessage(activeTab.id, { action: 'GET_CHAT_WIDTH' }, (response) => {
          if (!chrome.runtime.lastError && response && response.width) {
            updateUI(response.width, true);
          }
        });
      }
    });
  });
});
