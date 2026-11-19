/**
 * Crop Recommendation and Yield Prediction Engine for Smart Farming
 */

/**
 * Calendar season detection mapped to Indian agricultural cycles:
 * - Rabi (Winter): October to February (months 10, 11, 12, 1, 2)
 * - Zaid (Summer): March to May (months 3, 4, 5)
 * - Kharif (Monsoon): June to September (months 6, 7, 8, 9)
 */
export const getSeason = (date) => {
  if (!date) return "Winter";
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Winter";
  const month = d.getMonth() + 1;

  if (month >= 10 || month <= 2) return "Winter";
  if (month >= 3 && month <= 5) return "Summer";
  return "Monsoon";
};

/**
 * Climate zone classification per city.
 */
const cityClimateZone = {
  Chennai:   "tropical",
  Goa:       "tropical",
  Kolkata:   "tropical",
  Mumbai:    "tropical",
  Hyderabad: "semi-arid",
  Pune:      "semi-arid",
  Ahmedabad: "semi-arid",
  Nagpur:    "semi-arid",
  Indore:    "semi-arid",
  Bhopal:    "semi-arid",
  Delhi:     "arid",
  Jaipur:    "arid",
  Lucknow:   "arid",
  Bangalore: "temperate",
};

/**
 * Minimum temperature threshold below which a location feels like true winter.
 */
const winterTempThreshold = {
  tropical:    20,
  "semi-arid": 24,
  arid:        22,
  humid:       20,
  temperate:   22,
};

/**
 * getSeasonFromWeather
 * Combines agricultural calendar cycles with live weather observations.
 */
export const getSeasonFromWeather = (date, weatherData, city) => {
  if (!date) return "Winter";
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Winter";
  const month = d.getMonth() + 1;

  if (weatherData) {
    const { temperature, humidity, rainfall } = weatherData;

    // Strong monsoon signal: notable rainfall or typical monsoon months with high humidity
    if (rainfall > 30 || ([6, 7, 8, 9].includes(month) && (humidity >= 70 || rainfall > 5))) {
      return "Monsoon";
    }

    // High summer heat: hot & dry in pre-monsoon summer months
    if (temperature >= 35 && [3, 4, 5, 6].includes(month)) {
      return "Summer";
    }

    // Winter / Rabi season (cool conditions or October-February sowing)
    const zone = cityClimateZone[city] || "semi-arid";
    const threshold = winterTempThreshold[zone] || 22;
    if (temperature <= threshold || [10, 11, 12, 1, 2].includes(month)) {
      return "Winter";
    }
  }

  return getSeason(d);
};

const locationRegionMap = {
  Pune:      "Maharashtra",
  Mumbai:    "Maharashtra",
  Nagpur:    "Maharashtra",
  Indore:    "Madhya Pradesh",
  Bhopal:    "Madhya Pradesh",
  Delhi:     "North India",
  Lucknow:   "North India",
  Jaipur:    "North India",
  Kolkata:   "West Bengal",
  Chennai:   "South India",
  Bangalore: "South India",
  Hyderabad: "Telangana",
  Goa:       "Goa",
  Ahmedabad: "Gujarat",
};

export const locationToRegion = (city) => {
  return locationRegionMap[city] || "General";
};

export const getCityClimateZone = (city) => {
  return cityClimateZone[city] || "semi-arid";
};

/**
 * calculateCropScore
 * Calculates an intuitive 0–10 compatibility rating based on agronomic requirements.
 */
export const calculateCropScore = (crop, userInputs) => {
  if (!crop) return 0;
  let score = 0;

  // 1. Season compatibility (Weight: 3 points)
  const cropSeasons = crop.seasons || [];
  if (cropSeasons.includes(userInputs.season)) {
    score += 3;
  } else if (
    (userInputs.season === "Winter" && cropSeasons.includes("PostMonsoon")) ||
    (userInputs.season === "Monsoon" && cropSeasons.includes("Summer")) ||
    (userInputs.season === "Summer" && cropSeasons.includes("Monsoon"))
  ) {
    score += 1.5;
  } else {
    score += 0.5;
  }

  // 2. Soil Type (Weight: 2 points)
  const soilTypes = crop.soilTypes || [];
  if (soilTypes.includes(userInputs.soil)) {
    score += 2;
  } else if (["Loamy", "Alluvial"].includes(userInputs.soil)) {
    // Highly versatile, fertile loam/alluvium
    score += 1.5;
  } else if (["Black", "Clayey"].includes(userInputs.soil) && ["Loamy", "Clayey"].some(s => soilTypes.includes(s))) {
    score += 1.2;
  } else {
    score += 0.8;
  }

  // 3. Temperature Range (Weight: 2 points)
  const [minTemp, maxTemp] = crop.tempRange || [15, 30];
  const temp = userInputs.temperature ?? 25;
  if (temp >= minTemp && temp <= maxTemp) {
    score += 2;
  } else if (temp >= minTemp - 4 && temp <= maxTemp + 4) {
    // Within manageable microclimate tolerance
    score += 1.3;
  } else if (temp >= minTemp - 8 && temp <= maxTemp + 8) {
    score += 0.7;
  } else {
    score += 0.3;
  }

  // 4. Water & Rainfall (Weight: 2 points)
  // Irrigated farms do not solely depend on live atmospheric rain!
  const hasIrrigation = Boolean(
    userInputs.irrigationMethod ||
    userInputs.waterSource ||
    userInputs.waterSourceType
  );
  const [minRain, maxRain] = crop.rainfallRange || [40, 100];
  const rain = userInputs.rainfall ?? 0;

  if (rain >= minRain && rain <= maxRain) {
    score += 2;
  } else if (hasIrrigation || rain > 0) {
    // Controlled irrigation fulfills the crop water demand
    score += 1.8;
  } else if (rain >= minRain * 0.4) {
    score += 1.0;
  } else {
    score += 0.5;
  }

  // 5. Humidity (Weight: 1 point)
  const [minHum, maxHum] = crop.humidityRange || [40, 70];
  const hum = userInputs.humidity ?? 60;
  if (hum >= minHum && hum <= maxHum) {
    score += 1;
  } else if (hum >= minHum - 15 && hum <= maxHum + 15) {
    score += 0.7;
  } else {
    score += 0.4;
  }

  // 6. Soil pH (Weight: 1 point)
  const [minPh, maxPh] = crop.phRange || [6.0, 7.5];
  const ph = userInputs.ph ?? 6.5;
  if (ph >= minPh && ph <= maxPh) {
    score += 1;
  } else if (ph >= minPh - 0.6 && ph <= maxPh + 0.6) {
    score += 0.7;
  } else {
    score += 0.3;
  }

  return Math.min(10, Math.max(1, Math.round((score / 11) * 10)));
};

export const getBestCrop = (crops, userInputs) => {
  let bestCrop = null;
  let maxScore = -1;

  for (const crop of crops) {
    const score = calculateCropScore(crop, userInputs);
    if (score > maxScore) {
      maxScore = score;
      bestCrop = { ...crop, score };
    }
  }

  return bestCrop;
};

// ── Yield Benchmarks & Economic Prediction Engine ──────────────────────────
export const CROP_YIELD_BENCHMARKS = {
  Wheat: {
    baseYieldMin: 18,
    baseYieldMax: 24,
    unit: 'Quintals',
    pricePerUnit: 2275, // ₹/quintal (Government MSP)
    waterLitersPerAcre: 1800000,
    growthDays: 130,
    optimalSoil: ['Loamy', 'Black', 'Alluvial'],
  },
  Rice: {
    baseYieldMin: 22,
    baseYieldMax: 30,
    unit: 'Quintals',
    pricePerUnit: 2300,
    waterLitersPerAcre: 3500000,
    growthDays: 135,
    optimalSoil: ['Clayey', 'Loamy', 'Alluvial'],
  },
  Cotton: {
    baseYieldMin: 9,
    baseYieldMax: 15,
    unit: 'Quintals',
    pricePerUnit: 7121,
    waterLitersPerAcre: 2200000,
    growthDays: 165,
    optimalSoil: ['Black', 'Loamy', 'Alluvial'],
  },
  Sugarcane: {
    baseYieldMin: 38,
    baseYieldMax: 52,
    unit: 'Tonnes',
    pricePerUnit: 3150,
    waterLitersPerAcre: 5500000,
    growthDays: 270,
    optimalSoil: ['Loamy', 'Black', 'Alluvial'],
  },
  Maize: {
    baseYieldMin: 24,
    baseYieldMax: 32,
    unit: 'Quintals',
    pricePerUnit: 2090,
    waterLitersPerAcre: 1900000,
    growthDays: 105,
    optimalSoil: ['Loamy', 'Sandy', 'Alluvial'],
  },
  Tomato: {
    baseYieldMin: 14,
    baseYieldMax: 22,
    unit: 'Tonnes',
    pricePerUnit: 15000, // ₹15/kg = ₹15,000/tonne
    waterLitersPerAcre: 1600000,
    growthDays: 95,
    optimalSoil: ['Loamy', 'Sandy', 'Red'],
  },
};

/**
 * Predicts realistic harvest yields, revenues, and water requirements.
 */
export const predictYieldAndEconomics = ({
  cropName,
  landSizeAcres,
  irrigationMethod,
  soilType,
  expectedInvestment,
  compatibilityScore = 8,
  sowingDate,
}) => {
  const benchmark = CROP_YIELD_BENCHMARKS[cropName];
  if (!benchmark) return null;

  const acres = Math.max(0.1, parseFloat(landSizeAcres) || 1.0);
  let multiplier = 1.0;

  // Irrigation method efficiency uplift
  if (irrigationMethod === 'Drip') multiplier += 0.15;
  else if (irrigationMethod === 'Sprinkler') multiplier += 0.08;

  // Soil optimization bonus
  if (benchmark.optimalSoil.includes(soilType)) {
    multiplier += 0.05;
  }

  // Compatibility score adjustment
  if (compatibilityScore >= 9) multiplier += 0.10;
  else if (compatibilityScore >= 7) multiplier += 0.05;
  else if (compatibilityScore <= 4) multiplier -= 0.15;

  const minYieldPerAcre = Math.round(benchmark.baseYieldMin * multiplier * 10) / 10;
  const maxYieldPerAcre = Math.round(benchmark.baseYieldMax * multiplier * 10) / 10;
  const avgYieldPerAcre = Math.round(((minYieldPerAcre + maxYieldPerAcre) / 2) * 10) / 10;

  const totalMinYield = Math.round(minYieldPerAcre * acres * 10) / 10;
  const totalMaxYield = Math.round(maxYieldPerAcre * acres * 10) / 10;
  const totalAvgYield = Math.round(avgYieldPerAcre * acres * 10) / 10;

  const estRevenueMin = Math.round(totalMinYield * benchmark.pricePerUnit);
  const estRevenueMax = Math.round(totalMaxYield * benchmark.pricePerUnit);
  const estRevenueAvg = Math.round(totalAvgYield * benchmark.pricePerUnit);

  const investment = parseFloat(expectedInvestment) || (acres * 14000);
  const estimatedProfit = Math.max(0, estRevenueAvg - investment);
  const roi = Math.round((estimatedProfit / Math.max(1, investment)) * 100);

  // Irrigation water requirement
  let waterMultiplier = 1.0;
  if (irrigationMethod === 'Drip') waterMultiplier = 0.55;
  else if (irrigationMethod === 'Sprinkler') waterMultiplier = 0.75;
  const totalWaterRequirementLiters = Math.round(benchmark.waterLitersPerAcre * acres * waterMultiplier);

  // Format water display nicely
  let waterDisplay = `${(totalWaterRequirementLiters / 1000000).toFixed(2)} Million Liters`;
  if (totalWaterRequirementLiters < 1000000) {
    waterDisplay = `${(totalWaterRequirementLiters / 1000).toFixed(0)}k Liters`;
  }

  let harvestDate = null;
  if (sowingDate) {
    const sDate = new Date(sowingDate);
    if (!isNaN(sDate.getTime())) {
      sDate.setDate(sDate.getDate() + benchmark.growthDays);
      harvestDate = sDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }

  return {
    cropName,
    unit: benchmark.unit,
    pricePerUnit: benchmark.pricePerUnit,
    yieldRangePerAcre: `${minYieldPerAcre} – ${maxYieldPerAcre} ${benchmark.unit}/acre`,
    totalYieldRange: `${totalMinYield.toLocaleString('en-IN')} – ${totalMaxYield.toLocaleString('en-IN')} ${benchmark.unit}`,
    totalAvgYield,
    estRevenueMin,
    estRevenueMax,
    estRevenueAvg,
    estimatedProfit,
    roi,
    waterDisplay,
    growthDays: benchmark.growthDays,
    harvestDate,
  };
};
