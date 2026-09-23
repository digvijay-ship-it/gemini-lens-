// background.js - Background service worker for Gemini Lens & Universal Screenshot

const captureQueue = [];
let isCapturing = false;
let lastCaptureTime = 0;

function processQueue() {
  if (isCapturing || captureQueue.length === 0) return;
  isCapturing = true;

  const { windowId, resolve, reject } = captureQueue.shift();
  // Ensure at least 350ms between calls to avoid MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND
  const delay = Math.max(0, 350 - (Date.now() - lastCaptureTime));

  setTimeout(() => {
    chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (dataUrl) => {
      lastCaptureTime = Date.now();
      if (chrome.runtime.lastError) {
        const errorMsg = chrome.runtime.lastError.message || '';
        // If rate limit hit, retry once after 1 second
        if (errorMsg.includes('MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND')) {
          console.warn('[Background] Rate limit hit. Retrying in 1s...');
          setTimeout(() => {
            chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (retryUrl) => {
              isCapturing = false;
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(retryUrl);
              }
              processQueue();
            });
          }, 1000);
          return;
        }
        isCapturing = false;
        reject(new Error(errorMsg));
        processQueue();
      } else {
        isCapturing = false;
        resolve(dataUrl);
        processQueue();
      }
    });
  }, delay);
}

function queueCapture(windowId) {
  return new Promise((resolve, reject) => {
    captureQueue.push({ windowId, resolve, reject });
    processQueue();
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'CAPTURE_VISIBLE_TAB') {
    const windowId = sender.tab && typeof sender.tab.windowId === 'number' ? sender.tab.windowId : null;
    queueCapture(windowId)
      .then((dataUrl) => {
        sendResponse({ dataUrl });
      })
      .catch((err) => {
        console.error('[Background] Capture failed:', err);
        sendResponse({ error: err.message || String(err) });
      });
    return true; // Keep channel open for async response
  }
});
