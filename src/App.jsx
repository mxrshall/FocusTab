import React, { useEffect, useState } from 'react';
import { SiGoogleanalytics } from "react-icons/si";
import Details from "./Details";

const formatTime = (ms) => {
  let seconds = Math.floor(ms / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);

  seconds = seconds % 60;
  minutes = minutes % 60;

  let formattedTime = `${seconds}s`;
  if (minutes > 0) formattedTime = `${minutes}m ${formattedTime}`;
  if (hours > 0) formattedTime = `${hours}h ${formattedTime}`;
  return formattedTime;
};

function App() {
  const [times, setTimes] = useState({});
  const [tabClicks, setTabClicks] = useState({});
  const [isTracking, setIsTracking] = useState(true);
  const [view, setView] = useState("home");

  useEffect(() => {
    const fetchTimes = () => {
      chrome.runtime.sendMessage({ type: 'getTimes' }, (response) => {
        if (response) {
          setTimes(response.domainTimes || {});
          setTabClicks(response.tabClicks || {});
        }
      });
    };
  
    chrome.storage.local.get(['domainTimes', 'tabClicks', 'isTracking'], (data) => {
      if (data.domainTimes) setTimes(data.domainTimes);
      if (data.tabClicks) setTabClicks(data.tabClicks);
      setIsTracking(data.isTracking ?? false);
    });
  
    fetchTimes();
    const intervalId = setInterval(fetchTimes, 1000);
  
    return () => clearInterval(intervalId);
  }, []);

  // Prepína sledovanie ON/OFF
  const toggleTracking = () => {
    const newTrackingState = !isTracking;
    setIsTracking(newTrackingState);
    chrome.storage.local.set({ isTracking: newTrackingState });

    // Poslať do background skriptu, aby prestal sledovať
    chrome.runtime.sendMessage({ type: 'toggleTracking', isTracking: newTrackingState });
  };

  return (
    <div>
      {view === "home" ? (
        <div className="w-[500px] flex flex-col justify-center items-center bg-[#212329] text-white">
          <h1 className="text-3xl my-3">FocusTab</h1>
          <div className="flex space-x-3">
            <button 
              onClick={toggleTracking} 
              className={`px-4 py-2 mb-3 rounded ${isTracking ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {isTracking ? 'Vypnúť meranie' : 'Zapnúť meranie'}
            </button>
          </div>
          <ul className="w-[90%]">
            {Object.entries(times).map(([domain, time]) => (
              <li key={domain} className="w-full flex justify-between bg-[#3f3f3f] p-2 text-white mb-2 rounded-sm">
                <div>
                  <span>{domain}</span>
                  <br />
                  <span className="text-gray-400 text-sm">Prekliky: {tabClicks[domain] || 0}</span>
                </div>
                <span>{formatTime(time)}</span>
              </li>
            ))}
          </ul>
          <div className='absolute top-5 right-5' onClick={() => setView("details")}>
            <SiGoogleanalytics color='green' size='20' />
          </div>
        </div>
      ) : (
        <Details onBack={() => setView("home")} />
      )}
    </div>
  );
}

export default App;
