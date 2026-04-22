// ============================================================
// App Store Region Pilot - popup.js v4
// ============================================================

const modeBtns = document.querySelectorAll(".mode-btn");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const activeRegion = document.getElementById("activeRegion");
const passthroughHint = document.getElementById("passthroughHint");
const qrToggle = document.getElementById("qrToggle");

// ---- 渲染状态 ----
function renderState(state) {
  if (!state) return;

  // 状态指示灯
  statusDot.className = "status-dot active";
  const effective = state.effectiveMode || state.mode;
  statusText.textContent = effective === "redirect" ? "已激活 · 跳转到中国区" : "已激活 · 不跳转";

  // 高亮当前模式按钮
  modeBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === state.mode);
  });

  // 提示和状态文字
  if (effective === "passthrough") {
    passthroughHint.style.display = "block";
    activeRegion.textContent = "不跳转，保持原样";
  } else {
    passthroughHint.style.display = "none";
    activeRegion.textContent = "跳转到中国区";
  }

  // 二维码开关
  if (qrToggle) {
    qrToggle.checked = state.showQRCode !== false;
  }
}

// ---- 获取初始状态 ----
chrome.runtime.sendMessage({ type: "GET_STATE" }, (state) => {
  renderState(state);
});

// ---- 模式切换 ----
modeBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    modeBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    chrome.runtime.sendMessage(
      { type: "SET_MODE", mode: btn.dataset.mode },
      (state) => renderState(state)
    );
  });
});

// ---- 二维码开关 ----
if (qrToggle) {
  qrToggle.addEventListener("change", () => {
    const enabled = qrToggle.checked;
    chrome.runtime.sendMessage(
      { type: "SET_QR_CODE", enabled },
      (state) => renderState(state)
    );
  });
}
