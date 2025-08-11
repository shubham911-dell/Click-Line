// Background service worker: context menus + open searches
const IDS = {
  GOOGLE: 'wss_google',
  YT: 'wss_yt',
  WIKI: 'wss_wiki',
  MULTI: 'wss_multi',
  COMBINED: 'wss_combined'
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: IDS.GOOGLE, title: 'Search Google for selection(s)', contexts: ['all'] });
    chrome.contextMenus.create({ id: IDS.YT, title: 'Search YouTube for selection(s)', contexts: ['all'] });
    chrome.contextMenus.create({ id: IDS.WIKI, title: 'Search Wikipedia for selection(s)', contexts: ['all'] });
    chrome.contextMenus.create({ id: IDS.MULTI, title: 'MultiSearch (open one tab per selection)', contexts: ['all'] });
    chrome.contextMenus.create({ id: IDS.COMBINED, title: 'CombinedSearch (combine selections into one query)', contexts: ['all'] });
  });
});

function openTabsForQueries(queries, prefix) {
  for (const q of queries) {
    if (!q || !q.trim()) continue;
    chrome.tabs.create({ url: prefix + encodeURIComponent(q.trim()), active: false });
  }
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: 'getSelections' }, (resp) => {
    const selections = resp && resp.selections ? resp.selections.map(s => s.text) : [];
    if (info.menuItemId === IDS.GOOGLE) {
      const q = selections.join(' ');
      if (q) chrome.tabs.create({ url: `https://www.google.com/search?q=${encodeURIComponent(q)}` });
    } else if (info.menuItemId === IDS.YT) {
      const q = selections.join(' ');
      if (q) chrome.tabs.create({ url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` });
    } else if (info.menuItemId === IDS.WIKI) {
      const q = selections.join(' ');
      if (q) chrome.tabs.create({ url: `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(q)}` });
    } else if (info.menuItemId === IDS.MULTI) {
      openTabsForQueries(selections, 'https://www.google.com/search?q=');
    } else if (info.menuItemId === IDS.COMBINED) {
      const q = selections.join(' ');
      if (q) chrome.tabs.create({ url: `https://www.google.com/search?q=${encodeURIComponent(q)}` });
    }
  });
});