let activeTabId = null;
let domainTimes = {};
let tabClicks = {};
let activeDomain = null;
let startTime = null;
let isTracking = false;
let intervalId = null;

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

    chrome.storage.local.set({ domainTimes }, () => {
      if (chrome.runtime.lastError) {
        console.error("Chyba pri ukladaní času:", chrome.runtime.lastError);
      }
    });
  }
}

function startTrackingInterval() {
  if (!intervalId) {
    intervalId = setInterval(updateTimes, 5000);
  }
}

// Načítanie uložených dát pri štarte
chrome.storage.local.get(['domainTimes', 'isTracking', 'tabClicks'], (data) => {
  if (data.domainTimes) domainTimes = data.domainTimes;
  if (data.tabClicks) tabClicks = data.tabClicks;  // 🔹 Obnova tabClicks
  
  isTracking = data.isTracking ?? false;
  if (isTracking) {
    startTrackingInterval();
  }
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    updateTimes();
    activeTabId = tabId;
    activeDomain = getDomain(tab.url);
    startTime = isTracking ? Date.now() : null;

    if (activeDomain) {
      tabClicks[activeDomain] = (tabClicks[activeDomain] || 0) + 1;
      
      // Uloženie `tabClicks` do `chrome.storage.local`
      chrome.storage.local.set({ tabClicks }, () => {
        if (chrome.runtime.lastError) {
          console.error("Chyba pri ukladaní preklikov:", chrome.runtime.lastError);
        }
      });
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    updateTimes();
    activeDomain = getDomain(changeInfo.url);
    startTime = isTracking ? Date.now() : null;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getTimes') {
    updateTimes();
    sendResponse({ domainTimes, tabClicks }); // 🔹 Odosielanie `tabClicks`
  } else if (message.type === 'toggleTracking') {
    updateTimes();
    isTracking = message.isTracking;
    chrome.storage.local.set({ isTracking });

    if (!isTracking) {
      clearInterval(intervalId);
      intervalId = null;
      startTime = null;
    } else {
      startTime = Date.now();
      startTrackingInterval();
    }
  }
});

// Pri štarte rozšírenia nastavíme `activeDomain`
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs.length > 0) {
    const tab = tabs[0];
    activeTabId = tab.id;
    activeDomain = getDomain(tab.url);
    startTime = isTracking ? Date.now() : null;
  }
});