import React, { useEffect, useState } from 'react';
import { GrAnalytics } from "react-icons/gr";
import { Switch } from '@headlessui/react';

function App() {
  const [times, setTimes] = useState({});
  const [tabClicks, setTabClicks] = useState({});
  const [view, setView] = useState("home");
  const [value, setValue] = useState("");
  const [enabled, setEnabled] = useState(false); // Predvolene vypnuté
  const [isTracking, setIsTracking] = useState(false); // Predvolene vypnuté

  function handleChange(e) {
    setValue(e.target.value);
  }

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
    <div className='w-full flex justify-between items-center px-6'>
                <Switch
                  checked={enabled}
                  onChange={() => { setEnabled(!enabled); toggleTracking(); }}
                  className={`${enabled ? 'bg-blue-600' : 'bg-[#3f3f3f]'} group inline-flex h-6 w-11 items-center rounded-full transition my-4`}
                >
                  <span className={`${enabled ? 'translate-x-6' : 'translate-x-1'} size-4 rounded-full bg-white transition`} />
                </Switch>
                <input className='w-1/2 h-7 bg-white text-black my-4 rounded-lg p-2 border outline-none focus:outline-none focus:ring-0 focus:border-transparent' placeholder='Name of tab' onChange={handleChange}/>
                <GrAnalytics color='#2563eb' size='20' onClick={() => setView("details")} />
              </div>
  );
}

export default Navigation;
