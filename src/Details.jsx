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

  return `${hours > 0 ? `${hours}h ` : ""}${minutes > 0 ? `${minutes}m ` : ""}${seconds}s`;
};

const generateRandomHexColor = () => `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

function Details({ onBack }) {
  const [times, setTimes] = useState({});
  const [tabClicks, setTabClicks] = useState({});
  const [colors, setColors] = useState({});

  useEffect(() => {
    const fetchTimes = () => {
      chrome.runtime.sendMessage({ type: 'getTimes' }, (response) => {
        if (response) setTimes(response.domainTimes || {});
      });
    };

    chrome.storage.local.get(['domainTimes', 'tabClicks'], (data) => {
      if (data.domainTimes) setTimes(data.domainTimes);
      if (data.tabClicks) setTabClicks(data.tabClicks);
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

  const sortedDomains = Object.keys(times).sort((a, b) => times[b] - times[a]);
  const sortedTimeValues = sortedDomains.map((domain) => times[domain]);

  return (
    <div className="w-[500px] flex flex-col justify-center items-center bg-[#212329] text-white">
      <h1 className="text-3xl my-3">FocusTab</h1>

      <ul className="w-[90%]">
        {sortedDomains.map((domain) => (
          <li key={domain} className="w-full flex justify-between bg-[#3f3f3f] p-2 text-white mb-2 rounded-sm">
            <div>
              <span>{domain}</span>
              <br />
              <span className="text-gray-400 text-sm">Prekliky: {tabClicks[domain] || 0}</span>
            </div>
            <span>{formatTime(times[domain])}</span>
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
                backgroundColor: sortedDomains.map((domain) => colors[domain]),
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
