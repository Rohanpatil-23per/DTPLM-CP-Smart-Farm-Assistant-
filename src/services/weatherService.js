const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5";
const DEFAULT_LOCATION = { lat: 18.5204, lon: 73.8567 }; // Pune fallback

const KNOWN_CITIES = [
  { city: "Pune", state: "Maharashtra", country: "IN", lat: 18.5204, lon: 73.8567, temp: 28, humidity: 52, condition: "Clear" },
  { city: "New Delhi", state: "Delhi", country: "IN", lat: 28.6139, lon: 77.2090, temp: 29, humidity: 45, condition: "Clear" },
  { city: "Mumbai", state: "Maharashtra", country: "IN", lat: 19.0760, lon: 72.8777, temp: 30, humidity: 75, condition: "Clouds" },
  { city: "Bengaluru", state: "Karnataka", country: "IN", lat: 12.9716, lon: 77.5946, temp: 26, humidity: 60, condition: "Clouds" },
  { city: "Hyderabad", state: "Telangana", country: "IN", lat: 17.3850, lon: 78.4867, temp: 29, humidity: 55, condition: "Clear" },
  { city: "Jaipur", state: "Rajasthan", country: "IN", lat: 26.9124, lon: 75.7873, temp: 31, humidity: 38, condition: "Clear" },
  { city: "Ahmedabad", state: "Gujarat", country: "IN", lat: 23.0225, lon: 72.5714, temp: 32, humidity: 48, condition: "Clear" },
  { city: "Chennai", state: "Tamil Nadu", country: "IN", lat: 13.0827, lon: 80.2707, temp: 31, humidity: 78, condition: "Clouds" },
  { city: "Kolkata", state: "West Bengal", country: "IN", lat: 22.5726, lon: 88.3639, temp: 30, humidity: 72, condition: "Clouds" },
  { city: "Lucknow", state: "Uttar Pradesh", country: "IN", lat: 26.8467, lon: 80.9462, temp: 29, humidity: 50, condition: "Clear" },
  { city: "Chandigarh", state: "Punjab", country: "IN", lat: 30.7333, lon: 76.7794, temp: 27, humidity: 48, condition: "Clear" },
  { city: "Indore", state: "Madhya Pradesh", country: "IN", lat: 22.7196, lon: 75.8577, temp: 28, humidity: 50, condition: "Clear" },
];

const findClosestCity = (lat, lon) => {
  let closest = KNOWN_CITIES[0];
  let minDist = Infinity;
  for (const c of KNOWN_CITIES) {
    const d = Math.hypot(lat - c.lat, lon - c.lon);
    if (d < minDist) {
      minDist = d;
      closest = c;
    }
  }
  return closest;
};

const generateFallbackData = (latitude, longitude) => {
  const cityInfo = findClosestCity(latitude, longitude);
  const baseTemp = cityInfo.temp;
  const humidity = cityInfo.humidity;
  const condition = cityInfo.condition;
  const locationLabel = `${cityInfo.city}, ${cityInfo.state}, IN`;

  const now = new Date();
  const hourly = [];
  for (let i = 0; i < 8; i++) {
    const d = new Date(now.getTime() + i * 3 * 3600 * 1000);
    const hour = d.getHours();
    const diurnal = 4 * Math.sin(((hour - 8) * Math.PI) / 12);
    hourly.push({
      time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      temperature: Math.round(baseTemp + diurnal),
      rainChance: condition === "Clear" ? 10 : 35,
      condition,
    });
  }

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daily = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() + i * 24 * 3600 * 1000);
    const dayName = days[d.getDay()];
    daily.push({
      day: dayName,
      minTemp: Math.round(baseTemp - 5 + (i % 2)),
      maxTemp: Math.round(baseTemp + 4 + ((i * 2) % 3)),
      rainChance: condition === "Clear" ? 10 : 30,
      condition,
    });
  }

  return {
    current: {
      temperature: baseTemp,
      humidity,
      windSpeed: 3.5,
      rainChance: condition === "Clear" ? 10 : 30,
      rainMm: 0,
      condition,
      description: `${condition.toLowerCase()} sky`,
    },
    hourly,
    daily,
    city: cityInfo.city,
    country: "IN",
    locationLabel,
    isLive: false,
  };
};

const buildLocationLabel = (city, country) => {
  const safeCity = city && city.trim().length > 0 ? city : "Agricultural Zone";
  const safeCountry = country && country.trim().length > 0 ? country : "IN";
  return `${safeCity}, ${safeCountry}`;
};

export const getWeatherData = async (latitude = DEFAULT_LOCATION.lat, longitude = DEFAULT_LOCATION.lon) => {
  if (OPENWEATHER_API_KEY && OPENWEATHER_API_KEY.trim().length > 0) {
    try {
      const response = await fetch(
        `${BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPENWEATHER_API_KEY.trim()}`
      );

      if (response.ok) {
        const data = await response.json();
        return {
          current: {
            temperature: Math.round(data.list[0].main.temp),
            humidity: data.list[0].main.humidity,
            windSpeed: data.list[0].wind.speed,
            rainChance: Math.round(data.list[0].pop * 100),
            rainMm: data.list[0].rain?.["3h"] || 0,
            condition: data.list[0].weather[0].main,
            description: data.list[0].weather[0].description,
          },
          hourly: data.list.slice(0, 8).map((item) => ({
            time: new Date(item.dt * 1000).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            temperature: Math.round(item.main.temp),
            rainChance: Math.round(item.pop * 100),
            condition: item.weather[0].main,
          })),
          daily: getDailyForecast(data.list),
          city: data.city.name,
          country: data.city.country,
          locationLabel: buildLocationLabel(data.city.name, data.city.country),
          isLive: true,
        };
      }
      console.warn(`[OpenWeather] API returned status ${response.status}. Using smart fallback.`);
    } catch (apiErr) {
      console.warn("[OpenWeather] Network request failed. Using smart fallback:", apiErr);
    }
  }

  // Graceful fallback when key is not set or network call fails
  return generateFallbackData(latitude, longitude);
};

const getDailyForecast = (forecastList) => {
  const dailyData = {};

  forecastList.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dayKey = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    if (!dailyData[dayKey]) {
      dailyData[dayKey] = {
        temps: [],
        rainChances: [],
        conditions: [],
      };
    }

    dailyData[dayKey].temps.push(item.main.temp);
    dailyData[dayKey].rainChances.push(item.pop * 100);
    dailyData[dayKey].conditions.push(item.weather[0].main);
  });

  return Object.keys(dailyData)
    .slice(0, 7)
    .map((day) => ({
      day,
      minTemp: Math.round(Math.min(...dailyData[day].temps)),
      maxTemp: Math.round(Math.max(...dailyData[day].temps)),
      rainChance: Math.round(Math.max(...dailyData[day].rainChances)),
      condition: dailyData[day].conditions[0],
    }));
};

export const getWeatherInsights = (currentWeather) => {
  const insights = [];

  if (currentWeather.rainChance > 40) {
    insights.push("Rain expected soon. Avoid irrigation today.");
  }

  if (currentWeather.temperature > 32) {
    insights.push("High temperature. Monitor soil moisture closely.");
  }

  if (currentWeather.rainChance < 20 && currentWeather.temperature > 28) {
    insights.push("Dry and warm. Plan regular watering schedule.");
  }

  return insights;
};
