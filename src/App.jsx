import React, { useState, useEffect } from 'react';

const App = () => {
    const [tabsInfo, setTabsInfo] = useState([]); // Stav na uchovávanie všetkých tabov
    const [time, setTime] = useState(0); // Stav na uchovávanie času
    const [isTimerRunning, setIsTimerRunning] = useState(false); // Stav na kontrolu, či časovač beží

    // Funkcia na získanie informácií o všetkých kartách
    const logTabsInfo = () => {
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
            const allTabsInfo = tabs.map(tab => ({
                id: tab.id,
                url: tab.url
            }));
            setTabsInfo(allTabsInfo); // Nastavíme všetky taby do stavu
        });
    };

    // Funkcia na spustenie a zastavenie časovača
    const toggleTimer = () => {
        if (isTimerRunning) {
            chrome.runtime.sendMessage({ type: 'STOP_TIMER' }); // Posielame STOP_TIMER správu
        } else {
            chrome.runtime.sendMessage({ type: 'START_TIMER' }); // Posielame START_TIMER správu
        }
        setIsTimerRunning(!isTimerRunning); // Prepneme stav timeru
    };

    // Po zobrazení popupu dostávame aktuálny čas
    useEffect(() => {
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'UPDATE_TIME') {
                setTime(message.time); // Aktualizujeme čas podľa správ z pozadia
            }
        });
        logTabsInfo(); // Načítame informácie o kartách pri načítaní
    }, []);

    return (
        <div>
            <button onClick={logTabsInfo}>Log All Tabs Info</button>
            <h1>All Tab Info</h1>
            {tabsInfo.length > 0 ? (
                tabsInfo.map((tab, index) => (
                    <div key={index}>
                        <p>Tab ID: {tab.id}</p>
                        <p>Tab URL: {tab.url}</p>
                    </div>
                ))
            ) : (
                <p>No tabs found</p>
            )}
            <h2>Timer: {time} seconds</h2> {/* Zobrazenie času */}
            <button onClick={toggleTimer}>
                {isTimerRunning ? 'Stop Timer' : 'Start Timer'}
            </button>
        </div>
    );
};

export default App;
