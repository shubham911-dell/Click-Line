# Word Snap Selector — Chrome Extension

**Developer:** Shubham Dhakal  
**Version:** 3.2

Word Snap Selector is a Chrome extension that makes text selection and copying feel precise and fast. It also adds a universal “chat enter” behavior that you can control globally, per-site, and per-page.

---

## 🚀 Features

- Snap selection to whole words, even in complex contentEditable areas
- Multi-selections with buttery-smooth highlights
- **Alt+Drag** on a link to copy its URL
- Customizable chat enter behavior:
  - **Enter = new line**
  - **Shift+Enter = send** (smart detection and per-site/page rules)
- Visual selection preview

---

## ✨ Highlights

- **Intelligent Snap-to-Word Selection** (works everywhere)
- **Multi-selection** with `Ctrl+Drag`, smooth overlays via CSS Custom Highlight API (fallback supported)
- **Readable Highlights**: translucent overlays, no text masking
- **Click to Clear** selections (unless locked)
- **Undo/Redo**: `Ctrl+Z` / `Ctrl+Y` (outside inputs only)
- **Alt+Drag Link Copy** with visual toast feedback
- **Chat Enter Override**:
  - **Global**: Enter = new line, Shift+Enter = send
  - **Auto mode**: smartly flips only sites that use Enter=send
  - **Force mode**: applies everywhere (except code editors)
  - **Per-site and per-page rules**
  - **ChatGPT Special Handling**: true breaks, fixes Enter-space bugs

---

## ⚙️ How It Works (Under the Hood)

### Selection
- **Word snapping**: expands to nearest word boundaries (regex configurable)
- **Multi-selection**: `Ctrl+Drag` to add multiple ranges
- **Highlights**: CSS Custom Highlight API or overlay fallback

### Link Copy
- **Alt+Drag**: searches for nearest `<a href>` upward and copies it

### Chat Enter Mapping
- Handled at **capture-phase keydown**
- **Auto mode detection**:
  - `enterkeyhint="send"`, `go`, `search`
  - Helper text: “Shift+Enter to add a new line,” “Enter to send”
  - Nearby send-like buttons
- **ChatGPT** domains assumed Enter=send
- Special case: inserts `<br>` or paragraph and fixes normalized spaces
- **Code editors** (Monaco, CodeMirror, Ace) are excluded

---

## 📥 Installation

### From Chrome Web Store
- Visit the Web Store (coming soon)
- Click **Add to Chrome** and confirm

### Manual Installation
1. Clone/download this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer Mode**
4. Click **Load unpacked**, select the extension folder

---

## 🧑‍💻 Usage

### Selection & Copy
- **Normal selection**: drag to snap to whole words
- **Multi-selection**: `Ctrl+Drag` for more ranges
- **Copy combined**: `Ctrl+C`
- **Clear selections**: click anywhere (unless locked)

### Link Copy
- **Alt+Drag** across a link copies its URL
- Visual confirmation shown

### Lock & Undo/Redo
- **Toggle Lock**: `Ctrl+Shift+L`
- **Undo**: `Ctrl+Z`
- **Redo**: `Ctrl+Y` / `Ctrl+Shift+Z`

### Chat Enter Behavior
- **Default**: Enter = new line, Shift+Enter = send
- **Global Toggle & Mode** in popup:
  - **Auto**: flips only “Enter=send” sites
  - **Force**: apply everywhere (except code editors)
- **Per-site and per-page rules**
  - Overrides global behavior (Page > Site > Global)
- **ChatGPT**: true new lines, Shift+Enter sends (space bug fixed)

---

## 🧩 Popup Settings (Controls Explained)

### Extension Settings
- **Enable Extension**
- **Word Characters (Regex)**: define what counts as a word (default: `\w-`)
- **Highlight Color**
- **Copy Separator**: (newline, space, bullet, etc.)
- **Enable Alt+Drag Link Copy**
- **Enable Multi-Selection Mode (Ctrl)**

### Chat Enter Behavior
- **Enable Enter Override**
- **Global Mode**:
  - **Auto**
  - **Force ON**
- **Current Site**:
  - Follow Global (default)
  - Force ON / OFF
- **Current Page**:
  - Follow Site/Global (default)
  - Force ON / OFF

> Changes apply **instantly** to all tabs — no reload needed.

---

## ⌨️ Keyboard Shortcuts (Quick Reference)

| Shortcut         | Action                                 |
|------------------|----------------------------------------|
| `Ctrl+Drag`      | Add word-snapped range                 |
| `Ctrl+C`         | Copy multi-selections                  |
| `Ctrl+Z / Y`     | Undo / Redo selections                 |
| `Ctrl+Shift+L`   | Toggle Lock                            |
| `Alt+Drag`       | Copy link URL                          |

---

## 🛠️ Configuration Details

### Regex: Word Characters
- **Default**: `\w\-`
  - `\w`: letters, digits, underscore
  - `\-`: hyphen
- **Customizable**: include `#@$’`, etc.

### Highlights
- Uses **Highlights API** (fast, clean)
- Fallback: overlay divs
- Translucent overlays for readability

### Chat Enter Mapping Order
1. Page rule: ON → apply
2. Site rule: ON → apply
3. Global OFF → skip
4. Global ON:
   - Force → apply
   - Auto → apply if site is “Enter=send”

---

## 🔐 Permissions

- `storage`: save settings, site/page rules
- `clipboardWrite`: enable copying
- `contextMenus`: for right-click options
- `scripting`, `activeTab`, `host_permissions <all_urls>`: inject and work across sites

> ✅ All processing is **local** — no browsing data sent externally.

---

## 💻 Compatibility

- **Browsers**: Chrome (latest)
- **Platforms**: Windows, macOS, Linux, ChromeOS
- Works in iframes and complex layouts
- Excludes **code editors**
- ⚠️ Limitation: No multi-selection inside `<input>` / `<textarea>`

---

## 🧯 Troubleshooting

### ChatGPT: Enter sends or adds space?
- Enable global Enter override
- Set ChatGPT site rule to **Force ON**
- Disable other extensions temporarily

### Site flips when it shouldn't?
- Set site/page rule to **Force OFF**
- Or switch global mode to **Auto**

### Multi-select not copying?
- Use `Ctrl+Drag` to add ranges, `Ctrl+C` to copy
- Check **Copy Separator** setting

### Highlights don’t scroll?
- Reload the page
- If still broken, report the site (virtual DOM issue)

### Reset Rules
- Set site rule to **Follow global**
- Set page rule to **Follow site/global**

---

## 📦 Changelog

### v3.2
- 🔧 New: Global Enter override (Auto/Force)
- 🧠 New: Per-site & per-page rules
- 💬 New: ChatGPT newline fix
- ⚡ Improved: Multi-selection performance
- 📝 Improved: Text readability over highlights
- 🐞 Bug fixes and stability

### v3.1
- ✅ Snap-to-Word selection
- 🔁 Multi-selection
- 🔗 Alt+drag link copy
- 🧩 Basic settings and storage

---

## 📬 Support

**Email:** [shubhamdhakal01@gmail.com](mailto:shubhamdhakal01@gmail.com)

---

## 👨‍💻 About the Developer

Shubham Dhakal builds user-focused web tools and Chrome extensions.

**Connect on LinkedIn**:  
[https://www.linkedin.com/in/shubham-dhakal-b4bb21279](https://www.linkedin.com/in/shubham-dhakal-b4bb21279)

---
