import { useEffect, useState } from "react";

export default function App() {
  const [tabTimes, setTabTimes] = useState({});

  useEffect(() => {
    chrome.runtime.sendMessage({ action: "getTabTimes" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error:", chrome.runtime.lastError.message);
        return;
      }
      setTabTimes(response || {});
    });
  }, []);

  return (
    <div className="p-4 w-96">
      <h2 className="text-lg font-bold">FocusTab</h2>
      <ul className="mt-2">
        {Object.entries(tabTimes).map(([tabId, time]) => (
          <li key={tabId} className="text-sm">
            Tab {tabId}: {(time / 1000).toFixed(1)}s
          </li>
        ))}
      </ul>
    </div>
  );
}
