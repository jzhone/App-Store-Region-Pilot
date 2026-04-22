# App Store Region Pilot

> A lightweight Chrome extension that keeps Apple App Store web links in the correct region — no more surprise redirects to CN homepage.

一款轻量 Chrome 扩展，解决 Apple App Store 网页链接被自动重定向到中国区的问题。

---

## ✨ Features / 功能

| | English | 中文 |
|---|---|---|
| 🔄 | **Redirect to CN** — Automatically rewrites any foreign-region App Store URL to the China region | **跳转 CN** — 自动将外区 App Store 链接改写为中国区链接 |
| 🔓 | **Pass-through** — Disables all rewrites; use with a proxy/VPN to browse foreign stores directly | **不跳转** — 关闭所有重写规则，配合代理/VPN 可正常浏览外区商店 |

- Zero latency — rewrites happen **before** the request is sent, no page flash  
- No tracking, no remote calls, no analytics  
- Supports all major App Store path types: `app`, `story`, `genre`, `search`, `developer`, `music`, `podcast`, `book`, `movie`, `tv-show`, `artist`, etc.

---

## 📸 Screenshot / 截图

> *(Install and pin the extension to see the popup)*

---

## 🚀 Installation / 安装

### From source (Developer mode) / 源码安装

1. Clone or download this repository  
   克隆或下载本仓库

   ```bash
   git clone https://github.com/YOUR_USERNAME/app-store-region-pilot.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`  
   打开 Chrome，进入 `chrome://extensions/`

3. Enable **Developer mode** (top-right toggle)  
   开启右上角的「开发者模式」

4. Click **Load unpacked** and select the `apple-region-switcher` folder  
   点击「加载已解压的扩展程序」，选择 `apple-region-switcher` 文件夹

5. Pin the extension to your toolbar and you're done 🎉  
   将扩展固定到工具栏，完成 🎉

---

## 🛠 How it works / 工作原理

The extension uses Chrome's **`declarativeNetRequest`** API (Manifest V3) to intercept and rewrite `apps.apple.com` navigation requests **before** they leave the browser:

- **Redirect CN mode**: Replaces any region prefix (e.g. `/us/`, `/jp/`) with `/cn/`, and inserts `/cn/` into region-less URLs.
- **Pass-through mode**: Clears all rewrite rules entirely — the browser behaves as if the extension isn't there.

> **Why can't the extension help me browse foreign stores without a proxy?**  
> Apple's web redirect (302) is server-side and based on your **IP address**. Once Apple's server returns a 302, the browser must follow it — no extension can block that. With a proxy routing `apps.apple.com` traffic through a foreign IP, Pass-through mode works perfectly.

扩展通过 Chrome 的 `declarativeNetRequest` API 在请求**发出前**改写 URL，因此没有任何页面闪烁。
外区跳转的根本原因是 Apple 服务端根据 IP 返回 302，这一步扩展无法干预，需配合代理使用。

---

## 📋 Permissions / 权限说明

| Permission | Reason |
|---|---|
| `storage` | Saves your mode preference across browser sessions / 保存模式设置 |
| `declarativeNetRequest` | Rewrites App Store URLs / 改写请求 URL |
| `declarativeNetRequestWithHostAccess` | Required to apply rules to `apps.apple.com` / 对指定域名应用规则 |
| `host_permissions: apps.apple.com` | Scope limited to App Store only / 仅限 App Store 域名 |

No data is collected or transmitted. The extension works entirely offline.  
本扩展不收集任何数据，完全本地运行。

---

## 🗂 File Structure / 文件结构

```
apple-region-switcher/
├── manifest.json       # Extension manifest (MV3)
├── background.js       # Service worker — rule engine & state
├── popup.html          # Popup UI
├── popup.css           # Popup styles (light theme)
├── popup.js            # Popup interaction logic
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 🔮 Roadmap / 后续计划

- [ ] Support switching to regions other than CN (US, HK, JP…)
- [ ] Auto mode — detect IP and choose mode automatically
- [ ] Chrome Web Store release

---

## 📄 License / 许可证

MIT License — feel free to use, modify, and distribute.

---

## 🙋 FAQ

**Q: Will this work with Safari or Firefox?**  
A: Currently Chrome / Chromium only (Manifest V3). Firefox support is planned.

**Q: Does it slow down my browsing?**  
A: No. `declarativeNetRequest` rules are evaluated natively by the browser engine, not by JavaScript.

**Q: 为什么开启「不跳转」后还是跳到了 CN 首页？**  
A: 这是 Apple 服务器根据你的 IP 发出的 302 跳转，扩展无法阻止。请配合代理工具将 `apps.apple.com` 的流量走境外节点。
