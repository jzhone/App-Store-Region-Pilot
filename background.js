// ============================================================
// App Store Region Pilot - background.js v3
// ============================================================
// 两种模式：
//   - "redirect": 外区链接自动跳转到中国区（默认）
//   - "passthrough": 不做任何URL改写，原样访问（配合代理使用）

let state = {
  mode: "redirect",      // "redirect" | "passthrough"
  effectiveMode: "redirect",
  showQRCode: true,      // 是否显示页面二维码
  status: "active"
};

// ============================================================
// 初始化
// ============================================================
chrome.runtime.onInstalled.addListener(async () => {
  await init();
});

chrome.runtime.onStartup.addListener(async () => {
  await init();
});

async function init() {
  const stored = await chrome.storage.local.get(["mode", "showQRCode"]);
  state.mode = stored.mode || "redirect";
  state.effectiveMode = state.mode;
  state.showQRCode = stored.showQRCode !== false; // 默认 true

  if (state.mode === "redirect") {
    await applyRedirectRules("cn");
  } else {
    await clearRules();
  }

  state.status = "active";
}

// ============================================================
// 规则引擎
// ============================================================

async function clearRules() {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingIds = existingRules.map(r => r.id);
  if (existingIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingIds,
      addRules: []
    });
  }
  console.log("[RegionPilot] Rules cleared (passthrough mode)");
}

async function applyRedirectRules(region) {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingIds = existingRules.map(r => r.id);

  const newRules = [];

  // 规则1: 已有任意非目标区域前缀（两字母代码）→ 替换为目标区域
  // 匹配如 /in/ /us/ /jp/ /gb/ 等所有两字母地区代码，除了目标 region
  newRules.push({
    id: 1,
    priority: 10,
    action: {
      type: "redirect",
      redirect: {
        regexSubstitution: `https://apps.apple.com/${region}/\\1`
      }
    },
    condition: {
      regexFilter: `^https://apps\\.apple\\.com/(?!${region}/)[a-z]{2}/(.*)`,
      resourceTypes: ["main_frame"]
    }
  });

  // 规则2~N: 无区域前缀 → 插入目标区域
  const pathPrefixes = [
    "app", "story", "genre", "search", "developer",
    "music", "podcast", "book", "movie", "tv-show",
    "artist", "instructor", "activity"
  ];

  pathPrefixes.forEach((prefix, idx) => {
    newRules.push({
      id: 10 + idx,
      priority: 5,
      action: {
        type: "redirect",
        redirect: {
          regexSubstitution: `https://apps.apple.com/${region}/${prefix}/\\1`
        }
      },
      condition: {
        regexFilter: `^https://apps\\.apple\\.com/${prefix}/(.*)`,
        resourceTypes: ["main_frame"]
      }
    });
  });

  console.log(`[RegionPilot] Applying redirect rules for region: ${region} (${newRules.length} rules)`);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingIds.length > 0 ? existingIds : Array.from({ length: 30 }, (_, i) => i + 1),
    addRules: newRules
  });
}

// ============================================================
// 消息通信
// ============================================================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleMessage(msg).then(sendResponse).catch(err => {
    sendResponse({ error: err.message });
  });
  return true;
});

async function notifyContentScripts(message) {
  try {
    const tabs = await chrome.tabs.query({ url: "https://apps.apple.com/*" });
    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, message);
      } catch (e) {
        // 忽略未加载 content script 的标签页
      }
    }
  } catch (e) {
    console.error("[RegionPilot] Failed to notify content scripts:", e);
  }
}

async function handleMessage(msg) {
  switch (msg.type) {
    case "GET_STATE":
      return { ...state };

    case "SET_MODE":
      state.mode = msg.mode;
      state.effectiveMode = msg.mode;
      await chrome.storage.local.set({ mode: state.mode });

      if (msg.mode === "redirect") {
        await applyRedirectRules("cn");
      } else {
        await clearRules();
      }
      return { ...state };

    case "SET_QR_CODE":
      state.showQRCode = msg.enabled;
      await chrome.storage.local.set({ showQRCode: msg.enabled });
      // 通知所有 content scripts 更新
      await notifyContentScripts({ type: "QR_CODE_CHANGED", enabled: msg.enabled });
      return { ...state };

    default:
      return { error: "Unknown message type" };
  }
}
