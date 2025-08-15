# Privacy Policy — Click-Line

**Effective date:** 2025-08-15
**Contact:** 1theflow01@gmail.com

Click-Line is a Chrome extension that improves text selection and chat input ergonomics across the web. This policy explains what data the extension handles. In short: the extension does **not** collect, transmit, sell, or share personal data. All processing happens locally in your browser.

---

## Summary
- No personal data is collected or transmitted.  
- No analytics, tracking, or advertising.  
- All features (selection snapping, multi-selection highlights, optional chat Enter behavior, Alt+drag link copy) run locally in your browser.  
- User preferences are stored locally via `chrome.storage.local`.  

---

## Data We Collect
- We do **not** collect personal information.  
- We do **not** send data to external servers.  
- We do **not** use analytics or tracking pixels.  
- We do **not** display ads.  

---

## Local Storage
We use `chrome.storage.local` to save preferences on your device, such as:  
- Enable/disable extension  
- Word Characters (regex fragment) for snapping  
- Selection highlight color  
- Copy separator (e.g., newline or bullet)  
- Alt+drag link copy toggle  
- Multi-selection (Ctrl) toggle  
- Optional Chat Enter behavior toggle and rules (e.g., per-site/page)  

> This data remains on your device unless you remove it (e.g., clearing extension data) or synchronize via your browser profile.

---

## Clipboard Usage
Clipboard writes occur only on explicit user actions:  
- **Alt+drag link copy:** Copies a link’s URL to the clipboard.  
- **Ctrl+C with multi-selections:** Copies the combined selected text using your chosen separator.  

> There is no background or silent clipboard access.

---

## Page Access and Permissions
To provide core features, the extension may run a content script in the page context:  
- **activeTab:** Injects functionality into the current tab only after a user gesture (e.g., opening the popup or using a context menu).  
- **optional_host_permissions (<all_urls>):** If you choose “Allow on all sites,” the extension can auto-run across sites. Otherwise, it only acts on the tab you interact with.  

> All processing is local; the extension does not exfiltrate page content or your selections.

---

## Other Permissions
- **storage:** Saves local preferences as described above.  
- **clipboardWrite:** Writes to clipboard only when you explicitly perform the linked actions.  
- **contextMenus:** Adds user-initiated right-click actions (e.g., search selection(s)). Used only when clicked.  
- **scripting:** Programmatic injection of the packaged content script (no remote code; the script is part of the extension).  

---

## Remote Code
The extension does **not** fetch or execute remote code. No `eval` of remote content. No dynamic script loading from the network.

---

## Cookies
The extension does **not** create, read, or modify cookies.

---

## Children’s Privacy
This extension is not directed to children. We do not knowingly collect personal information from children.

---

## Security
All processing is local. No data is sent to servers. We recommend using the latest stable version of your browser and installing extensions from trusted sources.

---

## Data Retention
- Settings saved via `chrome.storage.local` remain on your device until you remove the extension or clear extension data.  
- Clipboard contents follow your system’s clipboard behavior and are not stored by the extension.

---

## User Controls
- Enable/disable the extension at any time from the popup.  
- Enable/disable the Chat Enter behavior independently.  
- Adjust word snapping, highlight color, and copy separator at any time.  
- Remove all saved settings by uninstalling the extension or clearing extension data.

---

## Third Parties
We do not share data with third parties. No analytics providers, ad networks, or third-party SDKs are used.

---

## International Data Transfers
Not applicable. The extension does not transmit your data.

---

## Changes to This Policy
If we change this policy, we will update the Effective date above. For material changes, we will note updates on the extension listing.
