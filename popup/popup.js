document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggleEnabled');
  const wordCharsInput = document.getElementById('wordChars');
  const saveBtn = document.getElementById('saveBtn');
  
  // Load saved settings
  chrome.storage.local.get(['enabled', 'wordChars'], (result) => {
    toggle.checked = result.enabled !== false;
    wordCharsInput.value = result.wordChars || '\\w\\-';
  });
  
  // Save settings
  saveBtn.addEventListener('click', () => {
    const enabled = toggle.checked;
    const wordChars = wordCharsInput.value;
    
    // Save to storage
    chrome.storage.local.set({ enabled, wordChars }, () => {
      // Notify content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'updateConfig',
            enabled,
            wordChars
          });
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
  });
});