import React, { useEffect, useState } from 'react';
import { GrAnalytics } from "react-icons/gr";
import Details from "./Details";
import { Switch } from '@headlessui/react';

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
  const [isTracking, setIsTracking] = useState(false); // Predvolene vypnuté
  const [view, setView] = useState("home");
  const [enabled, setEnabled] = useState(false); // Predvolene vypnuté

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
      
      // Správne nastavenie sledovania podľa uloženej hodnoty (alebo false ak neexistuje)
      const trackingState = data.isTracking ?? false;
      setIsTracking(trackingState);
      setEnabled(trackingState);
    });

    fetchTimes();
    const intervalId = setInterval(fetchTimes, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Prepína sledovanie ON/OFF
  const toggleTracking = () => {
    const newTrackingState = !isTracking;
    setIsTracking(newTrackingState);
    setEnabled(newTrackingState);
    
    // Uloženie novej hodnoty do storage
    chrome.storage.local.set({ isTracking: newTrackingState });

    // Poslať do background skriptu
    chrome.runtime.sendMessage({ type: 'toggleTracking', isTracking: newTrackingState });
  };

  return (
    <div>
      {view === "home" ? (
        <div className="w-[500px] flex flex-col justify-center items-center bg-[#212329] text-white">
          <Switch
            checked={enabled}
            onChange={() => { setEnabled(!enabled); toggleTracking(); }}
            className={`${enabled ? 'bg-blue-600' : 'bg-[#3f3f3f]'} group inline-flex h-6 w-11 items-center rounded-full transition my-4`}
          >
            <span className={`${enabled ? 'translate-x-6' : 'translate-x-1'} size-4 rounded-full bg-white transition`} />
          </Switch>
          <ul className="w-[90%]">
            {Object.entries(times).map(([domain, time]) => (
              <li key={domain} className="w-full flex justify-between bg-[#3f3f3f] p-2 text-white mb-2 rounded-sm">
                <span>{domain}</span>
                <br />
                <span>{formatTime(time)}</span>
              </li>
            ))}
          </ul>
          <div className='absolute top-5 right-5' onClick={() => setView("details")}>
            <GrAnalytics color='#2563eb' size='20' />
          </div>
        </div>
      ) : (
        <Details onBack={() => setView("home")} />
      )}
    </div>
  );
}

export default App;
