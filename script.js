let targetDate = new Date("Oct 31, 2026 20:00:00").getTime();

dayElem = document.getElementById("days")
hourElem = document.getElementById("hours")
minElem = document.getElementById("min")
secondElem = document.getElementById("seconds")

let countdownTimer = setInterval(()=> {
    let now = new Date().getTime();

    let timeDiff = targetDate- now;

    let days = Math.floor(timeDiff / (1000 * 60 * 24));
    let hours = Math.floor(((timeDiff - 1000 * 60 * 24 * days) % (1000 *60 * 60 *24)) / (1000 * 60 * 60));
    let minutes = Math.floor(timeDiff / (1000 * 60 * 60)) / (1000 * 60);
    let seconds = Math.floor(timeDiff / (1000 * 60)) / 1000;
})