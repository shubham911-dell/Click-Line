// popup.js
document.addEventListener('DOMContentLoaded', init);

async function init() {
  const toggle = document.getElementById('toggleEnabled');
  const wordChars = document.getElementById('wordChars');
  const colorPicker = document.getElementById('colorPicker');
  const separator = document.getElementById('separator');
  const altDragEnabled = document.getElementById('altDragEnabled');
  const multiSelectEnabled = document.getElementById('multiSelectEnabled');
  const saveBtn = document.getElementById('saveBtn');

  // Inject content.js into the active tab when popup opens (activeTab user gesture)
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ['content.js']
      });
    }
  } catch (e) {
    // ignore if cannot inject (e.g., chrome:// pages)
  }

  chrome.storage.local.get([
    'enabled','wordChars','highlightColor','separator',
    'altDragEnabled','multiSelectEnabled','enterOverrideEnabled'
  ], (res) => {
    toggle.checked = (res.enabled !== undefined) ? res.enabled : true;
    wordChars.value = res.wordChars || '\\w\\-';
    colorPicker.value = res.highlightColor || '#ffeb3b';
    separator.value = res.separator || '\\n';
    altDragEnabled.checked = (res.altDragEnabled !== undefined) ? res.altDragEnabled : true;
    multiSelectEnabled.checked = (res.multiSelectEnabled !== undefined) ? res.multiSelectEnabled : true;
  });

  async function maybeRequestAllSitesAccess(enabled) {
    // When enabling the extension, optionally request "<all_urls>" so it can run everywhere automatically
    if (!enabled) return;
    try {
      const granted = await chrome.permissions.request({ origins: ['<all_urls>'] });
      // If user declines, extension will still work on currently active tab (injected above via activeTab)
      // You can show a small toast in the popup if you want, but not required.
    } catch (e) {
      // ignore
    }
  }

  function broadcast(settings){
    chrome.storage.local.set(settings, async () => {
      const tabs = await chrome.tabs.query({});
      for (const t of tabs) {
        try {
          if (t.id) chrome.tabs.sendMessage(t.id, { type: 'updateConfig', ...settings }, () => chrome.runtime.lastError);
        } catch {}
      }
    });
  }

  async function save() {
    const settings = {
      enabled: toggle.checked,
      wordChars: wordChars.value || '\\w\\-',
      highlightColor: colorPicker.value || '#ffeb3b',
      separator: separator.value || '\\n',
      altDragEnabled: altDragEnabled.checked,
      multiSelectEnabled: multiSelectEnabled.checked
    };

    // When enabling, optionally request "<all_urls>" to minimize re-prompts
    await maybeRequestAllSitesAccess(settings.enabled);

    broadcast(settings);
    saveBtn.textContent = '✓ Saved!';
    saveBtn.style.backgroundColor = '#28a745';
    setTimeout(() => {
      saveBtn.textContent = 'Save Settings';
      saveBtn.style.backgroundColor = '';
    }, 1200);
  }

  saveBtn.addEventListener('click', save);
  [toggle, wordChars, colorPicker, separator, altDragEnabled, multiSelectEnabled].forEach(el => {
    el.addEventListener('change', save);
    el.addEventListener('blur', save);
  });
}