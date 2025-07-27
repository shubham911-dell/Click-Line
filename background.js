// Set default state on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    enabled: true,
    wordChars: '\\w\\-'
  });
});
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    updateExtensionIcon(changes.enabled.newValue);
  }
});

// Keep service worker alive
setInterval(() => chrome.runtime.getPlatformInfo(() => {}), 20000);