const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const messageEl = document.getElementById("message");

// Konfiguracja: lokalna północ 1 stycznia 2026
const targetDate = new Date(2026, 0, 1, 0, 0, 0);
let tickerId;

const format = (value) => value.toString().padStart(2, "0");

const toParts = (ms) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
};

const renderCountdown = ({ days, hours, minutes, seconds }) => {
  daysEl.textContent = days.toString();
  hoursEl.textContent = format(hours);
  minutesEl.textContent = format(minutes);
  secondsEl.textContent = format(seconds);
};

const update = () => {
  const diff = targetDate - new Date();
  if (diff <= 0) {
    renderCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    messageEl.textContent = "Witaj w 2026! Wszystkiego najlepszego w Nowym Roku.";
    clearInterval(tickerId);
    return;
  }
  renderCountdown(toParts(diff));
};

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    update();
  }
});

update();
tickerId = setInterval(update, 1000);
