// ============================================================
// App Store Region Pilot - content.js
// 在 apps.apple.com 页面注入二维码，方便手机扫描打开
// ============================================================

(function () {
  'use strict';

  const PANEL_ID = 'region-pilot-qrcode-panel';

  // 初始化
  chrome.storage.local.get(['showQRCode'], (result) => {
    if (result.showQRCode !== false) {
      initQRCode();
    }
  });

  // 监听开关实时变化（storage + messaging）
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.showQRCode) {
      changes.showQRCode.newValue ? initQRCode() : removeQRCode();
    }
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'QR_CODE_CHANGED') {
      msg.enabled ? initQRCode() : removeQRCode();
    }
  });

  function initQRCode() {
    if (document.getElementById(PANEL_ID)) return;

    const url = window.location.href;
    const panel = createPanel(url);

    // 尝试定位到 shelf-wrapper 区域，在其内部右侧悬浮
    const shelfWrapper = document.querySelector('section[data-test-id="shelf-wrapper"]');
    if (shelfWrapper) {
      // 确保 shelf-wrapper 是 relative 定位，以便内部 absolute 定位
      const computed = getComputedStyle(shelfWrapper);
      if (computed.position === 'static') {
        shelfWrapper.style.position = 'relative';
      }
      shelfWrapper.appendChild(panel);
    } else {
      // fallback: 右下角固定定位
      panel.style.position = 'fixed';
      panel.style.bottom = '24px';
      panel.style.right = '24px';
      document.body.appendChild(panel);
    }
  }

  function removeQRCode() {
    const el = document.getElementById(PANEL_ID);
    if (el) el.remove();
  }

  function createPanel(url) {
    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 2147483647;
      background: #fff;
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 16px;
      padding: 16px 16px 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
      transition: opacity 0.2s, transform 0.2s;
      width: fit-content;
      pointer-events: auto;
    `;

    // 二维码图片（优先使用草料二维码 API，国内访问更快）
    const qrUrl = 'https://api.2dcode.biz/v1/create-qr-code?data=' + encodeURIComponent(url);
    const img = document.createElement('img');
    img.src = qrUrl;
    img.alt = 'QR Code';
    img.width = 128;
    img.height = 128;
    img.style.cssText = 'display:block;border-radius:8px;';
    img.onerror = () => {
      // fallback: 使用 qrserver API
      img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=10&data=' + encodeURIComponent(url);
    };

    // 标签
    const label = document.createElement('div');
    label.textContent = '手机扫码打开';
    label.style.cssText = 'font-size:11px;color:#8e8e93;margin-top:8px;letter-spacing:0.3px;';

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
      position: absolute;
      top: 6px;
      right: 8px;
      width: 20px;
      height: 20px;
      border: none;
      background: transparent;
      color: #c7c7cc;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.15s;
    `;
    closeBtn.onmouseenter = () => { closeBtn.style.background = '#f2f2f7'; };
    closeBtn.onmouseleave = () => { closeBtn.style.background = 'transparent'; };
    closeBtn.onclick = () => {
      panel.style.opacity = '0';
      panel.style.transform = 'scale(0.9)';
      setTimeout(() => panel.remove(), 200);
    };

    panel.appendChild(closeBtn);
    panel.appendChild(img);
    panel.appendChild(label);

    return panel;
  }
})();
