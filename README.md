# 📸 Gemini Card Screenshot & Width Helper

A feature-packed, lightweight Chrome Extension designed for **Google Gemini** (`https://gemini.google.com/`). It adds a 1-click GPU-accelerated response screenshot capture with automatic scroll stitching, granular snippet selection mode, instant clipboard copy, dynamic chat width control, and a cleaner interface.

---

## ✨ Features

- 📸 **1-Click Full Response Screenshot**: Captures the entire long Gemini response card seamlessly using viewport scrolling, container bounds clipping, and pixel-perfect delta stitching.
- 🎯 **Granular Element Selection (Snipping Mode)**: Hover over and capture individual paragraphs, list items (`<li>`), tables, or code snippets with glowing purple outlines.
- 📋 **Direct-to-Clipboard & Auto-Download**: Automatically copies captured screenshots to your clipboard so you can paste (`Ctrl + V`) immediately into Discord, Slack, WhatsApp, or image editors.
- 🍞 **Floating Toast Notifications**: Instant visual feedback on clipboard copy and downloads.
- ↔️ **Dynamic Conversation Width Controller**: Easily expand Gemini's narrow default width (860px) to Wide (1100px), Ultra (1400px), Max (1600px), or Full Screen (96vw) using the extension popup menu or smooth custom slider.
- 🚫 **Cleaner Chat Interface**: Automatically hides the bottom AI hallucination disclaimer to reclaim vertical screen space.
- 🎨 **Minimal Hover Trigger**: A compact 32px floating camera icon that expands on hover, preventing button overlay clutter over response headers.

---

## 🚀 Installation Guide

1. Clone or download this repository to your local computer:
   ```bash
   git clone https://github.com/YOUR_USERNAME/gemini-screenshot-extension.git
   ```
2. Open Google Chrome (or Brave / Edge) and navigate to:
   ```text
   chrome://extensions/
   ```
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the `gemini-screenshot-extension` folder.
6. Open [Gemini](https://gemini.google.com/) and start enjoying full-page captures and custom chat widths!

---

## 🛠️ Project Structure

```text
gemini-screenshot-extension/
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── background.js       # Background service worker (GPU viewport capture)
├── content.js          # DOM injector, scroll stitcher, element selector & width CSS
├── generate_icons.py   # High-resolution icon generator
├── manifest.json       # Chrome Manifest V3 configuration
├── popup.html          # Toolbar popup UI (width controls & presets)
├── popup.js            # Toolbar popup script (live tab messaging)
├── .gitignore
└── README.md
```

---

## 📄 License
MIT License. Free to use and modify!
