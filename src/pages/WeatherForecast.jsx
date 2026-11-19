import React, { useEffect, useState, useCallback } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye, MapPin, ShieldAlert, Droplet, Leaf, RefreshCw } from 'lucide-react';
import { getLocationWithFallback } from '../utils/locationService';
import { getWeatherData } from '../services/weatherService';
import '../styles/Weather.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8000`;

const POPULAR_LOCATIONS = [
  { name: 'Pune, Maharashtra', lat: 18.5204, lon: 73.8567 },
  { name: 'New Delhi, Delhi', lat: 28.6139, lon: 77.2090 },
  { name: 'Mumbai, Maharashtra', lat: 19.0760, lon: 72.8777 },
  { name: 'Bengaluru, Karnataka', lat: 12.9716, lon: 77.5946 },
  { name: 'Hyderabad, Telangana', lat: 17.3850, lon: 78.4867 },
  { name: 'Jaipur, Rajasthan', lat: 26.9124, lon: 75.7873 },
  { name: 'Ahmedabad, Gujarat', lat: 23.0225, lon: 72.5714 },
  { name: 'Chandigarh, Punjab', lat: 30.7333, lon: 76.7794 },
  { name: 'Lucknow, Uttar Pradesh', lat: 26.8467, lon: 80.9462 },
];

function WeatherForecast() {
  const [weather, setWeather] = useState(null);
  const [rules, setRules] = useState(null);
  const [aiAdvice, setAiAdvice] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coords, setCoords] = useState({ lat: 18.5204, lon: 73.8567 });
  const [locationName, setLocationName] = useState('Pune, Maharashtra');
  const [isLive, setIsLive] = useState(false);

  const fetchWeather = useCallback(async (lat, lon) => {
    try {
      setLoading(true);
      setError(null);

      // First attempt: Call FastAPI backend weather-analysis pipeline
      try {
        const response = await fetch(`${API_BASE}/weather-analysis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lon, include_ai: false }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.weather && !data.error) {
            setWeather(data.weather);
            setRules(data.rules);
            setIsLive(Boolean(data.weather.is_live));
            setLoading(false);
            return;
          }
        }
      } catch (backendErr) {
        console.warn('Backend weather pipeline unavailable, falling back to client weather service:', backendErr);
      }

      // Second attempt / fallback: Use frontend weather service
      const clientData = await getWeatherData(lat, lon);
      if (clientData) {
        setWeather({
          current: {
            temp: clientData.current.temperature,
            humidity: clientData.current.humidity,
            wind: clientData.current.windSpeed,
            rain: clientData.current.rainMm || 0,
            rain_chance: clientData.current.rainChance,
            condition: clientData.current.condition,
          },
          hourly: clientData.hourly.map(h => ({
            time: h.time,
            temp: h.temperature,
            rain_chance: h.rainChance,
            condition: h.condition,
          })),
          daily: clientData.daily.map(d => ({
            day: d.day,
            min: d.minTemp,
            max: d.maxTemp,
            rain_chance: d.rainChance,
            condition: d.condition,
          })),
          location_label: clientData.locationLabel,
          is_live: Boolean(clientData.isLive),
        });
        setRules({
          irrigation: clientData.current.rainChance > 40 ? 'Skip' : 'Normal',
          irrigation_reason: clientData.current.rainChance > 40 ? 'Rain expected soon' : 'Normal moisture levels',
          pest_risk: clientData.current.humidity > 70 ? 'Moderate' : 'Low',
          disease_risk: clientData.current.humidity > 75 ? 'Moderate' : 'Low',
          spray_warning: clientData.current.windSpeed > 5 ? 'High wind: postpone spraying' : 'Safe to spray',
          fertilizer_warning: clientData.current.rainChance > 50 ? 'Postpone application due to rain' : 'Safe to apply',
        });
        setIsLive(Boolean(clientData.isLive));
      }
    } catch (err) {
      setError(err?.message || 'Unable to load weather forecast.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAiAdvice = useCallback(async (lat, lon) => {
    try {
      setAiLoading(true);
      const response = await fetch(`${API_BASE}/weather-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lon, include_ai: true }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ai_advice) {
          const cleaned = data.ai_advice.replace(/\*\*/g, '').trim();
          setAiAdvice(cleaned);
          return;
        }
      }
    } catch (err) {
      console.warn('AI weather advice note:', err.message);
    } finally {
      setAiLoading(false);
    }
  }, []);

  // Initialize with location on mount
  useEffect(() => {
    let mounted = true;
    const initLocation = async () => {
      try {
        const loc = await getLocationWithFallback();
        if (!mounted) return;
        setCoords(loc);
        fetchWeather(loc.lat, loc.lon);
        fetchAiAdvice(loc.lat, loc.lon);
      } catch (e) {
        if (!mounted) return;
        fetchWeather(18.5204, 73.8567);
      }
    };
    initLocation();
    return () => {
      mounted = false;
    };
  }, [fetchWeather, fetchAiAdvice]);

  const handleLocationChange = (e) => {
    const selected = POPULAR_LOCATIONS.find(loc => loc.name === e.target.value);
    if (selected) {
      setLocationName(selected.name);
      setCoords({ lat: selected.lat, lon: selected.lon });
      fetchWeather(selected.lat, selected.lon);
      fetchAiAdvice(selected.lat, selected.lon);
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLoading(true);
      const loc = await getLocationWithFallback();
      setCoords(loc);
      setLocationName('My Device Location');
      fetchWeather(loc.lat, loc.lon);
      fetchAiAdvice(loc.lat, loc.lon);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !weather) {
    return (
      <div className="weather-page">
        <p className="loading">Loading climate & weather forecast...</p>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="weather-page">
        <p className="error">{error}</p>
        <button className="btn btn-secondary" onClick={() => fetchWeather(coords.lat, coords.lon)}>
          Retry
        </button>
      </div>
    );
  }

  const irrigationClass = rules?.irrigation ? `badge-${rules.irrigation.toLowerCase()}` : '';

  return (
    <div className="weather-page">
      <div className="container">
        <div className="weather-header">
          <div className="header-icon">
            <Cloud size={28} />
          </div>
          <h1>Weather & Climate Forecast</h1>
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <p className="location" style={{ margin: 0 }}>
              <MapPin size={16} />
              <strong>{weather?.location_label || locationName}</strong>
            </p>
            <span className="default-badge" style={{ backgroundColor: isLive ? '#27ae6022' : '#f39c1222', color: isLive ? '#27ae60' : '#d35400', fontWeight: 'bold' }}>
              {isLive ? '● Live Satellite' : '○ Climate Estimate'}
            </span>
          </div>

          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={locationName}
              onChange={handleLocationChange}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid #ccc',
                backgroundColor: '#fff',
                fontSize: '0.9rem'
              }}
            >
              {POPULAR_LOCATIONS.map(loc => (
                <option key={loc.name} value={loc.name}>{loc.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid #2d7a4a',
                backgroundColor: '#f0fdf4',
                color: '#2d7a4a',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <MapPin size={14} /> Detect My Location
            </button>
            <button
              type="button"
              onClick={() => { fetchWeather(coords.lat, coords.lon); fetchAiAdvice(coords.lat, coords.lon); }}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid #ddd',
                backgroundColor: '#fff',
                color: '#444',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Current Weather */}
        {weather && (
          <div className="weather-section">
            <h2>Today's Weather</h2>
            <div className="current-weather card">
              <div className="current-main">
                <div className="weather-icon-large">
                  {weather.current.condition === 'Clear' ? (
                    <Sun size={60} />
                  ) : weather.current.condition === 'Rainy' || weather.current.condition === 'Rain' ? (
                    <CloudRain size={60} />
                  ) : (
                    <Cloud size={60} />
                  )}
                </div>
                <div className="current-info">
                  <p className="condition">{weather.current.condition}</p>
                  <p className="temp">{Math.round(weather.current.temp)}°C</p>
                </div>
              </div>

              <div className="current-metrics">
                <div className="metric-item">
                  <Droplets size={18} />
                  <span className="label">Humidity</span>
                  <span className="value">{weather.current.humidity}%</span>
                </div>
                <div className="metric-item">
                  <Wind size={18} />
                  <span className="label">Wind Speed</span>
                  <span className="value">{Math.round(weather.current.wind)} m/s</span>
                </div>
                <div className="metric-item">
                  <CloudRain size={18} />
                  <span className="label">Rain Chance</span>
                  <span className="value">{Math.round(weather.current.rain_chance)}%</span>
                </div>
                <div className="metric-item">
                  <Eye size={18} />
                  <span className="label">Rain Amount</span>
                  <span className="value">{Number(weather.current.rain || 0).toFixed(1)} mm</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {rules && (
          <div className="weather-section">
            <h2>Agricultural Irrigation Decision</h2>
            <div className="irrigation-card">
              <div className={`irrigation-badge ${irrigationClass}`}>
                <Droplet size={16} />
                <span>{rules.irrigation}</span>
              </div>
              <p className="irrigation-reason">{rules.irrigation_reason}</p>
              <div className="rule-grid">
                <div className="rule-card">
                  <ShieldAlert size={18} />
                  <div>
                    <p className="rule-title">Pest Risk</p>
                    <p className="rule-value">{rules.pest_risk}</p>
                  </div>
                </div>
                <div className="rule-card">
                  <ShieldAlert size={18} />
                  <div>
                    <p className="rule-title">Disease Risk</p>
                    <p className="rule-value">{rules.disease_risk}</p>
                  </div>
                </div>
                <div className="rule-card">
                  <Wind size={18} />
                  <div>
                    <p className="rule-title">Spray</p>
                    <p className="rule-value">{rules.spray_warning}</p>
                  </div>
                </div>
                <div className="rule-card">
                  <Leaf size={18} />
                  <div>
                    <p className="rule-title">Fertilizer</p>
                    <p className="rule-value">{rules.fertilizer_warning}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hourly Forecast */}
        {weather?.hourly && (
          <div className="weather-section">
            <h2>Next 24 Hours</h2>
            <div className="hourly-forecast">
              {weather.hourly.map((hour, index) => (
                <div key={index} className="hourly-card">
                  <p className="hour-time">{hour.time}</p>
                  <div className="hour-condition">
                    {hour.condition === 'Clear' ? (
                      <Sun size={24} />
                    ) : hour.condition === 'Rainy' || hour.condition === 'Rain' ? (
                      <CloudRain size={24} />
                    ) : (
                      <Cloud size={24} />
                    )}
                  </div>
                  <p className="hour-temp">{hour.temp}°C</p>
                  <p className="hour-rain">{hour.rain_chance}% rain</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Forecast */}
        {weather?.daily && (
          <div className="weather-section">
            <h2>7-Day Agricultural Forecast</h2>
            <div className="weekly-forecast">
              {weather.daily.map((day, index) => (
                <div key={index} className="daily-card">
                  <p className="day-name">{day.day}</p>
                  <div className="day-condition-icon">
                    {day.condition === 'Clear' ? (
                      <Sun size={32} />
                    ) : day.condition === 'Rainy' || day.condition === 'Rain' ? (
                      <CloudRain size={32} />
                    ) : (
                      <Cloud size={32} />
                    )}
                  </div>
                  <div className="day-temps">
                    <span className="max">{day.max}°</span>
                    <span className="min">{day.min}°</span>
                  </div>
                  <p className="day-rain">{day.rain_chance}% rain</p>
                  <p className="day-condition">{day.condition}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Weather Insights */}
        <div className="weather-section">
          <h2>AI Agricultural Weather Insights</h2>
          <div className="weather-ai-card">
            {aiLoading && <p className="ai-loading">Generating AI farming advice...</p>}
            {!aiLoading && aiAdvice && <p className="ai-content" style={{ whiteSpace: 'pre-line' }}>{aiAdvice}</p>}
            {!aiLoading && !aiAdvice && (
              <p className="ai-empty">AI guidance: Soil conditions and temperatures are within standard ranges. Maintain regular morning irrigation.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeatherForecast;
