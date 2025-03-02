let activeTabId = null;
let domainTimes = {};
let activeDomain = null;
let startTime = null;
let isTracking = false; // Predvolene vypnuté

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

  if (data.isTracking === undefined) {
    // Ak sa hodnota isTracking ešte nikdy neuložila, nastavíme ju na false
    chrome.storage.local.set({ isTracking: false });
  } else {
    isTracking = data.isTracking;
  }
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    updateTimes();
    activeTabId = tabId;
    activeDomain = getDomain(tab.url);
    startTime = isTracking ? Date.now() : null; // Ak nie je tracking, nezačne merať
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tabId === activeTabId) {
    updateTimes();
    activeDomain = getDomain(tab.url);
    startTime = isTracking ? Date.now() : null;
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
      startTime = Date.now(); // Resetuje startTime pri zapnutí
    }
  }
});
