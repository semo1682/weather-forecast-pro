const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const message = document.getElementById("message");
const loader = document.getElementById("loader");

const currentWeather = document.getElementById("currentWeather");
const forecastSection = document.getElementById("forecastSection");
const forecastGrid = document.getElementById("forecastGrid");

const cityName = document.getElementById("cityName");
const weatherText = document.getElementById("weatherText");
const temperature = document.getElementById("temperature");
const windSpeed = document.getElementById("windSpeed");
const humidity = document.getElementById("humidity");
const maxTemp = document.getElementById("maxTemp");
const minTemp = document.getElementById("minTemp");
const weatherIcon = document.getElementById("weatherIcon");
const locationBtn = document.getElementById("locationBtn");

function setLoading(isLoading) {
  loader.classList.toggle("hidden", !isLoading);
}

function getWeatherIcon(code) {
  if (code === 0) return "☀️";
  if ([1, 2, 3].includes(code)) return "⛅";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57].includes(code)) return "🌦️";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌍";
}

function getWeatherText(code) {
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Weather condition";
}

function setTheme(code) {
  document.body.className = "";

  if (code === 0) {
    document.body.classList.add("theme-clear");
    return;
  }

  if ([1, 2, 3].includes(code)) {
    document.body.classList.add("theme-cloudy");
    return;
  }

  if ([45, 48].includes(code)) {
    document.body.classList.add("theme-fog");
    return;
  }

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    document.body.classList.add("theme-rain");
    return;
  }

  if ([95, 96, 99].includes(code)) {
    document.body.classList.add("theme-storm");
    return;
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    document.body.classList.add("theme-snow");
    return;
  }

  document.body.classList.add("theme-default");
}

async function getCoordinates(city) {
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

  const response = await fetch(geoUrl);
  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("City not found");
  }

  return data.results[0];
}

async function getWeatherData(lat, lon) {
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;

  const response = await fetch(weatherUrl);
  const data = await response.json();

  return data;
}

function renderForecast(data) {
  forecastGrid.innerHTML = "";

  for (let i = 0; i < 5; i++) {
    const card = document.createElement("div");
    card.className = "forecast-card";

    const date = new Date(data.daily.time[i]);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

    card.innerHTML = `
      <h4>${dayName}</h4>
      <div class="icon">${getWeatherIcon(data.daily.weather_code[i])}</div>
      <p>${getWeatherText(data.daily.weather_code[i])}</p>
      <strong>${Math.round(data.daily.temperature_2m_max[i])}° / ${Math.round(data.daily.temperature_2m_min[i])}°</strong>
    `;

    forecastGrid.appendChild(card);
  }
}

function updateUI(place, weatherData) {
  const current = weatherData.current;
  const daily = weatherData.daily;

  cityName.textContent = `${place.name}, ${place.country || ""}`;
  weatherText.textContent = getWeatherText(current.weather_code);
  temperature.textContent = `${Math.round(current.temperature_2m)}°C`;
  windSpeed.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  humidity.textContent = `${current.relative_humidity_2m}%`;
  maxTemp.textContent = `${Math.round(daily.temperature_2m_max[0])}°C`;
  minTemp.textContent = `${Math.round(daily.temperature_2m_min[0])}°C`;
  weatherIcon.textContent = getWeatherIcon(current.weather_code);

  setTheme(current.weather_code);
  renderForecast(weatherData);

  currentWeather.classList.remove("hidden");
  forecastSection.classList.remove("hidden");
  message.textContent = "";
}

async function searchCity(city) {
  try {
    setLoading(true);
    message.textContent = "Loading weather...";
    currentWeather.classList.add("hidden");
    forecastSection.classList.add("hidden");

    const place = await getCoordinates(city);
    const weatherData = await getWeatherData(place.latitude, place.longitude);

    updateUI(place, weatherData);
  } catch (error) {
    message.textContent = error.message;
  } finally {
    setLoading(false);
  }
}

async function searchByLocation(lat, lon) {
  try {
    setLoading(true);
    message.textContent = "Detecting your local weather...";
    currentWeather.classList.add("hidden");
    forecastSection.classList.add("hidden");

    const weatherData = await getWeatherData(lat, lon);

    const place = {
      name: "Your Location",
      country: ""
    };

    updateUI(place, weatherData);
  } catch (error) {
    message.textContent = "Unable to load weather for your location.";
  } finally {
    setLoading(false);
  }
}

searchForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const city = cityInput.value.trim();

  if (!city) {
    message.textContent = "Please enter a city name.";
    return;
  }

  searchCity(city);
});

cityInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
      message.textContent = "Please enter a city name.";
      return;
    }

    searchCity(city);
  }
});

locationBtn.addEventListener("click", function () {
  if (!navigator.geolocation) {
    message.textContent = "Geolocation is not supported on this device.";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    function (position) {
      searchByLocation(position.coords.latitude, position.coords.longitude);
    },
    function () {
      message.textContent = "Unable to access your location.";
    }
  );
});

window.addEventListener("load", function () {
  setTheme(-1);
});