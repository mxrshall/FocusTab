let activeTabId = null;
let domainTimes = {};
let tabClicks = {};
let activeDomain = null;
let startTime = null;
let isTracking = false;
let intervalId = null; // ID intervalu pre kontrolu

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
      } else {
        console.log("Uložený čas pre", activeDomain, ":", domainTimes[activeDomain]);
      }
    });
  }
}

// Spustiť interval iba raz
function startTrackingInterval() {
  if (!intervalId) {
    console.log("Spúšťam interval pre sledovanie...");
    intervalId = setInterval(updateTimes, 5000);
  }
}

// Načítať uložené údaje pri spustení
chrome.storage.local.get(['domainTimes', 'isTracking', 'tabClicks'], (data) => {
  if (data.domainTimes) domainTimes = data.domainTimes;
  if (data.tabClicks) tabClicks = data.tabClicks;
  
  isTracking = data.isTracking ?? false;
  console.log("Načítaný isTracking:", isTracking);
  
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

    console.log("Toggle tracking:", isTracking);
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
