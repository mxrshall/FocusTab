let tabTimes = {};
let activeTab = null;
let startTime = null;

chrome.tabs.onActivated.addListener(({ tabId }) => {
  if (activeTab !== null) {
    tabTimes[activeTab] = (tabTimes[activeTab] || 0) + (Date.now() - startTime);
  }
  activeTab = tabId;
  startTime = Date.now();
});

chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabTimes[tabId];
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTabTimes") {
    sendResponse(tabTimes);
  }
});
