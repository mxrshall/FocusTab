let activeTabId = null;
let domainTimes = {};
let tabClicks = {}; // Počet preklikov medzi kartami
let activeDomain = null;
let startTime = null;
let isTracking = false;

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
chrome.storage.local.get(['domainTimes', 'isTracking', 'tabClicks'], (data) => {
  if (data.domainTimes) domainTimes = data.domainTimes;
  if (data.tabClicks) tabClicks = data.tabClicks;
  
  if (data.isTracking === undefined) {
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
    startTime = isTracking ? Date.now() : null;

    // Zvýšiť počet preklikov pre doménu
    if (activeDomain) {
      tabClicks[activeDomain] = (tabClicks[activeDomain] || 0) + 1;
      chrome.storage.local.set({ tabClicks });
    }
  });
});

// Spracovanie správ z popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getTimes') {
    updateTimes();
    sendResponse({ domainTimes, tabClicks });
  } else if (message.type === 'toggleTracking') {
    updateTimes();
    isTracking = message.isTracking;
    chrome.storage.local.set({ isTracking });

    if (!isTracking) {
      startTime = null;
    } else {
      startTime = Date.now();
    }
  }
});
