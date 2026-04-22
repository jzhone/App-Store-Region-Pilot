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

    // 尝试插入到 App Store 页面右侧区域
    insertIntoPage(panel);
  }

  function removeQRCode() {
    const el = document.getElementById(PANEL_ID);
    if (el) el.remove();
  }

  function createPanel(url) {
    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.style.cssText = `
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
      position: relative;
      width: fit-content;
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

  function insertIntoPage(panel) {
    // 策略1: 插入到 shelf-wrapper 区域的右侧
    const shelfWrapper = document.querySelector('section[data-test-id="shelf-wrapper"]');
    if (shelfWrapper) {
      // 检查 shelf-wrapper 内部是否有 container
      const container = shelfWrapper.querySelector('.container');
      if (container) {
        // 在 container 右侧插入，使用 flex 布局
        const parent = shelfWrapper;
        const existingStyle = parent.style.cssText;

        // 确保 parent 是 flex 布局
        if (getComputedStyle(parent).display !== 'flex') {
          parent.style.display = 'flex';
          parent.style.alignItems = 'flex-start';
          parent.style.gap = '20px';
        }

        // 给二维码包一个 wrapper，让它在右侧
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'flex-shrink:0;align-self:flex-start;margin-top:20px;';
        wrapper.appendChild(panel);

        parent.appendChild(wrapper);
        return;
      }
    }

    // 策略2: 插入到页面主内容区右侧
    const mainContent = document.querySelector('main') ||
                        document.querySelector('[role="main"]') ||
                        document.querySelector('.page-content');
    if (mainContent) {
      const parent = mainContent.parentElement;
      if (parent && getComputedStyle(parent).display === 'flex') {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'flex-shrink:0;margin-left:20px;';
        wrapper.appendChild(panel);
        parent.appendChild(wrapper);
        return;
      }
    }

    // 策略3: 固定定位 fallback（右下角）
    panel.style.position = 'fixed';
    panel.style.bottom = '24px';
    panel.style.right = '24px';
    document.body.appendChild(panel);
  }
})();
