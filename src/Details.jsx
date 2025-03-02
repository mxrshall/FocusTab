import React, { useEffect, useState } from 'react';
import { SiGoogleanalytics } from "react-icons/si";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

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

function Details({ onBack }) {
  const [times, setTimes] = useState({});
  const [isTracking, setIsTracking] = useState(true);

  ChartJS.register(ArcElement, Tooltip, Legend);

  useEffect(() => {
    const fetchTimes = () => {
      chrome.runtime.sendMessage({ type: 'getTimes' }, (response) => {
        setTimes(response);
      });
    };
  
    chrome.storage.local.get(['domainTimes', 'isTracking'], (data) => {
      if (data.domainTimes) setTimes(data.domainTimes);
      setIsTracking(data.isTracking ?? false); // Predvolene false, ak nie je v storage
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
    <div className="w-[500px] flex flex-col justify-center items-center bg-[#212329] text-white">
      <h1 className="text-3xl my-3">FocusTabbb</h1>

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
            <span>{domain}</span>
            <span>{formatTime(time)}</span>
          </li>
        ))}
      </ul>
      <Doughnut
        data={{
          labels: ['1', '2', '3'],
          datasets: [
            {
              label: "Count",
              data: [100, 15, 95],
              backgroundColor: [
                "rgba(229, 161, 43, 0.8)",
                "rgba(24, 100, 129, 0.8)",
                "rgba(43, 23, 249, 0.8)"
              ],
            }
          ]
        }}
      />
      <div className='absolute top-5 right-5' onClick={onBack}>
        <SiGoogleanalytics color='green' size='20' />
      </div>
    </div>
  );
}

export default Details;
