// Global state
let isMouseDown = false;
let isDragging = false;
let ctrlPressed = false;
let startNode = null;
let startOffset = 0;

// Load config from storage
let config = {
  enabled: true,
  wordChars: '\\w\\-'
};

chrome.storage.local.get(null, (result) => {
  Object.assign(config, result);
});

// Listen for config updates
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'updateConfig') {
    Object.assign(config, message);
  }
});

// Main event listeners
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
document.addEventListener('mousedown', handleMouseDown);
document.addEventListener('mousemove', handleMouseMove);
document.addEventListener('mouseup', handleMouseUp);

function handleKeyDown(e) {
  if (e.key === 'Control') ctrlPressed = true;
}

function handleKeyUp(e) {
  if (e.key === 'Control') ctrlPressed = false;
}

function handleMouseDown(e) {
  if (!config.enabled || e.button !== 0) return;
  
  isMouseDown = true;
  isDragging = false;
  startNode = null;
  startOffset = 0;
  
  // Capture initial selection point
  const selection = window.getSelection();
  if (selection.rangeCount > 0 && !selection.isCollapsed) {
    const range = selection.getRangeAt(0);
    startNode = range.startContainer;
    startOffset = range.startOffset;
  }
}

function handleMouseMove() {
  if (!isMouseDown || !config.enabled) return;
  isDragging = true;
}

function handleMouseUp() {
  if (!isMouseDown || !config.enabled) return;
  
  isMouseDown = false;
  
  // Only process if we actually dragged
  if (!isDragging) return;
  
  const selection = window.getSelection();
  if (selection.rangeCount === 0 || selection.isCollapsed) return;
  
  const range = selection.getRangeAt(0);
  
  // Handle link copy mode
  if (ctrlPressed) {
    handleLinkCopy(range);
    return;
  }
  
  // Handle word snap mode
  adjustWordSelection(range);
  
  // Update selection
  selection.removeAllRanges();
  selection.addRange(range);
}

function handleLinkCopy(range) {
  // Find the closest link
  let node = range.startContainer;
  while (node && node !== document) {
    if (node.nodeName === 'A' && node.href) {
      // Select entire link text
      const linkRange = document.createRange();
      linkRange.selectNodeContents(node);
      
      // Update selection to show entire link is selected
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(linkRange);
      
      // Copy link to clipboard
      navigator.clipboard.writeText(node.href)
        .catch(err => console.log('Failed to copy link: ', err));
      
      return;
    }
    node = node.parentNode;
  }
}

function adjustWordSelection(range) {
  // Adjust start boundary
  const start = getWordBoundary(range.startContainer, range.startOffset, true);
  range.setStart(start.node, start.offset);
  
  // Adjust end boundary (FIXED to include last character)
  const end = getWordBoundary(range.endContainer, range.endOffset, false);
  range.setEnd(end.node, end.offset);
}

function getWordBoundary(node, offset, isStart) {
  if (node.nodeType !== Node.TEXT_NODE) {
    return { node, offset };
  }
  
  const text = node.textContent;
  let newOffset = offset;
  
  if (isStart) {
    // Move backward to word start
    while (newOffset > 0 && !isWordBoundary(text, newOffset - 1)) {
      newOffset--;
    }
  } else {
    // Move forward to word end (FIXED to include last character)
    while (newOffset < text.length && !isWordBoundary(text, newOffset)) {
      newOffset++;
    }
    // Include the last character of the word
    if (newOffset < text.length && isWordChar(text[newOffset])) {
      newOffset++;
    }
  }
  
  return { node, offset: newOffset };
}

function isWordBoundary(text, index) {
  if (index < 0 || index >= text.length) return true;
  
  const regex = new RegExp(`[${config.wordChars}]`);
  const current = text[index];
  const next = text[index + 1];
  
  return (
    (regex.test(current) && (!next || !regex.test(next))) ||
    (!regex.test(current) && next && regex.test(next))
  );
}

function isWordChar(char) {
  const regex = new RegExp(`[${config.wordChars}]`);
  return regex.test(char);
}