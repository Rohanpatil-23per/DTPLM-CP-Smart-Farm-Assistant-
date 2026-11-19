import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Leaf,
  Calendar,
  Droplets,
  MapPin,
  DollarSign,
  CheckCircle,
  TrendingUp,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import Hero from '../components/Hero';
import { useAuth } from '../context/AuthContext';
import { useCropContext } from '../context/CropContext';
import {
  getSeasonFromWeather,
  locationToRegion,
  calculateCropScore,
  getCityClimateZone,
  predictYieldAndEconomics,
} from '../utils/cropRecommendationEngine';
import cropsData from '../data/cropsData.json';
import '../styles/YieldInput.css';

const CROPS = ['Wheat', 'Rice', 'Cotton', 'Sugarcane', 'Maize', 'Tomato'];
const SOIL_TYPES = ['Loamy', 'Sandy', 'Clayey', 'Black', 'Red', 'Alluvial', 'Laterite'];
const IRRIGATION_METHODS = ['Drip', 'Sprinkler', 'Flood'];
const WATER_SOURCES = ['Borewell', 'Canal', 'Rainfed', 'River', 'Pond'];

const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8000`;

function YieldInput() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshPlans, selectPlan } = useCropContext();
  const [formData, setFormData] = useState({
    cropName: '',
    sowingDate: '',
    location: '',
    soilType: '',
    irrigationMethod: '',
    landSizeAcres: '',
    expectedInvestment: '',
    waterSourceType: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [planId, setPlanId] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [recommendationAlert, setRecommendationAlert] = useState(null);
  const [yieldPrediction, setYieldPrediction] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  useEffect(() => {
    // Generate recommendation & yield prediction if key fields are filled
    if (formData.cropName && formData.sowingDate && formData.location && formData.soilType) {
      try {
        const region = locationToRegion(formData.location);
        const sowingDate = new Date(formData.sowingDate);

        // City coordinate lookup & location baselines
        const locationCoords = {
          Pune: { lat: 18.5204, lon: 73.8567, tempDefault: 24, humidityDefault: 60, rainfallDefault: 50 },
          Mumbai: { lat: 19.0760, lon: 72.8777, tempDefault: 28, humidityDefault: 72, rainfallDefault: 100 },
          Nagpur: { lat: 21.1458, lon: 79.0882, tempDefault: 25, humidityDefault: 58, rainfallDefault: 45 },
          Delhi: { lat: 28.7041, lon: 77.1025, tempDefault: 18, humidityDefault: 55, rainfallDefault: 15 },
          Kolkata: { lat: 22.5726, lon: 88.3639, tempDefault: 26, humidityDefault: 68, rainfallDefault: 75 },
          Chennai: { lat: 13.0827, lon: 80.2707, tempDefault: 28, humidityDefault: 72, rainfallDefault: 30 },
          Goa: { lat: 15.2993, lon: 73.8243, tempDefault: 29, humidityDefault: 75, rainfallDefault: 110 },
          Bangalore: { lat: 12.9716, lon: 77.5946, tempDefault: 24, humidityDefault: 65, rainfallDefault: 35 },
          Hyderabad: { lat: 17.3850, lon: 78.4867, tempDefault: 27, humidityDefault: 60, rainfallDefault: 30 },
          Jaipur: { lat: 26.9124, lon: 75.7873, tempDefault: 21, humidityDefault: 50, rainfallDefault: 10 },
          Lucknow: { lat: 26.8467, lon: 80.9462, tempDefault: 20, humidityDefault: 58, rainfallDefault: 15 },
          Indore: { lat: 22.7196, lon: 75.8577, tempDefault: 23, humidityDefault: 55, rainfallDefault: 30 },
          Bhopal: { lat: 23.1815, lon: 79.9864, tempDefault: 22, humidityDefault: 58, rainfallDefault: 25 },
          Ahmedabad: { lat: 23.0225, lon: 72.5714, tempDefault: 26, humidityDefault: 52, rainfallDefault: 20 },
        };

        const city = formData.location.split(',')[0].trim();
        const coords = locationCoords[city] || locationCoords.Pune;
        const climateZone = getCityClimateZone(city);

        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
        const weatherRequest = apiKey
          ? fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric`
            )
          : Promise.resolve(null);

        weatherRequest
          .then((res) => (res?.ok ? res.json() : null))
          .then((data) => {
            const weatherData = data
              ? {
                  temperature: Math.round(data.main.temp),
                  humidity: data.main.humidity,
                  rainfall: data.rain?.['1h'] || coords.rainfallDefault,
                }
              : {
                  temperature: coords.tempDefault,
                  humidity: coords.humidityDefault,
                  rainfall: coords.rainfallDefault,
                };

            const season = getSeasonFromWeather(sowingDate, weatherData, city);

            const userInputs = {
              season,
              region,
              temperature: weatherData.temperature,
              humidity: weatherData.humidity,
              rainfall: weatherData.rainfall,
              ph: 6.5,
              soil: formData.soilType,
              irrigationMethod: formData.irrigationMethod,
              waterSourceType: formData.waterSourceType,
            };

            const selectedCrop = cropsData.find(
              (crop) => crop.name.toLowerCase() === formData.cropName.toLowerCase()
            );

            if (selectedCrop) {
              const selectedCropScore = calculateCropScore(selectedCrop, userInputs);

              // Candidate pool restricted to the selectable crops
              const candidateCrops = cropsData.filter((crop) =>
                CROPS.map((c) => c.toLowerCase()).includes(crop.name.toLowerCase())
              );
              const allScores = candidateCrops.map((crop) => ({
                ...crop,
                score: calculateCropScore(crop, userInputs),
              }));
              const bestCrop = allScores.reduce(
                (best, crop) => (crop.score > best.score ? crop : best),
                allScores[0]
              );
              const bestCropScore = bestCrop.score;

              setRecommendation({
                season,
                climateZone,
                region,
                selectedCrop: selectedCrop.name,
                selectedCropScore,
                bestCrop: bestCrop.name,
                bestCropScore,
                temperature: weatherData.temperature,
                humidity: weatherData.humidity,
                rainfall: weatherData.rainfall,
              });

              let messageType = 'error';
              let scoreText = 'not recommended';
              if (selectedCropScore >= 8) {
                messageType = 'success';
                scoreText = selectedCrop.name === bestCrop.name ? 'is the best choice' : 'is well-suited';
              } else if (selectedCropScore >= 5) {
                messageType = 'warning';
                scoreText = 'can be grown with proper management';
              }

              const isBestCrop = selectedCrop.name === bestCrop.name || selectedCropScore >= bestCropScore;
              const suggestionText = !isBestCrop
                ? `💡 Alternative choice: ${bestCrop.name} (${bestCropScore}/10)`
                : '🏆 Excellent option for your field conditions!';

              setRecommendationAlert({
                type: messageType,
                message: `${selectedCrop.name} ${scoreText} for ${city} (${season} season). Compatibility: ${selectedCropScore}/10 | ${suggestionText}`,
              });

              // Predict harvest yield and economic forecast
              const pred = predictYieldAndEconomics({
                cropName: formData.cropName,
                landSizeAcres: formData.landSizeAcres,
                irrigationMethod: formData.irrigationMethod,
                soilType: formData.soilType,
                expectedInvestment: formData.expectedInvestment,
                compatibilityScore: selectedCropScore,
                sowingDate: formData.sowingDate,
              });
              setYieldPrediction(pred);
            } else {
              setRecommendationAlert(null);
              setRecommendation(null);
              setYieldPrediction(null);
            }
          })
          .catch(() => {
            const season = getSeasonFromWeather(sowingDate, null, city);
            const userInputs = {
              season,
              region,
              temperature: coords.tempDefault,
              humidity: coords.humidityDefault,
              rainfall: coords.rainfallDefault,
              ph: 6.5,
              soil: formData.soilType,
              irrigationMethod: formData.irrigationMethod,
              waterSourceType: formData.waterSourceType,
            };
            const selectedCrop = cropsData.find(
              (c) => c.name.toLowerCase() === formData.cropName.toLowerCase()
            );
            if (selectedCrop) {
              const selectedCropScore = calculateCropScore(selectedCrop, userInputs);
              const pred = predictYieldAndEconomics({
                cropName: formData.cropName,
                landSizeAcres: formData.landSizeAcres,
                irrigationMethod: formData.irrigationMethod,
                soilType: formData.soilType,
                expectedInvestment: formData.expectedInvestment,
                compatibilityScore: selectedCropScore,
                sowingDate: formData.sowingDate,
              });
              setYieldPrediction(pred);
              setRecommendationAlert({
                type: 'info',
                message: `ℹ️ ${formData.cropName} compatibility: ${selectedCropScore}/10 for ${city} (${season} season).`,
              });
            }
          });
      } catch (err) {
        setRecommendationAlert(null);
        setRecommendation(null);
        setYieldPrediction(null);
      }
    } else {
      setRecommendationAlert(null);
      setRecommendation(null);
      setYieldPrediction(null);
    }
  }, [
    formData.cropName,
    formData.sowingDate,
    formData.location,
    formData.soilType,
    formData.landSizeAcres,
    formData.irrigationMethod,
    formData.expectedInvestment,
    formData.waterSourceType,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`${API_BASE}/crop-plan/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'default_user',
          cropName: formData.cropName,
          location: formData.location,
          soilType: formData.soilType,
          sowingDate: formData.sowingDate,
          irrigationMethod: formData.irrigationMethod,
          landSizeAcres: parseFloat(formData.landSizeAcres) || 1.0,
          expectedInvestment: formData.expectedInvestment ? parseFloat(formData.expectedInvestment) : null,
          waterSourceType: formData.waterSourceType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create crop plan');
      }

      const data = await response.json();
      setPlanId(data.cropPlanId);
      setSuccess(true);
      await refreshPlans();
      if (data.cropPlanId) {
        selectPlan(data.cropPlanId);
      }
    } catch (err) {
      setError(err.message || 'Failed to create crop plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="yield-input-page">
      <div className="container">
        <Hero
          icon={<Leaf size={28} />}
          title="Crop Planning & Yield Input"
          subtitle="Generate intelligent crop plans with accurate yield prediction and automated irrigation"
        />

        {success && (
          <div className="success-message card glass-card">
            <CheckCircle size={48} className="success-icon" />
            <h2>Crop Plan Created Successfully!</h2>
            <p>
              Plan ID: <strong>{planId}</strong>
            </p>
            <p>Complete irrigation schedule and growth stages have been generated and synchronized.</p>
            <div className="success-actions">
              <button className="btn btn-primary" onClick={() => navigate('/calendar')}>
                View Crop Calendar <ArrowRight size={16} />
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/irrigation')}>
                View Irrigation Schedule
              </button>
            </div>
          </div>
        )}

        {error && <div className="error-message">❌ {error}</div>}

        <div className="form-card card glass-card">
          <form onSubmit={handleSubmit}>
            <div className="form-steps">
              <div className="step-card">
                <div className="step-title">
                  <span className="step-index">Step 1</span>
                  <h3>Crop & Soil Details</h3>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      <Leaf size={16} />
                      Crop Name *
                    </label>
                    <select
                      name="cropName"
                      value={formData.cropName}
                      onChange={handleChange}
                      required
                      className="form-input"
                    >
                      <option value="">Select Crop</option>
                      {CROPS.map((crop) => (
                        <option key={crop} value={crop}>
                          {crop}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      <Calendar size={16} />
                      Sowing Date *
                    </label>
                    <input
                      type="date"
                      name="sowingDate"
                      value={formData.sowingDate}
                      onChange={handleChange}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <MapPin size={16} />
                      Location *
                    </label>
                    <select
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      className="form-input"
                    >
                      <option value="">Select Location</option>
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
                    <label>
                      <Leaf size={16} />
                      Soil Type *
                    </label>
                    <select
                      name="soilType"
                      value={formData.soilType}
                      onChange={handleChange}
                      required
                      className="form-input"
                    >
                      <option value="">Select Soil Type</option>
                      {SOIL_TYPES.map((soil) => (
                        <option key={soil} value={soil}>
                          {soil}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="step-card">
                <div className="step-title">
                  <span className="step-index">Step 2</span>
                  <h3>Irrigation & Land</h3>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      <Droplets size={16} />
                      Irrigation Method *
                    </label>
                    <select
                      name="irrigationMethod"
                      value={formData.irrigationMethod}
                      onChange={handleChange}
                      required
                      className="form-input"
                    >
                      <option value="">Select Method</option>
                      {IRRIGATION_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      <Leaf size={16} />
                      Land Size (Acres) *
                    </label>
                    <input
                      type="number"
                      name="landSizeAcres"
                      value={formData.landSizeAcres}
                      onChange={handleChange}
                      placeholder="e.g., 5"
                      step="0.1"
                      min="0.1"
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <DollarSign size={16} />
                      Expected Investment (₹)
                    </label>
                    <input
                      type="number"
                      name="expectedInvestment"
                      value={formData.expectedInvestment}
                      onChange={handleChange}
                      placeholder="e.g., 50000"
                      step="500"
                      min="0"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Droplets size={16} />
                      Water Source *
                    </label>
                    <select
                      name="waterSourceType"
                      value={formData.waterSourceType}
                      onChange={handleChange}
                      required
                      className="form-input"
                    >
                      <option value="">Select Water Source</option>
                      {WATER_SOURCES.map((source) => (
                        <option key={source} value={source}>
                          {source}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Yield Prediction and Economic Card */}
            {yieldPrediction && (
              <div className="yield-prediction-card">
                <div className="yield-card-header">
                  <div className="header-badge">
                    <Sparkles size={16} /> AI Yield Prediction
                  </div>
                  <h4>Predicted Harvest & Economics: {yieldPrediction.cropName}</h4>
                </div>
                <div className="yield-stats-grid">
                  <div className="yield-stat-box">
                    <span className="stat-label">Estimated Total Yield</span>
                    <span className="stat-val highlight-green">{yieldPrediction.totalYieldRange}</span>
                    <span className="stat-sub">{yieldPrediction.yieldRangePerAcre}</span>
                  </div>
                  <div className="yield-stat-box">
                    <span className="stat-label">Est. Gross Revenue</span>
                    <span className="stat-val">
                      ₹{yieldPrediction.estRevenueMin.toLocaleString('en-IN')} – ₹{yieldPrediction.estRevenueMax.toLocaleString('en-IN')}
                    </span>
                    <span className="stat-sub">
                      @ ₹{yieldPrediction.pricePerUnit.toLocaleString('en-IN')}/{yieldPrediction.unit}
                    </span>
                  </div>
                  <div className="yield-stat-box">
                    <span className="stat-label">Est. Net Profit</span>
                    <span className="stat-val highlight-gold">
                      ₹{yieldPrediction.estimatedProfit.toLocaleString('en-IN')}
                    </span>
                    <span className="stat-sub">{yieldPrediction.roi}% Return on Investment</span>
                  </div>
                  <div className="yield-stat-box">
                    <span className="stat-label">Water Needed</span>
                    <span className="stat-val">{yieldPrediction.waterDisplay}</span>
                    <span className="stat-sub">{formData.irrigationMethod || 'Drip'} Method</span>
                  </div>
                  <div className="yield-stat-box">
                    <span className="stat-label">Est. Harvest Window</span>
                    <span className="stat-val">{yieldPrediction.harvestDate || `${yieldPrediction.growthDays} days`}</span>
                    <span className="stat-sub">~{yieldPrediction.growthDays} Days Cycle</span>
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
              {loading ? 'Generating Crop Plan...' : 'Generate Crop Plan & Schedule'}
            </button>
          </form>

          {recommendationAlert && (
            <div className="recommendation-hint">
              <div className={`alert-hint alert-hint-${recommendationAlert.type}`}>
                <ShieldCheck size={18} />
                <span>{recommendationAlert.message}</span>
              </div>
              {recommendation && (
                <div className="recommendation-details">
                  <p>
                    <strong>Your Selection:</strong> {recommendation.selectedCrop} — Compatibility:{' '}
                    {recommendation.selectedCropScore}/10
                  </p>
                  <p>
                    <strong>🏆 Season Benchmark:</strong> {recommendation.bestCrop} — Compatibility:{' '}
                    {recommendation.bestCropScore}/10
                  </p>
                  <p className="weather-data">
                    📍 {recommendation.season} Season ({recommendation.climateZone} zone) | 🌡️{' '}
                    {recommendation.temperature}°C | 💧 {recommendation.humidity}% humidity | ☔{' '}
                    {recommendation.rainfall}mm water baseline
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="info-card card">
          <h3>🌾 What happens when you create a plan?</h3>
          <ul>
            <li>🌱 All growth stages are scheduled with precise start and end dates.</li>
            <li>💧 Irrigation dates and volumetric liter targets are computed per growth stage.</li>
            <li>🌦 Live weather adjustments (rainfall and temperature) dynamically optimize water quantities.</li>
            <li>📊 Full integration with Crop Calendar, Irrigation Dashboard, and Smart Assistant.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default YieldInput;
