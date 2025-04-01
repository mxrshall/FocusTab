import React, { useEffect, useState } from 'react';
import { FaHome } from "react-icons/fa";
import { Switch } from '@headlessui/react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { MdOutlineKeyboardArrowUp } from "react-icons/md";

ChartJS.register(ArcElement, Tooltip, Legend);

const generateRandomHexColor = () => `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

function Details({ onBack }) {
  const [times, setTimes] = useState({});
  const [tabClicks, setTabClicks] = useState({});
  const [colors, setColors] = useState({});
  const [value, setValue] = useState("");
  const [isTracking, setIsTracking] = useState(false); // Predvolene vypnuté
  const [enabled, setEnabled] = useState(false); // Predvolene vypnuté
  const [isLegendVisible, setIsLegendVisible] = useState(false);

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
      
      const trackingState = data.isTracking ?? false;
      setIsTracking(trackingState);
      setEnabled(trackingState);
    });

    fetchTimes();
    const intervalId = setInterval(fetchTimes, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setColors((prevColors) => {
      return Object.keys(times).reduce((newColors, domain) => {
        newColors[domain] = prevColors[domain] || generateRandomHexColor();
        return newColors;
      }, {});
    });
  }, [times]);

  function handleChange(e) {
    setValue(e.target.value);
  }

  const toggleTracking = () => {
    const newTrackingState = !isTracking;
    setIsTracking(newTrackingState);
    setEnabled(newTrackingState);
    
    chrome.storage.local.set({ isTracking: newTrackingState });
    chrome.runtime.sendMessage({ type: 'toggleTracking', isTracking: newTrackingState });
  };

  const filteredDomains = Object.keys(times).filter((domain) =>
    domain.toLowerCase().includes(value.toLowerCase())
  );

  const sortedDomains = filteredDomains.sort((a, b) => times[b] - times[a]);
  const sortedTimeValues = sortedDomains.map((domain) => times[domain]);

  return (
    <div className="w-[500px] flex flex-col justify-center items-center bg-[#212329] text-white">
      <div className='w-full flex justify-between items-center px-6'>
        <Switch
          checked={enabled}
          onChange={() => { setEnabled(!enabled); toggleTracking(); }}
          className={`${enabled ? 'bg-blue-600' : 'bg-[#3f3f3f]'} group inline-flex h-6 w-11 items-center rounded-full transition my-4`}
        >
          <span className={`${enabled ? 'translate-x-6' : 'translate-x-1'} size-4 rounded-full bg-white transition`} />
        </Switch>
        <input className='w-1/2 h-7 bg-white text-black my-4 rounded-lg p-2 border outline-none focus:outline-none focus:ring-0 focus:border-transparent' placeholder='Name of tab' onChange={handleChange}/>
        <FaHome color="#2563eb" size="20" onClick={onBack}/>
      </div>

      {sortedDomains.length > 0 && (
        <>
          <Doughnut
            className='mb-2'
            data={{
              labels: sortedDomains,
              datasets: [
                {
                  label: "Čas strávený na stránkach",
                  data: sortedTimeValues,
                  backgroundColor: sortedDomains.map((domain) => colors[domain]),
                  borderColor: sortedDomains.map((domain) => colors[domain]),
                },
              ],
            }}
            options={{
              animation: {
                duration: isLegendVisible ? 100 : 500,
                easing: 'easeOutQuad',
              },
              plugins: {
                legend: {
                  display: isLegendVisible,
                  position: 'bottom', 
                  labels: {
                    boxWidth: 12,
                    boxHeight: 12,
                    padding: 10,
                    font: {
                      size: 13,
                      weight: 'bold',
                      family: 'Montserrat, sans-serif',
                    },
                  },
                },
                tooltip: {
                  callbacks: {
                    label: (tooltipItem) => {
                      let totalSeconds = tooltipItem.raw;
                      let seconds = Math.floor(totalSeconds / 1000);
                      let minutes = Math.floor(seconds / 60);
                      let hours = Math.floor(minutes / 60);
                      seconds = seconds % 60;
                      minutes = minutes % 60;

                      return `${hours > 0 ? `${hours}h ` : ""}${minutes > 0 ? `${minutes}m ` : ""}${seconds}s`;
                    }
                  }
                }
              },
            }}
          />
          <div onClick={() => setIsLegendVisible(!isLegendVisible)}>
            {isLegendVisible ? <MdOutlineKeyboardArrowUp color="white" size='32'/> : <MdOutlineKeyboardArrowDown color="white" size='32'/>}
          </div>
        </>
      )}
    </div>
  );
}

export default Details;
