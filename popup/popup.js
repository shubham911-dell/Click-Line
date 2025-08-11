// popup.js
document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('toggleEnabled');
  const wordChars = document.getElementById('wordChars');
  const colorPicker = document.getElementById('colorPicker');
  const separator = document.getElementById('separator');
  const altDragEnabled = document.getElementById('altDragEnabled');
  const multiSelectEnabled = document.getElementById('multiSelectEnabled');
  const saveBtn = document.getElementById('saveBtn');

  // Enter override controls
  const enterEnabled = document.getElementById('enterEnabled');
  const enterMode = document.getElementById('enterMode');
  const siteRule = document.getElementById('siteRule');
  const pageRule = document.getElementById('pageRule');
  const currentDomainEl = document.getElementById('currentDomain');
  const currentPageEl = document.getElementById('currentPage');

  // Get active tab info
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url || '';
  let domain = '-';
  let pageKey = '-';
  try {
    const u = new URL(url);
    domain = u.hostname;
    pageKey = u.origin + u.pathname + u.search;
  } catch {}
  currentDomainEl.textContent = domain;
  currentPageEl.textContent = pageKey;

  // Load stored settings
  chrome.storage.local.get([
    'enabled','wordChars','highlightColor','separator',
    'altDragEnabled','multiSelectEnabled',
    'enterOverrideEnabled','enterOverrideMode','enterDomainRules','enterPageRules'
  ], (res) => {
    toggle.checked = (res.enabled !== undefined) ? res.enabled : true;
    wordChars.value = res.wordChars || '\\w\\-';
    colorPicker.value = res.highlightColor || '#ffeb3b';
    separator.value = res.separator || '\\n';
    altDragEnabled.checked = (res.altDragEnabled !== undefined) ? res.altDragEnabled : true;
    multiSelectEnabled.checked = (res.multiSelectEnabled !== undefined) ? res.multiSelectEnabled : true;

    // Enter override defaults
    enterEnabled.checked = (res.enterOverrideEnabled !== undefined) ? !!res.enterOverrideEnabled : true;
    enterMode.value = (res.enterOverrideMode === 'force') ? 'force' : 'auto';

    const domainRules = res.enterDomainRules || {};
    const pageRules = res.enterPageRules || {};
    siteRule.value = domainRules[domain] || 'follow';
    pageRule.value = pageRules[pageKey] || 'follow';
  });

  function broadcast(settings){
    chrome.storage.local.set(settings, () => {
      chrome.tabs.query({}, (tabs) => {
        for (const t of tabs) {
          if (t.id) chrome.tabs.sendMessage(t.id, { type: 'updateConfig', ...settings }, () => {});
        }
      });
    });
  }

  async function save() {
    const res = await chrome.storage.local.get(['enterDomainRules','enterPageRules']);
    const domainRules = res.enterDomainRules || {};
    const pageRules = res.enterPageRules || {};

    // Update per-site rule
    if (domain && domain !== '-') {
      if (siteRule.value === 'follow') delete domainRules[domain];
      else domainRules[domain] = siteRule.value; // 'on' | 'off'
    }
    // Update per-page rule
    if (pageKey && pageKey !== '-') {
      if (pageRule.value === 'follow') delete pageRules[pageKey];
      else pageRules[pageKey] = pageRule.value; // 'on' | 'off'
    }

    const settings = {
      enabled: toggle.checked,
      wordChars: wordChars.value || '\\w\\-',
      highlightColor: colorPicker.value || '#ffeb3b',
      separator: separator.value || '\\n',
      altDragEnabled: altDragEnabled.checked,
      multiSelectEnabled: multiSelectEnabled.checked,

      enterOverrideEnabled: enterEnabled.checked,
      enterOverrideMode: enterMode.value, // 'auto' | 'force'
      enterDomainRules: domainRules,
      enterPageRules: pageRules
    };

    broadcast(settings);
    saveBtn.textContent = '✓ Saved!';
    saveBtn.style.backgroundColor = '#28a745';
    setTimeout(() => {
      saveBtn.textContent = 'Save Settings';
      saveBtn.style.backgroundColor = '';
    }, 1200);
  }

  saveBtn.addEventListener('click', save);
  [
    toggle, wordChars, colorPicker, separator,
    altDragEnabled, multiSelectEnabled,
    enterEnabled, enterMode, siteRule, pageRule
  ].forEach(el => {
    el.addEventListener('change', save);
    el.addEventListener('blur', save);
  });
});