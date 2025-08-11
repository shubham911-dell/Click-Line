// content.js

// --- Global State ---
let isMouseDown = false;
let isDragging = false;

let ctrlPressed = false;
let shiftPressed = false;
let altPressed = false;

let startNode = null;
let startOffset = 0;

let multiSelections = []; // Array<Range>
let undoStack = [];
let redoStack = [];
let lockMode = false;

let rafPending = false; // for overlay fallback
const HIGHLIGHT_NAME = 'wss-multi';
const STYLE_ID = 'wss-highlight-style';
const OVERLAY_ID = 'multiSelectionHighlightContainer';

let wordCharRegex = /[\w\-]/;

const supportsCustomHighlights = typeof CSS !== 'undefined' && CSS.highlights && typeof Highlight !== 'undefined';

// Domains
const CHATGPT_DOMAINS = ['chatgpt.com', 'chat.openai.com'];
const SHIFTENTER_SEND_DOMAINS = ['chat.deepseek.com', 'deepseek.com', 'lmarena.ai', 'www.lmarena.ai']; // Enter=new line, Shift+Enter=send

function domainMatches(list) {
  const h = location.hostname.toLowerCase();
  return list.some(d => h === d || h.endsWith('.' + d));
}
function isChatGPTDomain() {
  return domainMatches(CHATGPT_DOMAINS);
}

// Config
let config = {
  enabled: true,
  wordChars: '\\w\\-',
  highlightColor: '#ffeb3b', // from popup (hex)
  highlightAlpha: 0.28,       // translucent so text stays readable
  separator: '\\n',
  altDragEnabled: true,
  multiSelectEnabled: true,
};

// --- Utils ---
function isEditable(el) {
  if (!el) return false;
  return el.isContentEditable || (['TEXTAREA', 'INPUT'].includes(el.tagName) && !el.readOnly && !el.disabled);
}
function getEditingHost(el) {
  if (!el) return null;
  if (el.isContentEditable) return el.closest('[contenteditable="true"]');
  if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') return el;
  return el.closest('[contenteditable="true"], textarea, input');
}
function isCodeEditor(host) {
  if (!host) return false;
  const s = (host.className || '') + ' ' + (host.id || '');
  return /monaco|CodeMirror|ace_editor/i.test(s);
}
function getSeparator() {
  let sep = config.separator || '\\n';
  return sep.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
}
function hexToRgba(hex, alpha = 0.28) {
  if (!hex) return `rgba(67,97,238,${alpha})`;
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
function compileWordRegex() {
  try { wordCharRegex = new RegExp(`[${config.wordChars}]`); }
  catch { wordCharRegex = /[\w\-]/; }
}
function isWordChar(ch) {
  if (!ch) return false;
  return wordCharRegex.test(ch);
}

// --- Storage Load ---
chrome.storage.local.get(
  ['enabled','wordChars','highlightColor','separator','altDragEnabled','multiSelectEnabled'],
  (res) => {
    Object.assign(config, {
      enabled: res.enabled ?? config.enabled,
      wordChars: res.wordChars ?? config.wordChars,
      highlightColor: res.highlightColor ?? config.highlightColor,
      separator: res.separator ?? config.separator,
      altDragEnabled: res.altDragEnabled ?? config.altDragEnabled,
      multiSelectEnabled: res.multiSelectEnabled ?? config.multiSelectEnabled,
    });
    compileWordRegex();
    ensureHighlightStyle();
    repaintHighlights();
    setupChatGPTEnterOverride(); // set up ChatGPT-specific key handling
  }
);

// --- Listen for messages ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message) return;

  if (message.type === 'updateConfig') {
    if ('enabled' in message) config.enabled = !!message.enabled;
    if ('wordChars' in message) config.wordChars = message.wordChars || config.wordChars;
    if ('highlightColor' in message) config.highlightColor = message.highlightColor || config.highlightColor;
    if ('separator' in message) config.separator = message.separator || config.separator;
    if ('altDragEnabled' in message) config.altDragEnabled = !!message.altDragEnabled;
    if ('multiSelectEnabled' in message) config.multiSelectEnabled = !!message.multiSelectEnabled;

    compileWordRegex();
    ensureHighlightStyle();
    repaintHighlights();
    return;
  }

  if (message.type === 'getSelections') {
    const list = [];
    if (multiSelections.length > 0) {
      for (const r of multiSelections) {
        const t = r.toString();
        if (t && t.trim()) list.push({ text: t });
      }
    } else {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const t = sel.toString();
        if (t && t.trim()) list.push({ text: t });
      }
    }
    sendResponse({ selections: list });
    return;
  }
});

// --- CSS Highlight style injection ---
function ensureHighlightStyle() {
  let style = document.getElementById(STYLE_ID);
  const rgba = hexToRgba(config.highlightColor, config.highlightAlpha);
  const css = supportsCustomHighlights ? `::highlight(${HIGHLIGHT_NAME}) { background-color: ${rgba}; }` : '';
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    document.documentElement.appendChild(style);
  } else if (style.textContent !== css) {
    style.textContent = css;
  }
}

// --- Modifier Keys ---
document.addEventListener('keydown', (e) => {
  if (e.key === 'Control') ctrlPressed = true;
  if (e.key === 'Shift') shiftPressed = true;
  if (e.key === 'Alt') altPressed = true;

  // Undo/Redo only when not typing
  if (ctrlPressed && !isEditable(e.target)) {
    const key = e.key.toLowerCase();
    if (key === 'z') {
      e.preventDefault();
      if (shiftPressed) redoSelection(); else undoSelection();
    } else if (key === 'y') {
      e.preventDefault();
      redoSelection();
    }
  }

  // Ctrl+Shift+L: lock
  if (ctrlPressed && shiftPressed && e.key.toLowerCase() === 'l') {
    e.preventDefault();
    lockMode = !lockMode;
    showToast(`Selection Lock: ${lockMode ? 'ON' : 'OFF'}`);
  }

  // Escape clears multi-selections (quality of life)
  if (e.key === 'Escape') {
    if (multiSelections.length && !lockMode) {
      clearMultiSelection();
      repaintHighlights();
    }
  }
});
document.addEventListener('keyup', (e) => {
  if (e.key === 'Control') ctrlPressed = false;
  if (e.key === 'Shift') shiftPressed = false;
  if (e.key === 'Alt') altPressed = false;
});
// Safety: reset modifiers when focus leaves window (prevents “stuck Ctrl”)
window.addEventListener('blur', () => {
  ctrlPressed = false;
  shiftPressed = false;
  altPressed = false;
});

// --- Mouse Handlers ---
document.addEventListener('mousedown', (e) => {
  if (!config.enabled) return;
  if (e.button !== 0) return;
  isMouseDown = true;
  isDragging = false;

  const selection = window.getSelection();
  startNode = null;
  startOffset = 0;
  if (selection.rangeCount > 0 && !selection.isCollapsed) {
    const range = selection.getRangeAt(0);
    startNode = range.startContainer;
    startOffset = range.startOffset;
  }
}, true);

document.addEventListener('mousemove', () => {
  if (!isMouseDown || !config.enabled) return;
  isDragging = true;
}, true);

document.addEventListener('mouseup', (e) => {
  if (!config.enabled) return;
  if (!isMouseDown) return;
  isMouseDown = false;
  if (!isDragging) return;
  isDragging = false;

  if (shiftPressed) return; // native

  const targetHost = getEditingHost(e.target);
  const selection = window.getSelection();
  if (!selection) return;

  // Inputs/Textareas: snap by indices
  if (targetHost && (targetHost.tagName === 'TEXTAREA' || targetHost.tagName === 'INPUT')) {
    if (ctrlPressed && config.multiSelectEnabled) showToast('Multi-selection is not supported in this input.');
    snapTextControlSelection(targetHost);
    return;
  }

  // ContentEditable or plain text
  if (selection.rangeCount === 0 || selection.isCollapsed) return;

  // Alt+drag link copy
  if (altPressed && config.altDragEnabled) {
    if (handleAltDragLinkCopy(selection.getRangeAt(0))) return;
  }

  // Ctrl+drag multi-selection
  if (ctrlPressed && config.multiSelectEnabled) {
    const snappedRange = snapRangeToWords(selection.getRangeAt(0));
    if (!isRangeInMultiSelections(snappedRange)) {
      multiSelections.push(snappedRange);
      pushUndoState(multiSelections);
      redoStack = [];
      repaintHighlights();
    }
    clearSelection();
    return;
  }

  // Normal drag => snap single selection and ensure it sticks vs editor
  deferSnapCurrentSelection(2); // try now and next frame
  if (!lockMode) clearMultiSelection();
  repaintHighlights();
}, true);

// Helper: determine if this is a plain interaction without modifiers
function isPlainInteraction(e) {
  return !(e.ctrlKey || e.shiftKey || e.altKey || e.metaKey);
}

// Clear multi selections on plain pointer down anywhere (unless locked)
document.addEventListener('pointerdown', (e) => {
  if (!config.enabled) return;
  if (lockMode) return;
  if (e.button !== 0) return; // left click/tap only
  if (!isPlainInteraction(e)) return; // ignore when modifiers held
  if (!multiSelections.length) return;

  clearMultiSelection();
  repaintHighlights();
}, true);

// Fallback: also clear on plain click (in case pointerdown was prevented by page)
document.addEventListener('click', (e) => {
  if (!config.enabled) return;
  if (lockMode) return;
  if (!isPlainInteraction(e)) return;
  if (!multiSelections.length) return;

  clearMultiSelection();
  repaintHighlights();
}, true);

// --- Selection helpers ---
function pushUndoState(selections) {
  undoStack.push(selections.map(r => r.cloneRange()));
  if (undoStack.length > 100) undoStack.shift();
}
function clearMultiSelection() {
  multiSelections = [];
  undoStack = [];
  redoStack = [];
  if (supportsCustomHighlights) CSS.highlights.delete(HIGHLIGHT_NAME);
  else removeOverlayHighlights();
}
function undoSelection() {
  if (undoStack.length < 2) return;
  redoStack.push(undoStack.pop());
  multiSelections = undoStack[undoStack.length - 1].map(r => r.cloneRange());
  repaintHighlights();
}
function redoSelection() {
  if (redoStack.length === 0) return;
  const state = redoStack.pop();
  undoStack.push(state.map(r => r.cloneRange()));
  multiSelections = state.map(r => r.cloneRange());
  repaintHighlights();
}
function clearSelection() {
  const sel = window.getSelection();
  if (sel) sel.removeAllRanges();
}

// Word snapping for DOM/text nodes
function snapRangeToWords(range) {
  const s = getWordBoundary(range.startContainer, range.startOffset, true);
  const e = getWordBoundary(range.endContainer, range.endOffset, false);
  const r = document.createRange();
  try { r.setStart(s.node, s.offset); } catch { r.setStart(range.startContainer, range.startOffset); }
  try { r.setEnd(e.node, e.offset); } catch { r.setEnd(range.endContainer, range.endOffset); }
  return r;
}
function getWordBoundary(node, offset, isStart) {
  if (node.nodeType !== Node.TEXT_NODE) {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
    if (isStart) { if (walker.nextNode()) { node = walker.currentNode; offset = 0; } }
    else { let last = null; while (walker.nextNode()) last = walker.currentNode; if (last) { node = last; offset = node.textContent.length; } }
  }
  if (node.nodeType !== Node.TEXT_NODE) return { node, offset };

  const text = node.textContent || '';
  let idx = Math.min(Math.max(offset, 0), text.length);
  if (isStart) while (idx > 0 && isWordChar(text[idx - 1])) idx--;
  else while (idx < text.length && isWordChar(text[idx])) idx++;
  return { node, offset: idx };
}
function deferSnapCurrentSelection(tries = 2) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const original = sel.getRangeAt(0).cloneRange();
  const snapped = snapRangeToWords(original);

  const apply = () => {
    const s = window.getSelection(); if (!s) return;
    s.removeAllRanges(); s.addRange(snapped.cloneRange());
  };
  apply();
  if (tries > 1) requestAnimationFrame(() => apply());
}

// Snap selection inside TEXTAREA/INPUT
function snapTextControlSelection(el) {
  try {
    const val = el.value || '';
    let start = el.selectionStart ?? 0;
    let end = el.selectionEnd ?? 0;
    if (start > end) [start, end] = [end, start];
    while (start > 0 && isWordChar(val[start - 1])) start--;
    while (end < val.length && isWordChar(val[end])) end++;
    el.setSelectionRange(start, end, 'none');
  } catch {}
}

// Range overlap
function isRangeInMultiSelections(range) {
  for (const selRange of multiSelections) if (rangesOverlap(selRange, range)) return true;
  return false;
}
function rangesOverlap(r1, r2) {
  if (r1.compareBoundaryPoints(Range.END_TO_START, r2) >= 0) return false;
  if (r1.compareBoundaryPoints(Range.START_TO_END, r2) <= 0) return false;
  return true;
}

// --- Highlights (CSS Highlights preferred) ---
function verifyRangeConnected(r) {
  try { return r && r.startContainer && r.endContainer && r.startContainer.isConnected && r.endContainer.isConnected && !r.collapsed; }
  catch { return false; }
}
function repaintHighlights() {
  if (supportsCustomHighlights) {
    const connected = multiSelections.filter(verifyRangeConnected);
    try { const h = new Highlight(...connected); CSS.highlights.set(HIGHLIGHT_NAME, h); }
    catch { CSS.highlights.delete(HIGHLIGHT_NAME); }
  } else scheduleOverlayUpdate();
}

// Overlay fallback (rare)
function getOverlay() {
  let container = document.getElementById(OVERLAY_ID);
  if (!container) {
    container = document.createElement('div');
    container.id = OVERLAY_ID;
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '2147483647';
    document.body.appendChild(container);
  }
  return container;
}
function removeOverlayHighlights() {
  const c = document.getElementById(OVERLAY_ID);
  if (c) c.innerHTML = '';
}
function scheduleOverlayUpdate() {
  if (!multiSelections.length) { removeOverlayHighlights(); return; }
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    const container = getOverlay();
    container.innerHTML = '';
    const rgba = hexToRgba(config.highlightColor, config.highlightAlpha);
    for (const r of multiSelections) {
      const rects = r.getClientRects();
      for (const rect of rects) {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = rect.left + window.scrollX + 'px';
        div.style.top = rect.top + window.scrollY + 'px';
        div.style.width = rect.width + 'px';
        div.style.height = rect.height + 'px';
        div.style.background = rgba;
        div.style.borderRadius = '3px';
        div.style.pointerEvents = 'none';
        container.appendChild(div);
      }
    }
  });
}
document.addEventListener('scroll', () => {
  if (!config.enabled || supportsCustomHighlights) return;
  if (multiSelections.length === 0) return;
  scheduleOverlayUpdate();
}, true);
window.addEventListener('resize', () => {
  if (!config.enabled || supportsCustomHighlights) return;
  if (multiSelections.length === 0) return;
  scheduleOverlayUpdate();
});

// --- Copy combined multi-selection text on Ctrl+C ---
document.addEventListener('copy', (e) => {
  if (!config.enabled) return;
  if (!ctrlPressed) return;
  if (multiSelections.length === 0) return;
  if (isEditable(e.target)) return;

  e.preventDefault();
  const combined = multiSelections.map(r => r.toString()).filter(t => t && t.trim()).join(getSeparator());
  if (!combined) return;
  e.clipboardData.setData('text/plain', combined);
  showToast('Copied selected text!');
});

// --- Alt+Drag Link Copy ---
function handleAltDragLinkCopy(range) {
  if (!range) return false;
  let node = range.startContainer;
  while (node && node !== document) {
    if (node.nodeName === 'A' && node.href) {
      const linkRange = document.createRange();
      linkRange.selectNodeContents(node);
      highlightTemporary(linkRange);
      navigator.clipboard.writeText(node.href).then(() => showToast('Link copied!')).catch(() => showToast('Failed to copy link'));
      return true;
    }
    node = node.parentNode;
  }
  return false;
}
function highlightTemporary(range) {
  const rects = range.getClientRects();
  const c = getOverlay();
  const rgba = 'rgba(40, 167, 69, 0.35)';
  rects.forEach(rect => {
    const d = document.createElement('div');
    d.style.position = 'absolute';
    d.style.left = rect.left + window.scrollX + 'px';
    d.style.top = rect.top + window.scrollY + 'px';
    d.style.width = rect.width + 'px';
    d.style.height = rect.height + 'px';
    d.style.background = rgba;
    d.style.borderRadius = '4px';
    d.style.pointerEvents = 'none';
    c.appendChild(d);
    setTimeout(() => d.remove(), 650);
  });
}

// --- Toast ---
let toastTimeout;
function showToast(message) {
  let toast = document.getElementById('wordsnap-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'wordsnap-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = 'rgba(0,0,0,0.7)';
    toast.style.color = '#fff';
    toast.style.padding = '8px 16px';
    toast.style.borderRadius = '6px';
    toast.style.fontSize = '14px';
    toast.style.zIndex = '2147483647';
    toast.style.transition = 'opacity 150ms ease';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { toast.style.opacity = '0'; }, 1500);
}

// ================= Chat Enter Override =================
// DeepSeek/LMArena: Enter=new line, Shift+Enter=send (document-level)
document.addEventListener('keydown', (e) => {
  if (!domainMatches(SHIFTENTER_SEND_DOMAINS)) return; // not those sites
  if (!e.isTrusted) return;

  const host = getEditingHost(e.target);
  if (!host) return;
  if (isCodeEditor(host)) return;

  if (e.key === 'Enter' && !e.repeat) {
    e.preventDefault();
    if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    e.stopPropagation();

    const target = findEditableTarget(host);
    if (e.shiftKey) {
      sendMessageByDomain(target);
    } else {
      insertNewlineGeneric(target);
    }
  }
}, true);

// ChatGPT: Enter=new line, Shift+Enter=send (attach directly to editor, capture+bubble)
function setupChatGPTEnterOverride() {
  if (!isChatGPTDomain()) return;
  const attach = (ed) => {
    if (!ed || ed.__wss_enter_patched) return;
    ed.__wss_enter_patched = true;

    const handler = (e) => {
      if (e.key !== 'Enter' || e.repeat) return;
      e.preventDefault();
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
      e.stopPropagation();

      if (e.shiftKey) {
        sendChatGPT();
      } else {
        insertNewlineInPM(ed);
      }
    };

    // Capture and bubble to beat site listeners
    ed.addEventListener('keydown', handler, true);
    ed.addEventListener('keydown', handler, false);
  };

  // Attach to existing editor(s)
  document.querySelectorAll('div.ProseMirror[contenteditable="true"]').forEach(attach);

  // Observe future editors
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      m.addedNodes && m.addedNodes.forEach(n => {
        if (n.nodeType === 1) {
          if (n.matches?.('div.ProseMirror[contenteditable="true"]')) attach(n);
          n.querySelectorAll?.('div.ProseMirror[contenteditable="true"]').forEach(attach);
        }
      });
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
}

// Insert a visual line break into ProseMirror editor, without triggering send
function insertNewlineInPM(ed) {
  try {
    ed.focus();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !ed.contains(sel.anchorNode)) {
      const r = document.createRange();
      r.selectNodeContents(ed);
      r.collapse(false);
      sel.removeAllRanges();
      sel.addRange(r);
    }
    // Manual <br> + ZWSP to force a visible break without relying on key handlers
    manualBrAtSelection(ed);
    // Post-frame: if any space-normalization happens, fix it
    requestAnimationFrame(() => ensureBreakIfSpace(ed));
  } catch {}
}

// Generic newline for CE + textarea
function insertNewlineGeneric(el) {
  if (!el) return;
  if (el.isContentEditable) {
    // Editor-driven first
    if (dispatchEditorInsert(el, 'insertParagraph')) return;
    if (dispatchEditorInsert(el, 'insertLineBreak')) return;
    // UA commands
    try { if (document.execCommand('insertParagraph')) return; } catch {}
    try { if (document.execCommand('insertLineBreak')) return; } catch {}
    // <br> fallback
    try { if (document.execCommand('insertHTML', false, '<br>')) { placeCaretAfterLastNode(el); return; } } catch {}
    // Final manual
    manualBrAtSelection(el);
  } else if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
    try {
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      const val = el.value || '';
      el.value = val.slice(0, start) + '\n' + val.slice(end);
      el.setSelectionRange(start + 1, start + 1, 'none');
    } catch {}
  }
}

// Determine best editable target
function findEditableTarget(host) {
  if (!host) return null;
  if (host.isContentEditable) {
    const inner = host.querySelector('[contenteditable="true"]');
    return inner || host;
  }
  return host; // textarea/input
}

// beforeinput helper for non-ChatGPT editors
function dispatchEditorInsert(el, type) {
  try {
    const before = new InputEvent('beforeinput', { inputType: type, bubbles: true, cancelable: true, composed: true, data: null });
    const notCanceled = el.dispatchEvent(before);
    if (!notCanceled || before.defaultPrevented) return true; // editor handled it
    const input = new InputEvent('input', { inputType: type, bubbles: true, cancelable: false, composed: true, data: null });
    el.dispatchEvent(input);
    return true;
  } catch { return false; }
}

// After-frame fix if PM normalized to space
function ensureBreakIfSpace(root) {
  try {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    let sc = sel.anchorNode;
    let so = sel.anchorOffset;

    if (sc && sc.nodeType === Node.ELEMENT_NODE) {
      const prev = sc.childNodes[so - 1] || sc.childNodes[so];
      if (prev && prev.nodeType === Node.TEXT_NODE) { sc = prev; so = prev.textContent.length; }
    }
    if (!sc) return false;

    if (sc.nodeType === Node.TEXT_NODE) {
      const text = sc.textContent || '';
      if (so > 0 && text[so - 1] === ' ') {
        const parent = sc.parentNode;
        const before = text.slice(0, so - 1);
        const after = text.slice(so);
        sc.textContent = before;
        const br = document.createElement('br');
        const zwsp = document.createTextNode('\u200B');
        const afterNode = document.createTextNode(after);
        if (sc.nextSibling) parent.insertBefore(br, sc.nextSibling);
        else parent.appendChild(br);
        parent.insertBefore(zwsp, br.nextSibling);
        parent.insertBefore(afterNode, zwsp.nextSibling);

        const nr = document.createRange();
        nr.setStartAfter(zwsp);
        nr.collapse(true);
        sel.removeAllRanges();
        sel.addRange(nr);
        return true;
      }
    }
  } catch {}
  return false;
}

// Manual <br> + zero-width space at current selection inside root
function manualBrAtSelection(root) {
  try {
    const sel = window.getSelection();
    if (!sel) return;
    if (!sel.rangeCount || !root.contains(sel.anchorNode)) {
      const r = document.createRange();
      r.selectNodeContents(root);
      r.collapse(false);
      sel.removeAllRanges();
      sel.addRange(r);
    }
    const r = sel.getRangeAt(0);
    r.deleteContents();
    const br = document.createElement('br');
    r.insertNode(br);
    const zwsp = document.createTextNode('\u200B');
    br.after(zwsp);
    const nr = document.createRange();
    nr.setStartAfter(zwsp);
    nr.collapse(true);
    sel.removeAllRanges();
    sel.addRange(nr);
  } catch {}
}

// ---- Sending (site-specific) ----
function sendMessageByDomain(el) {
  const host = location.hostname.toLowerCase();

  if (domainMatches(CHATGPT_DOMAINS)) {
    if (sendChatGPT()) return;
  } else if (host.endsWith('lmarena.ai') || host === 'www.lmarena.ai') {
    if (sendLMArena(el)) return;
  } else if (host.endsWith('deepseek.com')) {
    if (sendDeepSeek(el)) return;
  }
  if (genericSend(el)) return;

  const evt = new Event('submit', { bubbles: true, cancelable: true });
  el?.dispatchEvent?.(evt);
}

function sendChatGPT() {
  const candidates = document.querySelectorAll(
    'button[data-testid="send-button"]:not([disabled]), ' +
    'button[aria-label*="send" i]:not([disabled]), ' +
    'button[type="submit"]:not([disabled])'
  );
  for (const btn of candidates) { btn.click(); return true; }
  return false;
}
function sendLMArena(el) {
  const form = el?.form || el?.closest?.('form');
  if (form) {
    const btn = form.querySelector('button[type="submit"]:not([disabled])');
    if (btn) { btn.click(); return true; }
    if (form.requestSubmit) { form.requestSubmit(); return true; }
    form.submit(); return true;
  }
  return false;
}
function sendDeepSeek(el) {
  const root = el?.closest?.('._24fad49, .dd442025') || document;
  const btn = root.querySelector(
    'button[type="submit"]:not([disabled]), ' +
    '[role="button"][aria-label*="send" i]:not([aria-disabled="true"]), ' +
    'button[aria-label*="send" i]:not([disabled])'
  );
  if (btn) { btn.click(); return true; }
  try {
    const area = document.querySelector('#chat-input') || el;
    if (area) {
      const ev = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true });
      area.dispatchEvent(ev);
      return true;
    }
  } catch {}
  return false;
}
function genericSend(el) {
  const form = el?.form || el?.closest?.('form');
  if (form) {
    const btn = form.querySelector('button[type="submit"]:not([disabled])');
    if (btn) { btn.click(); return true; }
    if (form.requestSubmit) { form.requestSubmit(); return true; }
    form.submit(); return true;
  }
  const root = el?.closest?.('form, [role="form"], [data-chat-root]') || document;
  const candidates = root.querySelectorAll(
    'button[type="submit"]:not([disabled]), ' +
    'button[data-testid*="send"]:not([disabled]), ' +
    'button[aria-label*="send" i]:not([disabled]), ' +
    '[role="button"][aria-label*="send" i]'
  );
  if (candidates.length) { candidates[0].click(); return true; }
  return false;
}

// Keep highlights healthy if selection changes (CSS Highlights auto-update)
document.addEventListener('selectionchange', () => { if (!config.enabled) return; });