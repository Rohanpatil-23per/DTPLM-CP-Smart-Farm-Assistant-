import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import { Calendar as CalendarIcon, AlertTriangle, Layers, PlusCircle } from 'lucide-react';
import Hero from '../components/Hero';
import 'react-calendar/dist/Calendar.css';
import { useCropContext } from '../context/CropContext';
import { getLocationWithFallback } from '../utils/locationService';
import { getWeatherData } from '../services/weatherService';
import '../styles/CropCalendar.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8000`;

const STAGE_COLORS = {
  germination: '#a7e6a1',
  vegetative: '#2f7d32',
  flowering: '#f2c94c',
  'grain-filling': '#f2994a',
  'boll-development': '#f2994a',
  harvest: '#8d6e63',
  maturation: '#8d6e63',
  completed: '#9e9e9e',
};

const toYMD = (d) => {
  if (!d) return '';
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '';
  return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
};

function generateFallbackStages(sowingDateStr) {
  const base = sowingDateStr ? new Date(sowingDateStr) : new Date();
  const validBase = isNaN(base.getTime()) ? new Date() : base;

  const stageDefs = [
    { name: 'Germination', days: 10 },
    { name: 'Vegetative', days: 35 },
    { name: 'Flowering', days: 30 },
    { name: 'Grain Filling', days: 25 },
    { name: 'Harvest', days: 20 },
  ];

  let currentStart = new Date(validBase);
  const stages = [];
  const irrigation = [];

  stageDefs.forEach((def, index) => {
    const start = new Date(currentStart);
    const end = new Date(start);
    end.setDate(start.getDate() + def.days);

    stages.push({
      name: def.name,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    });

    for (let day = 0; day < def.days; day += 5) {
      const irrDate = new Date(start);
      irrDate.setDate(start.getDate() + day);
      irrigation.push({
        date: toYMD(irrDate),
        water_amount: 3200,
        adjusted: index === 1,
        stage: def.name,
        status: 'scheduled',
      });
    }

    currentStart = new Date(end);
    currentStart.setDate(currentStart.getDate() + 1);
  });

  return { stages, irrigation };
}

function CropCalendar() {
  const {
    plans,
    selectedPlanId,
    selectPlan,
    ensurePlanDetails,
  } = useCropContext();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weatherDaily, setWeatherDaily] = useState([]);
  const [calendarData, setCalendarData] = useState({
    stages: [],
    irrigation: [],
    today: toYMD(new Date()),
    crop_health_score: 95,
  });

  // Resolve active plan
  const activePlan = useMemo(() => {
    if (selectedPlanId) {
      const found = plans.find((p) => p.id === selectedPlanId);
      if (found) return found;
    }
    if (plans && plans.length > 0) return plans[0];
    return {
      id: 'demo-sample-plan',
      cropName: 'Wheat',
      location: 'Pune',
      soilType: 'Loamy',
      sowingDate: '2026-06-01',
      irrigationMethod: 'Drip',
      landSizeAcres: 5,
      isDemo: true,
    };
  }, [selectedPlanId, plans]);

  const activePlanId = selectedPlanId || (activePlan && !activePlan.isDemo ? activePlan.id : null);

  useEffect(() => {
    if (activePlanId) {
      ensurePlanDetails(activePlanId);
    }
  }, [activePlanId, ensurePlanDetails]);

  useEffect(() => {
    const loadEvents = async () => {
      if (!activePlanId) {
        const fallback = generateFallbackStages(activePlan?.sowingDate);
        setCalendarData({
          stages: fallback.stages,
          irrigation: fallback.irrigation,
          today: toYMD(new Date()),
          crop_health_score: 92,
        });
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/calendar/${activePlanId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.stages && data.stages.length > 0) {
            setCalendarData({
              stages: data.stages || [],
              irrigation: data.irrigation || [],
              today: data.today || toYMD(new Date()),
              crop_health_score: data.crop_health_score ?? 90,
            });
            return;
          }
        }
        // Fallback if backend returned empty stages
        const fallback = generateFallbackStages(activePlan?.sowingDate);
        setCalendarData({
          stages: fallback.stages,
          irrigation: fallback.irrigation,
          today: toYMD(new Date()),
          crop_health_score: 90,
        });
      } catch {
        const fallback = generateFallbackStages(activePlan?.sowingDate);
        setCalendarData({
          stages: fallback.stages,
          irrigation: fallback.irrigation,
          today: toYMD(new Date()),
          crop_health_score: 90,
        });
      }
    };

    loadEvents();
  }, [activePlanId, activePlan]);

  useEffect(() => {
    const loadWeather = async () => {
      try {
        const location = await getLocationWithFallback();
        const data = await getWeatherData(location.lat, location.lon);
        setWeatherDaily(data.daily || []);
      } catch {
        setWeatherDaily([]);
      }
    };

    loadWeather();
  }, []);

  const getStageForDate = (date) => {
    const dateStr = toYMD(date);
    return calendarData.stages.find((stage) => {
      const start = toYMD(stage.start_date || stage.startDate);
      const end = toYMD(stage.end_date || stage.endDate);
      return dateStr >= start && dateStr <= end;
    });
  };

  const getIrrigationForDate = (date) => {
    const dateStr = toYMD(date);
    return calendarData.irrigation.find((irr) => {
      const irrDate = toYMD(irr.date);
      return irrDate === dateStr;
    });
  };

  const getIrrigationAmount = (irrigation) => {
    if (!irrigation) return null;
    return irrigation.water_amount ?? irrigation.water_liters ?? irrigation.waterAmountLiters ?? null;
  };

  const isIrrigationAdjusted = (irrigation) => {
    if (!irrigation) return false;
    return irrigation.adjusted ?? irrigation.auto_adjusted ?? irrigation.autoAdjusted ?? false;
  };

  const weatherAlertDates = useMemo(() => {
    if (!weatherDaily.length) return new Set();
    const alerts = new Set();
    const today = new Date();

    weatherDaily.forEach((day, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      if (day.rainChance > 60) {
        alerts.add(toYMD(date));
      }
    });

    return alerts;
  }, [weatherDaily]);

  const harvestDate = useMemo(() => {
    if (!calendarData.stages.length) return null;
    const lastStage = calendarData.stages[calendarData.stages.length - 1];
    return toYMD(lastStage.end_date || lastStage.endDate);
  }, [calendarData]);

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;
    const classes = [];
    const stage = getStageForDate(date);
    const irrigation = getIrrigationForDate(date);
    const tileDate = toYMD(date);

    if (stage) {
      const rawName = stage.name || stage.stage || 'Vegetative';
      const stageName = rawName.toLowerCase().replace(/\s+/g, '-');
      classes.push(`stage-${stageName}`);
    }

    if (irrigation) {
      classes.push(isIrrigationAdjusted(irrigation) ? 'irrigation-day-adjusted' : 'irrigation-day');
    }

    if (weatherAlertDates.has(tileDate)) {
      classes.push('weather-alert-day');
    }

    if (calendarData.today && tileDate === calendarData.today) {
      classes.push('today-marker');
    }

    if (harvestDate && tileDate === harvestDate) {
      classes.push('harvest-day');
    }

    return classes.join(' ');
  };

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const irrigation = getIrrigationForDate(date);
    const tileDate = toYMD(date);

    return (
      <div className="tile-content">
        {irrigation && <span className="irrigation-marker"></span>}
        {weatherAlertDates.has(tileDate) && <AlertTriangle size={10} className="alert-icon" />}
      </div>
    );
  };

  const getStageColor = (stageName) => {
    if (!stageName) return STAGE_COLORS.vegetative;
    const normalized = stageName.toLowerCase().replace(/\s+/g, '-');
    return STAGE_COLORS[normalized] || STAGE_COLORS.vegetative;
  };

  return (
    <div className="crop-calendar-page">
      <div className="container">
        <Hero
          icon={<CalendarIcon size={28} />}
          title="Crop Growth Calendar"
          subtitle="Track stages, irrigation events, and harvest timelines."
        />

        {/* Plan Switcher Bar */}
        <div className="plan-selector">
          <label htmlFor="calendarPlanSelect" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Layers size={18} />
            <span>Select Crop Plan:</span>
          </label>
          {plans && plans.length > 0 ? (
            <select
              id="calendarPlanSelect"
              value={activePlanId || plans[0].id}
              onChange={(e) => selectPlan(e.target.value)}
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.cropName} • {plan.location} (Planted: {toYMD(plan.sowingDate)})
                </option>
              ))}
            </select>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
              <span className="plan-demo-badge" style={{ background: '#fef3c7', color: '#92400e', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 600 }}>
                Sample Preview: Wheat • Pune
              </span>
              <Link to="/yield" className="btn btn-primary btn-sm" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <PlusCircle size={14} />
                Create Real Plan
              </Link>
            </div>
          )}
        </div>

        {/* Interactive Calendar Grid */}
        <div className="calendar-grid">
          <div className="calendar-section">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileClassName={tileClassName}
              tileContent={tileContent}
            />

            <div className="legend">
              <h3>Stage Legend</h3>
              <div className="legend-items">
                {calendarData.stages.map((stage) => {
                  const sName = stage.name || stage.stage || 'Stage';
                  return (
                    <div key={sName} className="legend-item">
                      <span
                        className="legend-color"
                        style={{ backgroundColor: getStageColor(sName) }}
                      ></span>
                      <span>{sName}</span>
                    </div>
                  );
                })}
              </div>

              <div className="legend-extra">
                <div><span className="legend-dot"></span> Irrigation day</div>
                <div><span className="legend-alert"></span> Weather alert</div>
                <div><span className="legend-harvest"></span> Harvest day</div>
              </div>
            </div>
          </div>

          <div className="calendar-summary card">
            <h3>Selected Date Details</h3>
            <p><strong>Date:</strong> {selectedDate.toDateString()}</p>
            <p><strong>Stage:</strong> {getStageForDate(selectedDate)?.name || getStageForDate(selectedDate)?.stage || 'No stage scheduled'}</p>
            <p>
              <strong>Irrigation:</strong>{' '}
              {getIrrigationAmount(getIrrigationForDate(selectedDate))
                ? `${getIrrigationAmount(getIrrigationForDate(selectedDate))} L`
                : 'None scheduled'}
            </p>
            {calendarData.crop_health_score !== null && (
              <p><strong>Crop Health Score:</strong> {calendarData.crop_health_score}/100</p>
            )}
            <p style={{ marginTop: '1rem', fontSize: '0.88rem', color: 'var(--muted)' }}>
              Crop plan: <strong>{activePlan?.cropName}</strong> in <strong>{activePlan?.location}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CropCalendar;
