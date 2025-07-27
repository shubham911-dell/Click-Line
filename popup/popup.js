document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggleEnabled');
  const wordCharsInput = document.getElementById('wordChars');
  const saveBtn = document.getElementById('saveBtn');
  
  // Load saved settings
  chrome.storage.local.get(['enabled', 'wordChars'], (result) => {
    // Use strict boolean check for undefined
    toggle.checked = (result.enabled !== undefined) ? result.enabled : true;
    wordCharsInput.value = result.wordChars || '\\w\\-';
  });
  
  // Save settings
  saveBtn.addEventListener('click', saveSettings);
  
  // NEW: Add event listener for toggle change
  toggle.addEventListener('change', () => {
    saveSettings();
  });
  
  // NEW: Unified save function
  function saveSettings() {
    const enabled = toggle.checked;
    const wordChars = wordCharsInput.value;
    
    // Save to storage
    chrome.storage.local.set({ enabled, wordChars }, () => {
      // Notify ALL tabs, not just active one
      chrome.tabs.query({}, (tabs) => {
        for (const tab of tabs) {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'updateConfig',
              enabled,
              wordChars
            }).catch(() => {}); // Ignore errors in tabs without content script
          }
        }
      });
      
      // Show visual feedback
      saveBtn.textContent = '✓ Saved!';
      saveBtn.style.backgroundColor = '#28a745';
      setTimeout(() => {
        saveBtn.textContent = 'Save Settings';
        saveBtn.style.backgroundColor = '';
      }, 2000);
    });
  }
});