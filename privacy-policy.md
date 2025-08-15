# Privacy Policy — Click-Line
 
**Contact:** 1theflow01@gmail.com

Click-Line is a Chrome extension that improves text selection and chat input ergonomics across the web. This policy explains what data the extension handles.  

In short: **the extension does not collect, transmit, sell, or share personal data.** All processing happens locally in the user’s browser.

---

## Summary
- No personal data is collected or transmitted.  
- No analytics, tracking, or advertising.  
- All features (selection snapping, multi-selection highlights, optional chat Enter behavior, Alt+drag link copy) run locally in your browser.  
- User preferences are stored locally via `chrome.storage.local`.

---

## Data We Collect
- We do not collect personal information.  
- We do not send data to remote servers.  
- We do not use analytics or tracking.  
- We do not show ads.  

---

## Local Storage
We use `chrome.storage.local` to save preferences on your device, such as:
- Enable/disable extension  
- Word Characters (regex fragment) for snapping  
- Selection highlight color  
- Copy separator (e.g., newline or bullet)  
- Alt+drag link copy toggle  
- Multi-selection (Ctrl) toggle  
- Optional Chat Enter behavior toggle and rules  

This information remains on your device unless removed by you (e.g., clearing extension data) or synchronized by your browser profile.

---

## Clipboard Usage
Clipboard writes occur **only** on explicit user actions:
- **Alt+drag link copy:** copies the link’s URL to the clipboard.  
- **Ctrl+C with multi-selections:** copies the combined selected text joined by your chosen separator.  

No background or silent clipboard access is performed.

---

## Page Access and Host Permissions
The extension runs a content script on pages you visit to provide:
- Snap-to-word selection  
- Multi-selection with highlights  
- Alt+drag link copy (optional)  
- Optional chat Enter mapping (Enter = new line, Shift+Enter = send)  

All processing occurs locally in your browser.  
The extension does **not** exfiltrate page content, selections, or user inputs to external servers.

---

## Other Permissions and How They Are Used
- **storage:** Save local preferences (as listed above).  
- **clipboardWrite:** Write to the clipboard only when you explicitly use Alt+drag link copy or Ctrl+C on multi-selections.  
- **contextMenus:** Provide optional right-click convenience actions (e.g., search selection(s)). Only used when you invoke them.  
- **host_permissions (`<all_urls>`):** Allow the selection and chat features to operate on pages you visit. No page data is transmitted elsewhere.  
- **scripting** and **activeTab:** Used only to apply functionality to page context in response to your action. No remote code is fetched or executed.

---

## Remote Code
The extension does **not** fetch or execute remotely hosted code.  
All logic ships with the extension package.  
No `eval` of remote content.  
No dynamic script loading that changes executable behavior.

---

## Cookies
The extension does not create or access cookies.

---

## Children’s Privacy
This extension is **not** directed to children.  
We do not knowingly collect personal information from children.

---

## Security
All processing is local. While no transmission to servers occurs, we recommend keeping your browser up to date and only installing extensions from trusted sources.

---

## Data Retention
Settings saved via `chrome.storage.local` remain on your device until you remove the extension or clear extension data. Clipboard contents follow your system clipboard behavior and are not stored by the extension.

---

## User Controls
- Enable/disable the extension from the popup at any time.  
- Enable/disable the Chat Enter behavior independently.  
- Change “Word Characters,” highlight color, and copy separator at any time.  
- Remove all saved settings by uninstalling the extension or clearing extension data.

---

## Third Parties
We do **not** share data with third parties.  
No analytics providers, ad networks, or third-party SDKs are used.

---

## International Data Transfers
Not applicable. The extension does not transmit your data.

---

## Changes to This Policy
If we change this policy, we will update the **Effective date** above.  
For material changes, we will note updates on the extension’s listing.
