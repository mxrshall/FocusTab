let timerInterval;
let time = 0;

// Funkcia na spustenie časovača
function startTimer() {
    if (!timerInterval) {
        timerInterval = setInterval(() => {
            time += 1; // Zvýšime čas o 1 sekundu
            console.log('Timer running: ', time); // Log pre debugging
            chrome.runtime.sendMessage({ type: 'UPDATE_TIME', time }); // Posielame aktuálny čas do popupu
        }, 1000);
    }
}

// Funkcia na zastavenie časovača
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        console.log('Timer stopped'); // Log pre debugging
    }
}

// Poslucháč na správy z popupu
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'START_TIMER') {
        console.log('Received START_TIMER message');
        startTimer(); // Spustíme časovač
    } else if (message.type === 'STOP_TIMER') {
        console.log('Received STOP_TIMER message');
        stopTimer(); // Zastavíme časovač
    }
});
