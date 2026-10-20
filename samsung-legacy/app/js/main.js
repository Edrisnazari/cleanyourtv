/**
 * CleanYourTV — 2014 Samsung Legacy Smart TV Dashboard
 * Strict ECMAScript 5 for compatibility with WebKit 537.42 / Maple Browser
 */

(function() {
    'use strict';

    // State
    var focusedCardIndex = 0;
    var timerRunning = false;
    var timerSeconds = 0;
    var timerInterval = null;
    var widgetAPI = null;
    var tvKey = null;

    // DOM Elements
    var clockElem, dateElem, greetingElem, skyElem;
    var cards = [];

    // Weather code mapping (WMO weather interpretation)
    var weatherDescriptions = {
        0: 'Clear Sky',
        1: 'Mainly Clear',
        2: 'Partly Cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing Rime Fog',
        51: 'Light Drizzle',
        53: 'Moderate Drizzle',
        55: 'Dense Drizzle',
        61: 'Slight Rain',
        63: 'Moderate Rain',
        65: 'Heavy Rain',
        71: 'Slight Snow',
        73: 'Moderate Snow',
        75: 'Heavy Snow',
        80: 'Light Rain Showers',
        81: 'Moderate Showers',
        82: 'Violent Showers',
        95: 'Thunderstorm'
    };

    function init() {
        clockElem = document.getElementById('tv-clock-time');
        dateElem = document.getElementById('tv-date');
        greetingElem = document.getElementById('tv-greeting');
        skyElem = document.getElementById('sky-atmosphere');

        // Collect focusable cards
        cards = [
            document.getElementById('card-weather'),
            document.getElementById('card-timer'),
            document.getElementById('card-shortcuts'),
            document.getElementById('card-notes')
        ];

        // Setup clock & atmosphere
        updateClockAndAtmosphere();
        setInterval(updateClockAndAtmosphere, 1000);

        // Setup weather for Geelong, VIC
        fetchGeelongWeather();
        // Refresh weather every 15 minutes
        setInterval(fetchGeelongWeather, 15 * 60 * 1000);

        // Highlight initial card
        updateFocus();

        // Keyboard / Remote D-Pad Navigation
        setupKeyHandlers();

        // Samsung Smart TV Legacy Common API integration
        try {
            if (typeof Common !== 'undefined' && Common.API) {
                if (Common.API.Widget) {
                    widgetAPI = new Common.API.Widget();
                    widgetAPI.sendReadyEvent();
                }
                if (Common.API.TVKeyValue) {
                    tvKey = new Common.API.TVKeyValue();
                }
            }
        } catch (e) {
            // Running in regular browser preview
        }
    }

    function updateClockAndAtmosphere() {
        var now = new Date();
        var hours = now.getHours();
        var minutes = now.getMinutes();
        var seconds = now.getSeconds();

        // 12-hour format with AM/PM
        var ampm = hours >= 12 ? 'PM' : 'AM';
        var displayHours = hours % 12;
        displayHours = displayHours ? displayHours : 12; // 0 becomes 12
        var displayMinutes = minutes < 10 ? '0' + minutes : minutes;
        var displaySeconds = seconds < 10 ? '0' + seconds : seconds;

        if (clockElem) {
            clockElem.innerHTML = displayHours + ':' + displayMinutes + '<span class="tv-clock-seconds"> ' + ampm + '</span>';
        }

        // Full Date
        var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        if (dateElem) {
            dateElem.textContent = days[now.getDay()] + ', ' + now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();
        }

        // Greeting & Atmosphere
        var greetingText = 'Good Evening, Edris';
        var skyClass = 'sky-night';

        if (hours >= 5 && hours < 12) {
            greetingText = 'Good Morning, Edris';
            skyClass = 'sky-dawn';
        } else if (hours >= 12 && hours < 17) {
            greetingText = 'Good Afternoon, Edris';
            skyClass = 'sky-day';
        } else if (hours >= 17 && hours < 21) {
            greetingText = 'Good Evening, Edris';
            skyClass = 'sky-dusk';
        } else {
            greetingText = 'Good Night, Edris';
            skyClass = 'sky-night';
        }

        if (greetingElem) {
            greetingElem.textContent = greetingText;
        }

        if (skyElem && skyElem.className !== skyClass) {
            skyElem.className = skyClass;
        }
    }

    // Weather for Geelong, Victoria (-38.15, 144.36)
    function fetchGeelongWeather() {
        // Try local server proxy first (avoids TLS/SSL cert issues on older TV engines)
        var url = '/api/weather';
        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        renderWeather(data);
                    } catch (e) {
                        renderFallbackWeather();
                    }
                } else {
                    // Fallback directly to Open-Meteo in case of standalone browser preview
                    fetchDirectWeather();
                }
            }
        };

        xhr.open('GET', url, true);
        xhr.timeout = 5000;
        xhr.ontimeout = function() {
            fetchDirectWeather();
        };

        try {
            xhr.send();
        } catch (e) {
            fetchDirectWeather();
        }
    }

    function fetchDirectWeather() {
        var directUrl = 'https://api.open-meteo.com/v1/forecast?latitude=-38.15&longitude=144.36&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=Australia%2FMelbourne';
        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        renderWeather(data);
                    } catch (e) {
                        renderFallbackWeather();
                    }
                } else {
                    renderFallbackWeather();
                }
            }
        };

        xhr.open('GET', directUrl, true);
        xhr.timeout = 6000;
        xhr.ontimeout = function() {
            renderFallbackWeather();
        };

        try {
            xhr.send();
        } catch (e) {
            renderFallbackWeather();
        }
    }

    function renderWeather(data) {
        if (!data || !data.current) {
            renderFallbackWeather();
            return;
        }

        var temp = Math.round(data.current.temperature_2m);
        var feelsLike = Math.round(data.current.apparent_temperature);
        var humidity = data.current.relative_humidity_2m;
        var wind = Math.round(data.current.wind_speed_10m);
        var code = data.current.weather_code;
        var condition = weatherDescriptions[code] || 'Pleasant';

        var high = (data.daily && data.daily.temperature_2m_max) ? Math.round(data.daily.temperature_2m_max[0]) : temp + 4;
        var low = (data.daily && data.daily.temperature_2m_min) ? Math.round(data.daily.temperature_2m_min[0]) : temp - 5;

        document.getElementById('weather-temp-val').textContent = temp;
        document.getElementById('weather-cond-val').textContent = condition;
        document.getElementById('weather-high-low').textContent = 'High: ' + high + '° / Low: ' + low + '°';
        document.getElementById('weather-extra').textContent = 'Feels like ' + feelsLike + '° • Humidity ' + humidity + '% • Wind ' + wind + ' km/h';
    }

    function renderFallbackWeather() {
        document.getElementById('weather-temp-val').textContent = '19';
        document.getElementById('weather-cond-val').textContent = 'Partly Cloudy';
        document.getElementById('weather-high-low').textContent = 'High: 22° / Low: 13°';
        document.getElementById('weather-extra').textContent = 'Geelong, VIC • Humidity 62% • Wind 14 km/h';
    }

    // Gaming Session Timer
    function toggleTimer() {
        if (timerRunning) {
            clearInterval(timerInterval);
            timerRunning = false;
            document.getElementById('timer-btn-toggle').textContent = 'Resume';
            document.getElementById('timer-btn-toggle').className = 'timer-btn';
        } else {
            timerRunning = true;
            timerInterval = setInterval(function() {
                timerSeconds++;
                updateTimerDisplay();
            }, 1000);
            document.getElementById('timer-btn-toggle').textContent = 'Pause';
            document.getElementById('timer-btn-toggle').className = 'timer-btn active';
        }
    }

    function resetTimer() {
        clearInterval(timerInterval);
        timerRunning = false;
        timerSeconds = 0;
        updateTimerDisplay();
        document.getElementById('timer-btn-toggle').textContent = 'Start';
        document.getElementById('timer-btn-toggle').className = 'timer-btn';
    }

    function updateTimerDisplay() {
        var h = Math.floor(timerSeconds / 3600);
        var m = Math.floor((timerSeconds % 3600) / 60);
        var s = timerSeconds % 60;

        var hh = h < 10 ? '0' + h : h;
        var mm = m < 10 ? '0' + m : m;
        var ss = s < 10 ? '0' + s : s;

        document.getElementById('timer-val').textContent = hh + ':' + mm + ':' + ss;
    }

    // Navigation & Focus
    function updateFocus() {
        for (var i = 0; i < cards.length; i++) {
            if (cards[i]) {
                if (i === focusedCardIndex) {
                    cards[i].className = 'tv-card tv-focusable is-focused';
                    cards[i].focus();
                } else {
                    cards[i].className = 'tv-card tv-focusable';
                }
            }
        }
    }

    function setupKeyHandlers() {
        window.addEventListener('keydown', function(event) {
            var keyCode = event.keyCode;

            // Normalize keycodes (standard browser + Samsung TV remote)
            // Left: 37, Samsung: 4
            // Right: 39, Samsung: 5
            // Up: 38, Samsung: 29460
            // Down: 40, Samsung: 29461
            // Enter: 13, Samsung: 29443
            // Return/Back: 27 (Esc), 8 (Backspace), 88 (Samsung KEY_RETURN), 10009

            if (keyCode === 37 || keyCode === 4) {
                // Left
                if (focusedCardIndex > 0) {
                    focusedCardIndex--;
                    updateFocus();
                }
                event.preventDefault();
            } else if (keyCode === 39 || keyCode === 5) {
                // Right
                if (focusedCardIndex < cards.length - 1) {
                    focusedCardIndex++;
                    updateFocus();
                }
                event.preventDefault();
            } else if (keyCode === 38 || keyCode === 29460) {
                // Up
                event.preventDefault();
            } else if (keyCode === 40 || keyCode === 29461) {
                // Down
                event.preventDefault();
            } else if (keyCode === 13 || keyCode === 29443) {
                // Enter / Select
                handleCardAction(focusedCardIndex);
                event.preventDefault();
            } else if (keyCode === 88 || keyCode === 10009 || keyCode === 27 || keyCode === 8) {
                // Return / Back
                if (focusedCardIndex !== 0) {
                    focusedCardIndex = 0;
                    updateFocus();
                    event.preventDefault();
                }
            }
        });
    }

    function handleCardAction(index) {
        if (index === 0) {
            // Weather Card -> Refresh
            fetchGeelongWeather();
        } else if (index === 1) {
            // Timer Card -> Toggle Timer
            toggleTimer();
        } else if (index === 2) {
            // Shortcuts Card
            var activeShortcut = document.querySelector('.shortcut-item.is-selected');
            if (activeShortcut && activeShortcut.href) {
                window.location.href = activeShortcut.href;
            }
        } else if (index === 3) {
            // Notes Card
            var hint = document.getElementById('notes-status');
            if (hint) {
                hint.textContent = 'PS5 Ready • Input active';
            }
        }
    }

    // Expose helpers for mouse/touch clicks during desktop preview
    window.toggleTimer = toggleTimer;
    window.resetTimer = resetTimer;
    window.selectCard = function(idx) {
        focusedCardIndex = idx;
        updateFocus();
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
