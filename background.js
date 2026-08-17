// Background service worker for the Gemini response screenshot extension

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'CAPTURE_VISIBLE_TAB') {
    console.log('[Background] Received CAPTURE_VISIBLE_TAB request...');
    try {
      const windowId = sender.tab && typeof sender.tab.windowId === 'number' ? sender.tab.windowId : null;
      if (windowId === null) {
        console.warn('[Gemini Screenshot BG] sender.tab.windowId is undefined. Defaulting to null.');
      }
      
      console.log(`[Background] Executing chrome.tabs.captureVisibleTab on windowId: ${windowId}...`);
      chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.error('[Background] Capture failed. Runtime lastError:', chrome.runtime.lastError.message);
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          console.log('[Background] Viewport screenshot capture successful!');
          sendResponse({ dataUrl: dataUrl });
        }
      });
    } catch (err) {
      console.error('[Background] Exception in captureVisibleTab:', err);
      sendResponse({ error: err.message || String(err) });
    }
    return true; // Keep the message channel open for asynchronous response
  }
});
