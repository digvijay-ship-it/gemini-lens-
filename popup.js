// popup.js - Gemini Helper Extension Popup

const STORAGE_KEY = 'gemini_chat_width_pref';
const widthLabel = document.getElementById('current-width-label');
const slider = document.getElementById('width-slider');
const presetBtns = document.querySelectorAll('.preset-btn');

// Update popup UI
function updateUI(widthVal) {
  if (widthLabel) {
    widthLabel.textContent = widthVal === 'default' ? 'Default (860px)' : (widthVal === '96vw' ? 'Full (96%)' : widthVal);
  }

  presetBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.width === widthVal);
  });

  if (slider && widthVal && widthVal.endsWith('px')) {
    slider.value = parseInt(widthVal, 10);
  }
}

// Send message to active Gemini tab(s) to apply width in real-time
function broadcastWidthChange(widthVal) {
  chrome.storage.local.set({ [STORAGE_KEY]: widthVal }, () => {
    // Notify all active Gemini tabs
    chrome.tabs.query({ url: '*://gemini.google.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'SET_CHAT_WIDTH',
          width: widthVal
        }).catch(() => {
          // Tab might not have script loaded or is sleeping
        });
      });
    });
  });
}

// Handle preset buttons
presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const widthVal = btn.dataset.width;
    updateUI(widthVal);
    broadcastWidthChange(widthVal);
  });
});

// Handle slider
slider.addEventListener('input', (e) => {
  const widthVal = `${e.target.value}px`;
  updateUI(widthVal);
  broadcastWidthChange(widthVal);
});

// Load saved preference on popup open
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get([STORAGE_KEY], (res) => {
    const saved = res[STORAGE_KEY] || 'default';
    updateUI(saved);

    // Try to query active tab for latest live state
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id && tabs[0].url && tabs[0].url.includes('gemini.google.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'GET_CHAT_WIDTH' }, (response) => {
          if (!chrome.runtime.lastError && response && response.width) {
            updateUI(response.width);
          }
        });
      }
    });
  });
});
