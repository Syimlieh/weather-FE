// selecting element
const locationSelect = document.getElementById("location-select");
const locationInput = document.getElementById("location-input");
const searchBtn = document.getElementById("search-button");
const cityOptions = document.getElementById("city-options");
const loading = document.getElementById("loading");

document.getElementById("current-location-button").addEventListener("click", fetchCurrentLocationWeather);

const weatherStorage = JSON.parse(localStorage.getItem('weather')) || [];

// Base url ffrom weatherapi
const BASE_URL = 'http://api.weatherapi.com/v1';

const apiKey = 'your api key here';

// For our dropdown option using datalist with input
function checkWeatherStorage() {
    cityOptions.innerHTML = "";
    if (weatherStorage.length) {
        weatherStorage.forEach((city) => {
            const optionElement = document.createElement("option");
            optionElement.value = city;
            optionElement.classList.add('w-full')
            cityOptions.appendChild(optionElement);
        });
    }
}
checkWeatherStorage()

// Event when clicking on search weather forecast by input city name
searchBtn.addEventListener("click", async () => {
    const cityName = locationInput.value.trim().toLowerCase();
    if (!cityName) {
        alert("Please enter a city name.");
        return;
    }
    if (cityName) {
        try {
            // Add city to storage if not already present
            if (!weatherStorage.includes(cityName)) {
                weatherStorage.push(cityName);
            }

            // Fetch the weather data
            const result = await forecastApi(cityName);

            // Update local storage
            localStorage.setItem("weather", JSON.stringify(weatherStorage));

            // Update UI
            updateWeatherUI(result);
            updateForecastUI(result);
            checkWeatherStorage();
        } catch (err) {
            alert(`${err.message}`);
        }
    }
})

// update weather UI for current day 
function updateWeatherUI(data) {

    document.getElementById("cityName").textContent = data.location.name;
    document.getElementById("currentDate").textContent = data.location.localtime;
    document.getElementById("temperature").textContent = data.current.temp_c + " °C";
    document.getElementById("windSpeed").textContent = data.current.wind_kph + " km/h";
    document.getElementById("humidity").textContent = data.current.humidity + " %";
    const conditionText = document.getElementById("condition");
    conditionText.textContent = data.current.condition.text;

    const iconContainer = document.getElementById("day-icon-container");
    let dayIcon = iconContainer.querySelector("img");
    if (!dayIcon) {
        // If no image exists, create a new one
        dayIcon = document.createElement("img");
        dayIcon.classList.add("w-20", "h-20", "mx-auto", "my-2");
        iconContainer.insertBefore(dayIcon, conditionText);
    }
    // Create and update weather icon
    dayIcon.classList.add("w-20", "h-20", "mx-auto", "my-2");
    dayIcon.src = data.current.condition.icon;
    dayIcon.alt = data.current.condition.text;

    // Ensure the icon is placed before the text
    iconContainer.insertBefore(dayIcon, conditionText);

}

async function forecastApi(query) {
    loading.classList.remove("hidden");
    loading.classList.add('flex');

    const forecastURL = "/forecast.json";
    let URL;
    if (typeof query === "string") {
        // Query is a city name
        URL = `${BASE_URL}${forecastURL}?key=${apiKey}&q=${encodeURIComponent(query)}&days=5`;
    } else if (query.lat && query.lon) {
        // Query is coordinates
        URL = `${BASE_URL}${forecastURL}?key=${apiKey}&q=${query.lat},${query.lon}&days=5`;
    } else {
        alert("Invalid query parameter");
        return;
    }

    try {
        const response = await fetch(URL);
        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData?.error?.message || "An error occurred";
            throw new Error(errorMessage);
        }
        const result = await response.json();
        loading.classList.add("hidden");
        return result;
    } catch (error) {
        loading.classList.add("hidden");
        throw error;
    }
}

// update 5 day forecast UI
function updateForecastUI(data) {
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = "";
    data.forecast.forecastday.forEach((item, index) => {
        const dayContainer = document.createElement("div");
        dayContainer.classList.add(
            "flex",
            "justify-between",
            "flex-wrap",
            "items-center",
            "gap-4",
            "mb-4",
            "p-4",
            "rounded-lg",
        );

        if (index % 2 === 0) {
            dayContainer.classList.add("bg-gray-100");
        } else {
            dayContainer.classList.add("bg-gray-200");
        }

        // dynamicaly adding item for 5 day forecast 
        const forecastDay = document.createElement("p");
        forecastDay.classList.add("text-sm", "font-medium", "text-gray-600");
        forecastDay.textContent = item.date;
        dayContainer.appendChild(forecastDay)

        const forecastIcon = document.createElement("img");
        forecastIcon.classList.add("w-10", "h-10");
        forecastIcon.src = item.day.condition.icon;
        forecastIcon.alt = item.day.condition.text;
        dayContainer.appendChild(forecastIcon)

        const forecastTemperature = document.createElement("p");
        forecastTemperature.classList.add("text-lg", "font-semibold", "text-gray-800");
        forecastTemperature.textContent = `${item.day.maxtemp_c}/${item.day.mintemp_c} C`;
        dayContainer.appendChild(forecastTemperature)

        const forecastWind = document.createElement("p");
        forecastWind.classList.add("text-sm", "text-gray-600");
        forecastWind.textContent = `${item.day.maxwind_mph} M/H`;
        dayContainer.appendChild(forecastWind)

        const forecastHumidity = document.createElement("p");
        forecastHumidity.classList.add("text-sm", "text-gray-600");
        forecastHumidity.textContent = `${item.day.avghumidity} M/H`;
        dayContainer.appendChild(forecastHumidity)

        forecastContainer.appendChild(dayContainer);
    })
}

function fetchCurrentLocationWeather() {
    // Using browser inbuild geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                try {
                    // searching forecast based on latitute and longitute 
                    const weatherData = await forecastApi({ lat, lon });
                    updateWeatherUI(weatherData);
                    updateForecastUI(weatherData);
                    checkWeatherStorage();
                    return weatherData;
                } catch (err) {
                    alert(`${err.message}`);
                    return null;
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                alert("Unable to fetch location. Please allow location access.");
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}