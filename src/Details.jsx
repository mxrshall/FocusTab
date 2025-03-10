import React, { useEffect, useState } from 'react';
import { FaHome } from "react-icons/fa";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

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

const generateRandomHexColor = () => {
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
};

function Details({ onBack }) {
  const [times, setTimes] = useState({});
  const [isTracking, setIsTracking] = useState(true);
  const [colors, setColors] = useState({});

  useEffect(() => {
    const fetchTimes = () => {
      chrome.runtime.sendMessage({ type: 'getTimes' }, (response) => {
        if (response) {
          setTimes(response.domainTimes || {});
        }
      });
    };

    chrome.storage.local.get(['domainTimes', 'isTracking'], (data) => {
      if (data.domainTimes) setTimes(data.domainTimes);
      setIsTracking(data.isTracking ?? false);
    });

    fetchTimes();
    const intervalId = setInterval(fetchTimes, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Nastavenie farieb pre domény
  useEffect(() => {
    setColors((prevColors) => {
      const newColors = { ...prevColors };
      Object.keys(times).forEach((domain) => {
        if (!newColors[domain]) {
          newColors[domain] = generateRandomHexColor();
        }
      });
      return newColors;
    });
  }, [Object.keys(times).join(",")]); // Použitie unikátneho kľúča pre aktualizáciu

  // Zoradenie domén podľa času
  const sortedDomains = Object.keys(times).sort((a, b) => times[b] - times[a]);
  const sortedTimeValues = sortedDomains.map((domain) => times[domain]);

  return (
    <div className="w-[500px] flex flex-col justify-center items-center bg-[#212329] text-white">
      <h1 className="text-3xl my-3">FocusTab</h1>

      <ul className="w-[90%]">
        {sortedDomains.map((domain, index) => (
          <li key={index} className="w-full flex justify-between bg-[#3f3f3f] p-2 text-white mb-2 rounded-sm">
            <span>{domain}</span>
            <span>{formatTime(sortedTimeValues[index])}</span>
          </li>
        ))}
      </ul>

      {sortedDomains.length > 0 && (
        <Doughnut
          data={{
            labels: sortedDomains,
            datasets: [
              {
                label: "Čas strávený na stránkach",
                data: sortedTimeValues,
                backgroundColor: sortedDomains.map((domain) => colors[domain] || '#000000'),
              },
            ],
          }}
        />
      )}

      <div className="absolute top-5 right-5 cursor-pointer" onClick={onBack}>
        <FaHome color="green" size="20" />
      </div>
    </div>
  );
}

export default Details;
