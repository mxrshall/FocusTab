import React, { useEffect, useState } from 'react';
import { GrAnalytics } from "react-icons/gr";
import { Switch } from '@headlessui/react';
import Details from "./Details";

const formatTime = (ms) => {
  let seconds = Math.floor(ms / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);

  seconds = seconds % 60;
  minutes = minutes % 60;

  return `${hours > 0 ? `${hours}h ` : ""}${minutes > 0 ? `${minutes}m ` : ""}${seconds}s`;
};

function App() {
  const [times, setTimes] = useState({});
  const [view, setView] = useState("home");
  const [value, setValue] = useState("");
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    const fetchTimes = () => {
      chrome.runtime.sendMessage({ type: 'getTimes' }, (response) => {
        if (response) setTimes(response.domainTimes || {});
      });
    };

    chrome.storage.local.get(['domainTimes', 'isTracking'], (data) => {
      if (data.domainTimes) setTimes(data.domainTimes);
      if (data.isTracking !== undefined) setIsTracking(data.isTracking);
    });

    fetchTimes();
    const intervalId = setInterval(fetchTimes, 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.isTracking) {
        setIsTracking(changes.isTracking.newValue);
      }
    });
  }, []);

  const toggleTracking = () => {
    const newTrackingState = !isTracking;
    setIsTracking(newTrackingState);
    chrome.storage.local.set({ isTracking: newTrackingState });
    chrome.runtime.sendMessage({ type: 'toggleTracking', isTracking: newTrackingState });
  };

  const filteredDomains = Object.keys(times).filter((domain) =>
    domain.toLowerCase().includes(value.toLowerCase())
  );

  const sortedDomains = filteredDomains.sort((a, b) => times[b] - times[a]);
  const totalTime = Object.values(times).reduce((acc, curr) => acc + curr, 0);

  return (
    <div>
      {view === "home" ? (
        <div className="w-[500px] flex flex-col justify-center items-center bg-[#212329] text-white">
          <div className='w-full flex justify-between items-center px-6'>
            <Switch
              checked={isTracking}
              onChange={toggleTracking}
              className={`${isTracking ? 'bg-blue-600' : 'bg-[#3f3f3f]'} group inline-flex h-6 w-11 items-center rounded-full transition my-4`}
            >
              <span className={`${isTracking ? 'translate-x-6' : 'translate-x-1'} size-4 rounded-full bg-white transition`} />
            </Switch>
            <input className='w-1/2 h-7 bg-white text-black my-4 rounded-lg p-2 border outline-none focus:outline-none focus:ring-0 focus:border-transparent' placeholder='Name of tab' onChange={(e) => setValue(e.target.value)} />
            <GrAnalytics color='#2563eb' size='20' onClick={() => {setView("details"); setValue("")}} />
          </div>
          <ul className="w-[90%]">
            <li className="w-full flex justify-between bg-[#3f3f3f] p-2 text-white mb-2 rounded-sm font-bold">
              <div>
                <span>Total time</span>
              </div>
              <span>{formatTime(totalTime)}</span>
            </li>
            {sortedDomains.map((domain) => (
              <li key={domain} className="w-full flex justify-between bg-[#3f3f3f] p-2 text-white mb-2 rounded-sm">
                <div>
                  <span>{domain}</span>
                </div>
                <span>{formatTime(times[domain])}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <Details onBack={() => setView("home")} isTracking={isTracking} toggleTracking={toggleTracking} />
      )}
    </div>
  );
}

export default App;