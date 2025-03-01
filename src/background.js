let activeTabId = null;
let domainTimes = {};
let activeDomain = null;
let startTime = null;
let isTracking = true; // Predvolené zapnuté

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function updateTimes() {
  if (isTracking && activeDomain && startTime) {
    const currentTime = Date.now();
    domainTimes[activeDomain] = (domainTimes[activeDomain] || 0) + (currentTime - startTime);
    startTime = currentTime;

    chrome.storage.local.set({ domainTimes });
  }
}

// Načítať uložené údaje pri spustení
chrome.storage.local.get(['domainTimes', 'isTracking'], (data) => {
  if (data.domainTimes) domainTimes = data.domainTimes;
  if (data.isTracking !== undefined) isTracking = data.isTracking;
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    updateTimes();
    if (isTracking) {
      activeTabId = tabId;
      activeDomain = getDomain(tab.url);
      startTime = Date.now();
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tabId === activeTabId) {
    updateTimes();
    if (isTracking) {
      activeDomain = getDomain(tab.url);
      startTime = Date.now();
    }
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) {
    updateTimes();
    activeTabId = null;
    activeDomain = null;
    startTime = null;
  }
});

// Spracovanie správ z popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getTimes') {
    updateTimes();
    sendResponse(domainTimes);
  } else if (message.type === 'toggleTracking') {
    updateTimes(); // Uloží aktuálny čas pred prepnutím
    isTracking = message.isTracking;
    chrome.storage.local.set({ isTracking });

    if (!isTracking) {
      startTime = null; // Reset startTime pri vypnutí sledovania
    } else {
      startTime = Date.now(); // Reštart sledovania bez dodatočného času
    }
  }
});
