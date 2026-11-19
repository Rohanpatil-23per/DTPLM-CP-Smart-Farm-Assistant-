import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CloudDrizzle,
  Leaf,
  Wind,
  AlertCircle,
  CheckCircle,
  X,
  PlusCircle,
  Layers,
} from 'lucide-react';
import Hero from '../components/Hero';
import IrrigationStatusCard from '../components/IrrigationStatusCard';
import IrrigationTable from '../components/IrrigationTable';
import IrrigationLogs from '../components/IrrigationLogs';
import { useCropContext } from '../context/CropContext';
import { getLocationWithFallback } from '../utils/locationService';
import { getWeatherData } from '../services/weatherService';
import useIrrigationData from '../hooks/useIrrigationData';
import {
  getSeason,
  locationToRegion,
  calculateCropScore,
  getBestCrop,
} from '../utils/cropRecommendationEngine';
import cropsData from '../data/cropsData.json';
import '../styles/Irrigation.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8000`;

function Irrigation() {
  const {
    plans,
    selectedPlan,
    selectedPlanId,
    ensurePlanDetails,
    selectPlan,
  } = useCropContext();

  const { data: irrigationData } = useIrrigationData();
  const [weather, setWeather] = useState(null);
  const [insight, setInsight] = useState(null);
  const [upcomingSchedule, setUpcomingSchedule] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedLocation, setSelectedLocation] = useState('Pune');
  const [selectedSoil, setSelectedSoil] = useState('Loamy');
  const [alert, setAlert] = useState(null);
  const [recommendations, setRecommendations] = useState(null);

  // Active plan resolution: selected plan > first available plan > sample Wheat plan
  const activePlan = useMemo(() => {
    if (selectedPlan) return selectedPlan;
    if (plans && plans.length > 0) return plans[0];
    return {
      id: 'demo-sample-plan',
      cropName: 'Wheat',
      location: 'Pune',
      soilType: 'Loamy',
      irrigationMethod: 'Drip',
      landSizeAcres: 5,
      currentStage: 'Vegetative',
      isDemo: true,
    };
  }, [selectedPlan, plans]);

  const activePlanId = selectedPlanId || (activePlan && !activePlan.isDemo ? activePlan.id : null);

  useEffect(() => {
    if (activePlanId) {
      ensurePlanDetails(activePlanId);
    }
  }, [activePlanId, ensurePlanDetails]);

  // Load schedule for active plan from backend
  useEffect(() => {
    const loadSchedule = async () => {
      if (!activePlanId) {
        setUpcomingSchedule([]);
        return;
      }
      try {
        const rawMoisture = irrigationData?.soilRaw;
        const hasMoisture = rawMoisture !== undefined && rawMoisture !== null && rawMoisture !== '';
        const query = new URLSearchParams({ refresh: 'true' });
        if (hasMoisture) query.set('moisture', String(Number(rawMoisture)));
        const url = `${API_BASE}/irrigation/schedule/${activePlanId}?${query}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setUpcomingSchedule(data);
            return;
          }
        }
        setUpcomingSchedule([]);
      } catch {
        setUpcomingSchedule([]);
      }
    };

    loadSchedule();
  }, [activePlanId, irrigationData]);

  // Fetch local weather data
  useEffect(() => {
    const loadWeather = async () => {
      try {
        const location = await getLocationWithFallback();
        const data = await getWeatherData(location.lat, location.lon);
        setWeather(data.current);
      } catch {
        setWeather({
          temperature: 28,
          humidity: 62,
          rainChance: 10,
          windSpeed: 3.5,
          weatherStatus: 'Clear sky',
        });
      }
    };

    loadWeather();
  }, []);

  // Fetch AI smart insight
  useEffect(() => {
    const loadInsight = async () => {
      if (!activePlanId || !weather) {
        setInsight(
          `Optimal vegetative moisture conditions observed for ${activePlan.cropName} in ${activePlan.location}. Drip irrigation scheduled every 48 hours. Regional climate shows favorable growth conditions with minimal evaporation stress.`
        );
        return;
      }
      try {
        const response = await fetch(
          `${API_BASE}/crop-insight/${activePlanId}?lat=18.45&lon=73.87`
        );
        if (response.ok) {
          const data = await response.json();
          setInsight(data.insight || data);
        } else {
          setInsight(
            `Favorable conditions for ${activePlan.cropName}. Maintain scheduled drip irrigation cycles to ensure steady root zone moisture.`
          );
        }
      } catch {
        setInsight(
          `Favorable conditions for ${activePlan.cropName}. Maintain scheduled drip irrigation cycles to ensure steady root zone moisture.`
        );
      }
    };

    loadInsight();
  }, [activePlanId, weather, activePlan]);

  const currentStage = useMemo(() => activePlan?.currentStage || 'Vegetative', [activePlan]);

  // Fallback 7-day schedule if backend returns empty or in demo mode
  const displaySchedule = useMemo(() => {
    if (upcomingSchedule && upcomingSchedule.length > 0) {
      return upcomingSchedule;
    }
    const days = [];
    const baseDate = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const isIrrigationDay = i % 2 === 0;
      days.push({
        id: `mock-day-${i}`,
        date: d.toISOString().split('T')[0],
        stage: currentStage,
        water: isIrrigationDay ? 3200 : 0,
        waterAmountLiters: isIrrigationDay ? 3200 : 0,
        autoAdjusted: i === 2,
        status: i === 0 ? 'Due Today' : isIrrigationDay ? 'Scheduled' : 'Rest Day',
      });
    }
    return days;
  }, [upcomingSchedule, currentStage]);

  const todayIrrigation = useMemo(() => {
    if (!displaySchedule.length) return null;
    const today = new Date().toISOString().split('T')[0];
    const match = displaySchedule.find((item) => {
      const itemDate = (item.date || '').split('T')[0];
      return itemDate === today;
    });
    return match && (match.water || match.waterAmountLiters) > 0 ? match : null;
  }, [displaySchedule]);

  const adjustmentMessage = useMemo(() => {
    if (!weather) return 'No weather adjustments detected.';
    const adjustments = [];
    if (weather.rainChance > 60) adjustments.push('Reduced due to rain forecast');
    if (weather.temperature > 35) adjustments.push('Increase due to high temperature');
    if (weather.humidity > 80) adjustments.push('Reduced due to high humidity');
    if (weather.windSpeed > 6) adjustments.push('Avoid spraying due to wind');
    return adjustments.length ? adjustments.join(' | ') : 'No weather adjustments detected (Normal schedule)';
  }, [weather]);

  const nextSevenDays = useMemo(() => {
    if (!displaySchedule.length) return [];
    return displaySchedule.map((item) => {
      const dateStr = (item.date || '').split('T')[0] || item.date;
      const dateLabel = new Date(dateStr).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      const weatherAdj = item.autoAdjusted
        ? 'Weather adjusted'
        : weather?.rainChance > 60
        ? 'Rain risk (-20%)'
        : 'Normal';
      const status = item.status || 'Scheduled';
      const waterVal = item.water || item.waterAmountLiters || 0;
      return {
        date: dateLabel,
        stage: item.stage || currentStage,
        plannedWater: waterVal > 0 ? `${waterVal} L` : '0 L (Rest)',
        weatherAdjustment: weatherAdj,
        status,
      };
    });
  }, [displaySchedule, weather, currentStage]);

  // Auto-calculate recommendations when date, location, or soil changes
  useEffect(() => {
    if (!selectedDate || !selectedLocation || !selectedSoil) {
      setRecommendations(null);
      setAlert(null);
      return;
    }

    const calculateRecommendations = async () => {
      try {
        const season = getSeason(new Date(selectedDate));
        const region = locationToRegion(selectedLocation);

        const locationCoords = {
          Pune: { lat: 18.5204, lon: 73.8567, tempDefault: 28, humidityDefault: 65, rainfallDefault: 50 },
          Mumbai: { lat: 19.0760, lon: 72.8777, tempDefault: 30, humidityDefault: 75, rainfallDefault: 100 },
          Nagpur: { lat: 21.1458, lon: 79.0882, tempDefault: 27, humidityDefault: 60, rainfallDefault: 45 },
          Delhi: { lat: 28.7041, lon: 77.1025, tempDefault: 25, humidityDefault: 55, rainfallDefault: 30 },
          Kolkata: { lat: 22.5726, lon: 88.3639, tempDefault: 28, humidityDefault: 70, rainfallDefault: 80 },
          Chennai: { lat: 13.0827, lon: 80.2707, tempDefault: 32, humidityDefault: 72, rainfallDefault: 60 },
          Goa: { lat: 15.2993, lon: 73.8243, tempDefault: 32, humidityDefault: 80, rainfallDefault: 120 },
          Bangalore: { lat: 12.9716, lon: 77.5946, tempDefault: 28, humidityDefault: 68, rainfallDefault: 65 },
          Hyderabad: { lat: 17.3850, lon: 78.4867, tempDefault: 30, humidityDefault: 62, rainfallDefault: 55 },
          Jaipur: { lat: 26.9124, lon: 75.7873, tempDefault: 32, humidityDefault: 50, rainfallDefault: 35 },
          Lucknow: { lat: 26.8467, lon: 80.9462, tempDefault: 27, humidityDefault: 60, rainfallDefault: 40 },
          Indore: { lat: 22.7196, lon: 75.8577, tempDefault: 29, humidityDefault: 58, rainfallDefault: 55 },
          Bhopal: { lat: 23.1815, lon: 79.9864, tempDefault: 28, humidityDefault: 62, rainfallDefault: 50 },
          Ahmedabad: { lat: 23.0225, lon: 72.5714, tempDefault: 31, humidityDefault: 55, rainfallDefault: 45 },
        };

        const coords = locationCoords[selectedLocation] || locationCoords.Pune;

        let weatherData = {
          temperature: coords.tempDefault,
          humidity: coords.humidityDefault,
          rainfall: coords.rainfallDefault,
        };

        try {
          const fetched = await getWeatherData(coords.lat, coords.lon);
          if (fetched?.current) {
            weatherData = {
              temperature: Math.round(fetched.current.temperature),
              humidity: fetched.current.humidity,
              rainfall: fetched.current.rainChance > 50 ? 25 : coords.rainfallDefault,
            };
          }
        } catch {
          // Keep defaults
        }

        const userInputs = {
          date: selectedDate,
          location: selectedLocation,
          season,
          region,
          temperature: weatherData.temperature,
          rainfall: weatherData.rainfall,
          humidity: weatherData.humidity,
          ph: 6.5,
          soil: selectedSoil,
        };

        const scores = cropsData.map((crop) => ({
          ...crop,
          score: calculateCropScore(crop, userInputs),
        }));

        const bestCrop = getBestCrop(scores, userInputs);
        const bestCropScoreRaw = bestCrop ? calculateCropScore(bestCrop, userInputs) : 0;
        const bestCropScore = Math.round((bestCropScoreRaw / 11) * 10);

        if (bestCrop && bestCropScore > 0) {
          const topCropsScaled = scores
            .sort((a, b) => b.score - a.score)
            .slice(0, 6)
            .map((crop) => ({
              ...crop,
              scoreOutOf10: Math.round((crop.score / 11) * 10),
            }));

          setRecommendations({
            season,
            region,
            topCrop: bestCrop.name,
            topScore: bestCropScore,
            temperature: userInputs.temperature,
            humidity: userInputs.humidity,
            rainfall: userInputs.rainfall,
            soil: userInputs.soil,
            allCrops: topCropsScaled,
          });

          let alertType = 'error';
          let messagePrefix = 'Not recommended';

          if (bestCropScore >= 7) {
            alertType = 'success';
            messagePrefix = 'Excellent choice';
          } else if (bestCropScore >= 4) {
            alertType = 'warning';
            messagePrefix = 'Can be grown';
          }

          setAlert({
            type: alertType,
            message: `${messagePrefix}: ${bestCrop.name} for ${selectedLocation} in ${season}. Compatibility: ${bestCropScore}/10`,
          });
        } else {
          setAlert({
            type: 'error',
            message: 'No suitable crops found for the selected conditions.',
          });
          setRecommendations(null);
        }
      } catch (error) {
        console.error('Recommendation error:', error);
        setAlert({ type: 'error', message: `Error: ${error.message}` });
        setRecommendations(null);
      }
    };

    calculateRecommendations();
  }, [selectedDate, selectedLocation, selectedSoil]);

  const closeAlert = () => {
    setAlert(null);
  };

  return (
    <div className="irrigation-page">
      <div className="container">
        <Hero
          icon={<Leaf size={28} />}
          title="Irrigation Control Center"
          subtitle="Real-time water decisions, sensor automation, and crop recommendations."
        />

        {/* Active Crop Plan Selector Bar */}
        <div className="plan-selector-bar">
          <div className="plan-selector-left">
            <label htmlFor="planSelect">
              <Layers size={18} style={{ color: '#059669' }} />
              <span>Active Crop Plan:</span>
            </label>
            {plans && plans.length > 0 ? (
              <select
                id="planSelect"
                value={activePlanId || plans[0].id}
                onChange={(e) => selectPlan(e.target.value)}
                className="plan-select-dropdown"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.cropName} • {p.location} ({p.landSizeAcres || 1} ac) - {p.irrigationMethod || 'Drip'}
                  </option>
                ))}
              </select>
            ) : (
              <div className="plan-demo-wrap">
                <span className="plan-demo-badge">Sample Plan: Wheat • Pune (5 ac)</span>
              </div>
            )}
          </div>
          <div className="plan-selector-actions">
            <Link to="/yield" className="btn btn-primary">
              <PlusCircle size={15} />
              <span>Create New Plan</span>
            </Link>
          </div>
        </div>

        {/* Status Card and Weather Intelligence */}
        <div className="irrigation-grid">
          <IrrigationStatusCard
            cropName={activePlan?.cropName}
            stage={currentStage}
            recommendation={todayIrrigation ? 'Yes' : 'No'}
            waterAmount={todayIrrigation?.water || todayIrrigation?.waterAmountLiters || 3200}
            method={activePlan?.irrigationMethod || 'Drip'}
            adjustment={adjustmentMessage}
          />

          <div className="weather-intel card">
            <h3>Weather Intelligence</h3>
            {weather ? (
              <div className="weather-grid">
                <div>
                  <span>Temp</span>
                  <strong>{weather.temperature} °C</strong>
                </div>
                <div>
                  <span>Humidity</span>
                  <strong>{weather.humidity}%</strong>
                </div>
                <div>
                  <span>Rain Chance</span>
                  <strong>{weather.rainChance}%</strong>
                </div>
                <div>
                  <span>Wind</span>
                  <strong>{weather.windSpeed} m/s</strong>
                </div>
              </div>
            ) : (
              <p>Weather data unavailable</p>
            )}
            <div className="weather-alerts">
              {weather?.rainChance > 60 && (
                <span>
                  <CloudDrizzle size={14} /> High rain risk
                </span>
              )}
              {weather?.windSpeed > 6 && (
                <span>
                  <Wind size={14} /> Windy conditions
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Crop Recommendation Engine */}
        <div className="recommendation-section card">
          <h3>Crop Recommendation Engine</h3>
          {alert && (
            <div className={`alert alert-${alert.type}`}>
              <div className="alert-content">
                {alert.type === 'success' && <CheckCircle size={20} />}
                {alert.type === 'error' && <AlertCircle size={20} />}
                {alert.type === 'warning' && <AlertTriangle size={20} />}
                <span>{alert.message}</span>
              </div>
              <button className="alert-close" onClick={closeAlert}>
                <X size={16} />
              </button>
            </div>
          )}

          <div className="recommendation-form">
            <div className="form-group">
              <label htmlFor="date">Select Date</label>
              <input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Select Location</label>
              <select
                id="location"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="form-control"
              >
                <option value="Pune">Pune</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Nagpur">Nagpur</option>
                <option value="Delhi">Delhi</option>
                <option value="Kolkata">Kolkata</option>
                <option value="Chennai">Chennai</option>
                <option value="Goa">Goa</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Jaipur">Jaipur</option>
                <option value="Lucknow">Lucknow</option>
                <option value="Indore">Indore</option>
                <option value="Bhopal">Bhopal</option>
                <option value="Ahmedabad">Ahmedabad</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="soil">Soil Type</label>
              <select
                id="soil"
                value={selectedSoil}
                onChange={(e) => setSelectedSoil(e.target.value)}
                className="form-control"
              >
                <option value="Loamy">Loamy (Balanced soil)</option>
                <option value="Sandy">Sandy (Quick-draining)</option>
                <option value="Clayey">Clayey (Water-retentive)</option>
                <option value="Black">Black (Fertile, cotton soil)</option>
                <option value="Red">Red (Iron-rich soil)</option>
                <option value="Alluvial">Alluvial (River deposits)</option>
                <option value="Laterite">Laterite (Well-drained tropical)</option>
              </select>
            </div>
          </div>

          {recommendations && (
            <>
              <div className="compatibility-meter">
                <h4>🏆 Best Crop: {recommendations.topCrop}</h4>
                <div className="meter-bar">
                  <div
                    className={`meter-fill ${
                      recommendations.topScore >= 8
                        ? 'green'
                        : recommendations.topScore >= 6
                        ? 'orange'
                        : 'red'
                    }`}
                    style={{
                      width: `${(recommendations.topScore / 10) * 100}%`,
                    }}
                  />
                </div>
                <span className="meter-label">
                  Compatibility: {recommendations.topScore}/10
                </span>
              </div>

              <div className="result-grid">
                <div className="result-card">
                  <strong>Season</strong>
                  <p>{recommendations.season}</p>
                </div>
                <div className="result-card">
                  <strong>Region</strong>
                  <p>{recommendations.region}</p>
                </div>
                <div className="result-card">
                  <strong>Temperature</strong>
                  <p>{recommendations.temperature}°C</p>
                </div>
                <div className="result-card">
                  <strong>Humidity</strong>
                  <p>{recommendations.humidity}%</p>
                </div>
                <div className="result-card">
                  <strong>Rainfall</strong>
                  <p>{recommendations.rainfall}mm</p>
                </div>
                <div className="result-card">
                  <strong>Soil Type</strong>
                  <p>{recommendations.soil}</p>
                </div>
              </div>

              <h4>🌾 Top Crop Options</h4>
              <div className="result-grid">
                {recommendations.allCrops.map((crop, idx) => (
                  <div key={idx} className="result-card">
                    <strong>{crop.name}</strong>
                    <p>Compatibility: {crop.scoreOutOf10}/10</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 7-Day Irrigation Schedule Table */}
        <IrrigationTable rows={nextSevenDays} />

        {/* Logs and Smart Insight */}
        <div className="irrigation-bottom">
          <IrrigationLogs cropPlanId={activePlanId} />
          <div className="insight-box card">
            <h3>Smart Insight</h3>
            {insight ? <p>{insight}</p> : <p>Loading crop insight...</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Irrigation;
