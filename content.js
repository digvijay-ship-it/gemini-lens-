// content.js - Gemini Response Screenshot Chrome Extension

(function() {
  // Inject styling for the screenshot buttons and loaders
  const style = document.createElement('style');
  style.textContent = `
    /* Container styling for absolute placement in card top-right */
    .gemini-screenshot-btn-container {
      position: absolute;
      top: 12px;
      right: 12px;
      opacity: 0;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 1000;
      display: flex;
      align-items: center;
      background: #2e3033;
      border: 1px solid #4f5154;
      border-radius: 20px;
      padding: 2px;
      overflow: hidden;
      max-width: 32px;
      height: 32px;
      pointer-events: auto;
    }
    
    /* Ensure the card is positioned relatively so the button anchors correctly */
    model-response {
      position: relative !important;
    }
    
    /* Show button on hover of the card */
    model-response:hover .gemini-screenshot-btn-container {
      opacity: 1;
    }
    
    .gemini-screenshot-btn-container:hover {
      max-width: 250px; /* Expand to show both buttons */
      background: #1e1f21;
      padding: 4px 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border-color: #a855f7;
      height: auto;
    }
    
    /* Trigger Icon (Circular Camera Icon) */
    .gemini-screenshot-btn-trigger {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      min-width: 28px;
      height: 28px;
      cursor: pointer;
      transition: transform 0.2s ease;
      user-select: none;
    }
    
    .gemini-screenshot-btn-container:hover .gemini-screenshot-btn-trigger {
      display: none;
    }
    
    .gemini-screenshot-btn-menu {
      display: none;
      gap: 6px;
    }
    
    .gemini-screenshot-btn-container:hover .gemini-screenshot-btn-menu {
      display: flex;
      animation: gemini-slide-in 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    @keyframes gemini-slide-in {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
    
    /* Premium button styling matching Gemini's style guide */
    .gemini-screenshot-btn {
      background: linear-gradient(135deg, #1a73e8, #c669ff);
      color: #ffffff;
      border: none;
      padding: 6px 14px;
      font-size: 13px;
      font-family: 'Google Sans', 'Inter', sans-serif;
      font-weight: 500;
      border-radius: 20px;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      outline: none;
      user-select: none;
    }
    
    .gemini-screenshot-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
      filter: brightness(1.08);
    }
    
    .gemini-screenshot-btn:active {
      transform: translateY(1px);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }
    
    .gemini-screenshot-btn-select {
      background: #2e3033;
      border: 1px solid #4f5154;
      background-clip: padding-box;
    }
    
    .gemini-screenshot-btn-select:hover {
      background: #3e4145;
      border-color: #a855f7;
    }
    
    /* Success, loading, and error states styling */
    .gemini-screenshot-btn.success {
      background: #0f9d58;
      color: #ffffff;
    }
    
    .gemini-screenshot-btn.error {
      background: #d93025;
      color: #ffffff;
    }
    
    .gemini-screenshot-btn.loading {
      background: #5f6368;
      color: #ffffff;
      cursor: not-allowed;
    }
    
    /* Spinning elements for loaders */
    .gemini-screenshot-spinner {
      width: 12px;
      height: 12px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #ffffff;
      animation: gemini-spin 1s ease-in-out infinite;
      display: inline-block;
    }
    
    @keyframes gemini-spin {
      to { transform: rotate(360deg); }
    }
    
    /* Element selection highlighting */
    .gemini-screenshot-selectable-hover {
      outline: 2px solid #a855f7 !important;
      outline-offset: 2px !important;
      background-color: rgba(168, 85, 247, 0.08) !important;
      cursor: crosshair !important;
      transition: outline 0.15s ease, background-color 0.15s ease !important;
    }
    
    body.gemini-screenshot-selecting-mode * {
      pointer-events: auto !important;
    }
    body.gemini-screenshot-selecting-mode {
      cursor: crosshair !important;
    }
    
    #gemini-screenshot-selection-banner {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483647;
      background: rgba(19, 19, 20, 0.95);
      border: 1px solid #a855f7;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      padding: 10px 20px;
      border-radius: 30px;
      font-family: 'Google Sans', sans-serif;
      font-size: 13px;
      color: #f3e8ff;
      display: flex;
      align-items: center;
      gap: 8px;
      backdrop-filter: blur(10px);
      animation: gemini-slide-down 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
    }
    @keyframes gemini-slide-down {
      from { top: -60px; opacity: 0; }
      to { top: 20px; opacity: 1; }
    }

    /* Toast Notification */
    .gemini-screenshot-toast {
      position: fixed;
      bottom: 28px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      z-index: 2147483647;
      background: rgba(24, 24, 27, 0.96);
      border: 1px solid rgba(168, 85, 247, 0.5);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(168, 85, 247, 0.2);
      padding: 10px 18px;
      border-radius: 30px;
      font-family: 'Google Sans', 'Inter', system-ui, sans-serif;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 12px;
      backdrop-filter: blur(14px);
      pointer-events: none;
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    .gemini-screenshot-toast.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
    
    .gemini-screenshot-toast-icon {
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(168, 85, 247, 0.15);
      border: 1px solid rgba(168, 85, 247, 0.35);
      flex-shrink: 0;
    }

    .gemini-screenshot-toast.success .gemini-screenshot-toast-icon {
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.35);
    }
    
    .gemini-screenshot-toast.error .gemini-screenshot-toast-icon {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.35);
    }
    
    .gemini-screenshot-toast-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .gemini-screenshot-toast-title {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.2px;
      color: #f4f4f5;
    }
    
    .gemini-screenshot-toast-desc {
      font-size: 11px;
      color: #a1a1aa;
    }

    /* Permanently hide Gemini disclaimer / hallucination warning & reclaim screen space */
    hallucination-disclaimer,
    .hallucination-disclaimer,
    [class*="hallucination-disclaimer"],
    .disclaimer-container,
    [data-test-id*="disclaimer"] {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      min-height: 0 !important;
      max-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }

    /* Dynamic Conversation & Chat Width */
    :root {
      --gemini-custom-chat-width: 860px;
    }
    
    html body.gemini-custom-width-enabled .conversation-container,
    html body.gemini-custom-width-enabled model-response,
    html body.gemini-custom-width-enabled user-query,
    html body.gemini-custom-width-enabled .user-query-container,
    html body.gemini-custom-width-enabled response-container,
    html body.gemini-custom-width-enabled .response-container,
    html body.gemini-custom-width-enabled .presented-response-container,
    html body.gemini-custom-width-enabled structured-content-container,
    html body.gemini-custom-width-enabled message-content,
    html body.gemini-custom-width-enabled .markdown-main-panel,
    html body.gemini-custom-width-enabled .input-area-container,
    html body.gemini-custom-width-enabled [data-test-id="chat-input-container"],
    html body.gemini-custom-width-enabled .chat-input-container,
    html body.gemini-custom-width-enabled .bottom-container,
    html body.gemini-custom-width-enabled .bottom-container > div,
    html body.gemini-custom-width-enabled #chat-history .conversation-container,
    html body.gemini-custom-width-enabled .chat-history .conversation-container,
    html body.gemini-custom-width-enabled .chat-history-scroll-container .conversation-container,
    html body.gemini-custom-width-enabled .input-area,
    html body.gemini-custom-width-enabled .side-by-side-container,
    html body.gemini-custom-width-enabled [data-test-id="chat-history-container"] > div,
    html body.gemini-custom-width-enabled infinite-scroller > div {
      max-width: var(--gemini-custom-chat-width) !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }
  `;
  document.head.appendChild(style);

  // Show rich floating toast notification
  function showToast(title, desc = '', icon = '📋', type = 'success') {
    const existing = document.querySelector('.gemini-screenshot-toast');
    if (existing) {
      existing.remove();
    }

    const toast = document.createElement('div');
    toast.className = `gemini-screenshot-toast ${type}`;
    toast.innerHTML = `
      <div class="gemini-screenshot-toast-icon">${icon}</div>
      <div class="gemini-screenshot-toast-content">
        <div class="gemini-screenshot-toast-title">${title}</div>
        ${desc ? `<div class="gemini-screenshot-toast-desc">${desc}</div>` : ''}
      </div>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 350);
    }, 2800);
  }

  // Helper function to find scroll parent
  function getScrollParent(node) {
    if (!node) return null;
    let parent = node.parentElement;
    while (parent) {
      if (parent === document.body || parent === document.documentElement) {
        break;
      }
      const style = window.getComputedStyle(parent);
      const overflowY = style.overflowY || style.overflow || '';
      const isScrollable = overflowY.includes('auto') || overflowY.includes('scroll');
      const hasScrollHeight = parent.scrollHeight > parent.clientHeight;
      if (isScrollable && hasScrollHeight) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return document.documentElement;
  }

  // Get current scroll position of container
  function getScrollTop(container) {
    if (container === document.documentElement || container === document.body) {
      return window.scrollY || document.documentElement.scrollTop;
    }
    return container.scrollTop;
  }

  // Set scroll position of container
  function setScrollTop(container, scrollTop) {
    if (container === document.documentElement || container === document.body) {
      window.scrollTo(window.scrollX, scrollTop);
    } else {
      container.scrollTop = scrollTop;
    }
  }

  // Send message to background script for viewport capture
  function sendCaptureMessage() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'CAPTURE_VISIBLE_TAB' }, (response) => {
        resolve(response);
      });
    });
  }

  // Load an image from data URL asynchronously
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  }

  // Fallback function to download canvas as a PNG file
  function downloadCanvasImage(canvas) {
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to convert canvas to PNG blob for download'));
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          const timestamp = new Date().toISOString().slice(0, 19).replace(/T|:/g, '-');
          a.download = `gemini-screenshot-${timestamp}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          resolve();
        }, 'image/png');
      } catch (err) {
        reject(err);
      }
    });
  }

  // Helper to find disclaimer warning elements by text content
  function findDisclaimerElements() {
    const elements = [];
    try {
      const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while (node = walk.nextNode()) {
        const text = node.textContent;
        if (text && (text.includes('Gemini is AI') || text.includes('Gemini may display') || text.includes('can make mistakes'))) {
          let parent = node.parentElement;
          if (parent && parent.tagName.toLowerCase() !== 'body') {
            elements.push(parent);
          }
        }
      }
    } catch (e) {
      console.warn('[Gemini Screenshot] Disclaimer walker failed:', e);
    }
    return elements;
  }

  // Main capture, scroll, and stitch logic
  async function handleScreenshot(card, btn, container) {
    if (btn.disabled) return;
    
    console.log('🚀 [Step 1/5] Screenshot button clicked on response card');
    
    // Set button to loading state
    btn.disabled = true;
    btn.classList.add('loading');
    btn.innerHTML = '<span class="gemini-screenshot-spinner"></span> Capturing...';
    
    const scrollContainer = getScrollParent(card);
    const initialScrollTop = getScrollTop(scrollContainer);
    
    // Hide the button container immediately to prevent it from rendering in the screenshot
    container.style.display = 'none';
    
    // Disable smooth scroll temporarily for precise and instant layout alignment
    const originalScrollBehavior = scrollContainer.style.scrollBehavior;
    scrollContainer.style.setProperty('scroll-behavior', 'auto', 'important');
    const originalDocScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.setProperty('scroll-behavior', 'auto', 'important');
    const originalBodyScrollBehavior = document.body.style.scrollBehavior;
    document.body.style.setProperty('scroll-behavior', 'auto', 'important');
    
    const hiddenElements = [];
    const styleId = 'gemini-screenshot-hide-overlay';
    
    try {
      // Find all top/bottom overlay/fixed elements that should be hidden
      const bottomSelectors = [
        'input-container',
        '[data-test-id="chat-input-container"]',
        'footer',
        '.input-area-container',
        '.input-gradient',
        '.edge-to-edge',
        '.chat-input',
        'header',
        '.top-nav',
        '.navigation-bar',
        'div[class*="header"]',
        'div[class*="nav"]',
        'div[class*="disclaimer"]',
        'p[class*="disclaimer"]',
        'span[class*="disclaimer"]'
      ];
      
      const elementsToHide = [];
      bottomSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          if (el && el.offsetWidth > 0 && el.offsetHeight > 0 && !card.contains(el) && !el.contains(card)) {
            elementsToHide.push(el);
          }
        });
      });
      
      findDisclaimerElements().forEach(el => {
        if (!card.contains(el) && !el.contains(card) && !elementsToHide.includes(el)) {
          elementsToHide.push(el);
        }
      });
      
      // Find other fixed/sticky elements
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        if (el.offsetWidth === 0 && el.offsetHeight === 0) continue;
        if (elementsToHide.includes(el)) continue;
        
        try {
          const style = window.getComputedStyle(el);
          if ((style.position === 'fixed' || style.position === 'sticky') &&
              !card.contains(el) && 
              el !== card && 
              !el.contains(card)) {
            elementsToHide.push(el);
          }
        } catch (e) {
          // Ignore styling errors on inaccessible nodes
        }
      }
      
      // Add the temporary class to hide elements via style tag injection
      elementsToHide.forEach(el => {
        el.classList.add('gemini-screenshot-hide-temp');
        hiddenElements.push(el);
      });
      console.log(`[Gemini Screenshot] Tagged ${hiddenElements.length} elements for hiding.`);
      
      // Step 1: Inject stylesheet in head
      const hideStyle = document.createElement('style');
      hideStyle.id = styleId;
      hideStyle.textContent = `
        .gemini-screenshot-hide-temp {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }
      `;
      document.head.appendChild(hideStyle);
      
      // Step 2: Delay for 50ms to allow layout/repaint without overlays
      await new Promise(resolve => setTimeout(resolve, 50));
      console.log('[Gemini Screenshot] Stylesheet injected, page repainted.');

      console.log('📜 [Step 2/5] Auto-scrolling target into view...');
      
      const scale = window.devicePixelRatio || 1;
      let rect = card.getBoundingClientRect();
      
      // Ensure we draw the FULL scrollHeight of the response element so nothing is cut off
      const width = Math.max(rect.width, card.scrollWidth, card.offsetWidth);
      const totalH = Math.max(rect.height, card.scrollHeight, card.offsetHeight);
      
      if (width <= 0 || totalH <= 0) {
        throw new Error('Element is not visible or has zero size.');
      }
      
      // Get the computed background color of the card
      const computedCardStyle = window.getComputedStyle(card);
      const bgColor = computedCardStyle.backgroundColor || '#131314';
      const padTop = 16 * scale;
      
      let canvas;
      let ctx;
      
      const viewportHeight = window.innerHeight;
      let currentOffset = 0;

      // Single-Snapshot Shortcut: If card fits entirely in viewport, skip scroll loop
      if (totalH <= viewportHeight) {
        console.log('[Gemini Screenshot] Card fits within viewport. Using single-snapshot shortcut...');
        card.scrollIntoView({ block: 'center' });
        await new Promise(resolve => setTimeout(resolve, 250)); // Wait for layout to settle
        
        rect = card.getBoundingClientRect();
        const topOffset = Math.max(0, Math.min(16, rect.top));
        const topCanvasPadding = Math.floor(topOffset * scale);
        
        canvas = document.createElement('canvas');
        canvas.width = Math.floor(width * scale);
        canvas.height = Math.floor(totalH * scale) + topCanvasPadding;
        ctx = canvas.getContext('2d');
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const response = await sendCaptureMessage();
        if (!response || response.error) {
          throw new Error(response ? response.error : 'Capture response was empty');
        }
        
        const img = await loadImage(response.dataUrl);
        const imgW = img.width;
        const imgH = img.height;
        
        const sy_val = Math.max(0, rect.top - 16);
        const actualTopPadding = rect.top - sy_val;
        
        const sx = Math.max(0, Math.min(imgW - 1, Math.floor(rect.left * scale)));
        const sy = Math.max(0, Math.min(imgH - 1, Math.floor(sy_val * scale)));
        const sw = Math.max(1, Math.min(imgW - sx, Math.floor(width * scale)));
        const sh = Math.max(1, Math.min(imgH - sy, Math.floor((totalH + actualTopPadding) * scale)));
        
        if (sw > 0 && sh > 0) {
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        }
        
        // Skip scroll loop by setting currentOffset to totalH
        currentOffset = totalH;
      } else {
        // Run scroll-and-stitch flow
        console.log('[Gemini Screenshot] Card is taller than viewport. Running scroll-and-stitch loop...');
        
        // Align card top to the top of the container
        card.scrollIntoView({ block: 'start' });
        await new Promise(resolve => setTimeout(resolve, 250)); // Wait for smooth scroll/repaint
        
        const cardStartScrollTop = getScrollTop(scrollContainer);
        rect = card.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
        
        // Calculate safe crop boundaries in the viewport
        const clipTop = Math.max(0, containerRect.top);
        const clipBottom = Math.min(window.innerHeight, containerRect.bottom);
        
        canvas = document.createElement('canvas');
        canvas.width = Math.floor(width * scale);
        canvas.height = Math.floor(totalH * scale) + padTop;
        ctx = canvas.getContext('2d');
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        let targetY = 0;
        
        // Sub-function to capture and draw a slice of the card to the canvas
        async function captureAndDrawSlice(sliceH, y, currRect, offset, destY) {
          console.log(`📸 [Step 3/5] Requesting GPU viewport snapshot from background (offset: ${offset}px)...`);
          const response = await sendCaptureMessage();
          if (!response || response.error) {
            throw new Error(response ? response.error : 'Capture response was empty');
          }
          
          const img = await loadImage(response.dataUrl);
          const imgW = img.width;
          const imgH = img.height;
          
          // Compute source coords in physical pixels, clipping to capture boundaries
          const sx = Math.max(0, Math.min(imgW - 1, Math.floor(currRect.left * scale)));
          const sy = Math.max(0, Math.min(imgH - 1, Math.floor(y * scale)));
          const sw = Math.max(1, Math.min(imgW - sx, Math.floor(width * scale)));
          const sh = Math.max(1, Math.min(imgH - sy, Math.floor(sliceH * scale)));
          
          // Destination Y is shifted by top padding offset
          const dx = 0;
          const dy = Math.floor(destY * scale) + padTop;
          const dw = Math.floor(width * scale);
          const dh = Math.floor(sliceH * scale);
          
          console.log(`🎨 [Step 4/5] Stitching captured frame onto Canvas (destination Y: ${dy / scale}px, height: ${dh / scale}px)...`);
          if (sw > 0 && sh > 0 && dw > 0 && dh > 0) {
            ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
          }
        }
        
        // 3. Sequential scroll-and-capture loop using absolute target element offsets
        while (targetY < totalH) {
          // Scroll container to align uncaptured section at top of container:
          setScrollTop(scrollContainer, cardStartScrollTop + targetY);
          await new Promise(resolve => setTimeout(resolve, 60)); // Wait 60ms for GPU repaint
          
          const currentRect = card.getBoundingClientRect();
          const currentContainerRect = scrollContainer.getBoundingClientRect();
          const currentClipTop = Math.max(0, currentContainerRect.top);
          const currentClipBottom = Math.min(window.innerHeight, currentContainerRect.bottom);
          
          // Viewport Y coordinate where the uncaptured target segment starts
          const viewportY = currentRect.top + targetY;
          
          // Crop starts at viewportY (clamped to the visible top of the container)
          const sy_viewport = Math.max(currentClipTop, viewportY);
          
          // Calculate the corresponding offset on the card:
          const cardOffset = sy_viewport - currentRect.top;
          
          // Visible height to crop inside the container's visible area:
          const visibleH = Math.min(totalH - cardOffset, currentClipBottom - sy_viewport);
          
          if (visibleH <= 0) {
            break; // Break out if no visible content remains
          }
          
          await captureAndDrawSlice(visibleH, sy_viewport, currentRect, targetY, cardOffset);
          
          // Increment offsets
          targetY = cardOffset + visibleH;
        }
        
        // Set currentOffset to totalH to bypass final copy check in outer logic
        currentOffset = totalH;
      }
      
      // 4. Copy final canvas to Clipboard, with download fallback if clipboard write fails
      console.log('📋 [Step 5/5] Copying final PNG Blob to Clipboard...');
      let isDownloaded = false;
      try {
        window.focus(); // Ensure the window is focused for the Clipboard API
        
        const copyResult = await new Promise((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to convert canvas to PNG blob'));
              return;
            }
            const item = new ClipboardItem({ 'image/png': blob });
            navigator.clipboard.write([item])
              .then(() => {
                console.log('[Gemini Screenshot] Successfully copied stitched image to clipboard!');
                resolve({ copied: true });
              })
              .catch((clipboardError) => {
                console.warn('[Gemini Screenshot] Clipboard write failed/blocked. Trying download fallback...', clipboardError);
                downloadCanvasImage(canvas)
                  .then(() => {
                    console.log('[Gemini Screenshot] Download fallback completed successfully!');
                    resolve({ downloaded: true });
                  })
                  .catch(reject);
              });
          }, 'image/png');
        });
        
        isDownloaded = copyResult.downloaded;
      } catch (clipboardOrDownloadError) {
        throw clipboardOrDownloadError;
      }
      
      // Apply success styling based on outcome
      btn.classList.add('success');
      if (isDownloaded) {
        btn.innerHTML = '💾 Downloaded!';
        showToast('Screenshot Downloaded!', 'Saved PNG to your Downloads folder', '💾', 'success');
      } else {
        btn.innerHTML = '✅ Copied!';
        showToast('Copied to Clipboard!', 'Ready to paste anywhere (Ctrl + V)', '📋', 'success');
      }
    } catch (err) {
      console.error('[Gemini Screenshot Error]', err);
      btn.classList.add('error');
      btn.innerHTML = '❌ Error';
      showToast('Capture Failed', err.message || 'Could not take screenshot', '❌', 'error');
    } finally {
      // Step 3: Cleanup Style Tag & Classes
      const injectedStyle = document.getElementById(styleId);
      if (injectedStyle) {
        injectedStyle.remove();
      }
      hiddenElements.forEach(el => {
        try {
          el.classList.remove('gemini-screenshot-hide-temp');
        } catch (e) {
          // Ignore
        }
      });
      console.log(`[Gemini Screenshot] Cleaned up style tag and restored original styles to ${hiddenElements.length} elements.`);

      // Restore scroll behavior settings
      scrollContainer.style.scrollBehavior = originalScrollBehavior;
      document.documentElement.style.scrollBehavior = originalDocScrollBehavior;
      document.body.style.scrollBehavior = originalBodyScrollBehavior;

      // Restore initial state: scroll position and button display
      setScrollTop(scrollContainer, initialScrollTop);
      container.style.display = '';
      
      // Reset button layout and enable after 3 seconds
      setTimeout(() => {
        btn.classList.remove('success', 'error', 'loading');
        btn.disabled = false;
        if (btn.classList.contains('gemini-screenshot-btn-full')) {
          btn.innerHTML = '<span>📸</span> Full';
        } else {
          btn.innerHTML = '<span>🎯</span> Select';
        }
      }, 3000);
    }
  }

  // Active selection state variables
  let isSelectionMode = false;
  let activeCardForSelection = null;
  let lastHoveredElement = null;
  let activeSelectionBtn = null;
  let activeSelectionBtnContainer = null;

  function enterSelectionMode(card, btn, container) {
    if (isSelectionMode) {
      exitSelectionMode();
    }
    
    isSelectionMode = true;
    activeCardForSelection = card;
    activeSelectionBtn = btn;
    activeSelectionBtnContainer = container;
    
    // Change button state to Selecting
    btn.disabled = true;
    btn.innerHTML = '<span>🎯</span> Selecting...';
    
    // Create and display selection banner
    const banner = document.createElement('div');
    banner.id = 'gemini-screenshot-selection-banner';
    banner.innerHTML = '<span>🎯</span> Hover & click any paragraph, list, table or code block (Esc to exit)';
    document.body.appendChild(banner);
    
    // Add selecting mode cursor class to body
    document.body.classList.add('gemini-screenshot-selecting-mode');
    
    // Bind selection event listeners
    card.addEventListener('mousemove', handleMouseMoveSelection);
    card.addEventListener('click', handleClickSelection, true); // Capture phase to prevent defaults
    document.addEventListener('keydown', handleEscKeySelection);
  }

  function exitSelectionMode() {
    if (!isSelectionMode) return;
    
    isSelectionMode = false;
    
    // Clean up hover class
    if (lastHoveredElement) {
      lastHoveredElement.classList.remove('gemini-screenshot-selectable-hover');
      lastHoveredElement = null;
    }
    
    // Clean up banner
    const banner = document.getElementById('gemini-screenshot-selection-banner');
    if (banner) banner.remove();
    
    // Restore body classes
    document.body.classList.remove('gemini-screenshot-selecting-mode');
    
    // Restore button styling
    if (activeSelectionBtn) {
      activeSelectionBtn.disabled = false;
      activeSelectionBtn.innerHTML = '<span>🎯</span> Select';
    }
    
    // Unbind listeners
    if (activeCardForSelection) {
      activeCardForSelection.removeEventListener('mousemove', handleMouseMoveSelection);
      activeCardForSelection.removeEventListener('click', handleClickSelection, true);
    }
    document.removeEventListener('keydown', handleEscKeySelection);
    
    activeCardForSelection = null;
    activeSelectionBtn = null;
    activeSelectionBtnContainer = null;
  }

  function getSelectableTarget(el) {
    if (!el || !activeCardForSelection || activeCardForSelection.contains(el) === false) return null;
    if (el.closest('.gemini-screenshot-btn-container')) return null;
    
    // Walk up to find a content-bearing element inside the card
    let target = el;
    while (target && target !== activeCardForSelection) {
      const tag = target.tagName.toLowerCase();
      // If it is a known content block or block child tag
      if (['p', 'li', 'ul', 'ol', 'pre', 'code', 'table', 'tr', 'td', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'span', 'strong', 'em'].includes(tag)) {
        return target;
      }
      
      // If it is a div, make sure it does not wrap large block layouts (leaf-level container)
      if (tag === 'div') {
        const childTags = Array.from(target.children).map(c => c.tagName.toLowerCase());
        const hasBlockChildren = childTags.some(t => ['div', 'p', 'ul', 'ol', 'pre', 'table'].includes(t));
        if (!hasBlockChildren) {
          return target;
        }
      }
      
      target = target.parentElement;
    }
    
    return null;
  }

  function handleMouseMoveSelection(e) {
    if (!isSelectionMode || !activeCardForSelection) return;
    
    const target = getSelectableTarget(e.target);
    
    if (target !== lastHoveredElement) {
      if (lastHoveredElement) {
        lastHoveredElement.classList.remove('gemini-screenshot-selectable-hover');
      }
      if (target) {
        target.classList.add('gemini-screenshot-selectable-hover');
      }
      lastHoveredElement = target;
    }
  }

  async function handleClickSelection(e) {
    if (!isSelectionMode || !activeCardForSelection) return;
    
    const target = getSelectableTarget(e.target);
    if (!target) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const selectedEl = target;
    const btn = activeSelectionBtn;
    const container = activeSelectionBtnContainer;
    
    // Exit selection mode first
    exitSelectionMode();
    
    // Screenshot target element
    await handleScreenshot(selectedEl, btn, container);
  }

  function handleEscKeySelection(e) {
    if (e.key === 'Escape') {
      exitSelectionMode();
    }
  }

  // Inject screenshot buttons into response card nodes
  function injectButton(card) {
    if (card.querySelector('.gemini-screenshot-btn-container')) {
      return;
    }
    
    const container = document.createElement('div');
    container.className = 'gemini-screenshot-btn-container';
    
    const trigger = document.createElement('div');
    trigger.className = 'gemini-screenshot-btn-trigger';
    trigger.innerHTML = '📸';
    trigger.title = 'Response Screenshot Options';
    
    const menu = document.createElement('div');
    menu.className = 'gemini-screenshot-btn-menu';
    
    const btnFull = document.createElement('button');
    btnFull.className = 'gemini-screenshot-btn gemini-screenshot-btn-full';
    btnFull.innerHTML = '<span>📸</span> Full';
    btnFull.title = 'Copy screenshot of entire response card';
    btnFull.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();
      await handleScreenshot(card, btnFull, container);
    });
    
    const btnSelect = document.createElement('button');
    btnSelect.className = 'gemini-screenshot-btn gemini-screenshot-btn-select';
    btnSelect.innerHTML = '<span>🎯</span> Select';
    btnSelect.title = 'Hover and select specific element to copy';
    btnSelect.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      enterSelectionMode(card, btnSelect, container);
    });
    
    menu.appendChild(btnFull);
    menu.appendChild(btnSelect);
    
    container.appendChild(trigger);
    container.appendChild(menu);
    card.appendChild(container);
  }

  // Helper to remove hallucination disclaimers dynamically
  function removeDisclaimers() {
    document.querySelectorAll('hallucination-disclaimer, .hallucination-disclaimer, [class*="hallucination-disclaimer"]').forEach(el => {
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('height', '0px', 'important');
      el.style.setProperty('margin', '0px', 'important');
      el.style.setProperty('padding', '0px', 'important');
    });
  }

  // Chat Width Controller Logic (controlled via Extension Toolbar Popup)
  const STORAGE_KEY_WIDTH = 'gemini_chat_width_pref';
  let currentWidthSetting = 'default';

  function applyChatWidth(widthVal) {
    currentWidthSetting = widthVal || 'default';
    try {
      localStorage.setItem(STORAGE_KEY_WIDTH, currentWidthSetting);
    } catch (e) {}

    if (currentWidthSetting === 'default') {
      document.body.classList.remove('gemini-custom-width-enabled');
      document.documentElement.style.removeProperty('--gemini-custom-chat-width');
    } else {
      document.body.classList.add('gemini-custom-width-enabled');
      document.documentElement.style.setProperty('--gemini-custom-chat-width', currentWidthSetting);
    }
  }

  // Load saved width from chrome.storage or localStorage
  function loadSavedWidth() {
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([STORAGE_KEY_WIDTH], (res) => {
        const saved = res[STORAGE_KEY_WIDTH] || localStorage.getItem(STORAGE_KEY_WIDTH) || 'default';
        applyChatWidth(saved);
      });
    } else {
      const saved = localStorage.getItem(STORAGE_KEY_WIDTH) || 'default';
      applyChatWidth(saved);
    }
  }

  // Listen for real-time width updates from the Extension Popup
  if (chrome && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.action === 'SET_CHAT_WIDTH') {
        applyChatWidth(msg.width);
        sendResponse({ status: 'ok', appliedWidth: msg.width });
      } else if (msg.action === 'GET_CHAT_WIDTH') {
        sendResponse({ width: currentWidthSetting });
      }
    });
  }

  // Detect and inject cards
  function initObserver() {
    // Clean up disclaimers on load
    removeDisclaimers();

    // Load and apply initial width preference
    loadSavedWidth();

    // Inject into existing cards
    const cards = document.querySelectorAll('model-response');
    cards.forEach(card => injectButton(card));
    
    // Inject into dynamically loaded cards and hide new disclaimers
    const observer = new MutationObserver((mutations) => {
      removeDisclaimers();
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName.toLowerCase() === 'model-response') {
              injectButton(node);
            } else {
              const cards = node.querySelectorAll('model-response');
              cards.forEach(card => injectButton(card));
            }
          }
        }
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initObserver);
  } else {
    initObserver();
  }
})();
