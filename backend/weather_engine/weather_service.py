import os
import math
import requests
from datetime import datetime, timedelta

OPENWEATHER_BASE = "https://api.openweathermap.org/data/2.5"
ONECALL_BASE = "https://api.openweathermap.org/data/3.0/onecall"
GEO_BASE = "https://api.openweathermap.org/geo/1.0/reverse"

KNOWN_CITIES = [
    {"city": "Pune", "state": "Maharashtra", "country": "IN", "lat": 18.5204, "lon": 73.8567, "base_temp": 28, "humidity": 52, "condition": "Clear"},
    {"city": "Mumbai", "state": "Maharashtra", "country": "IN", "lat": 19.0760, "lon": 72.8777, "base_temp": 30, "humidity": 75, "condition": "Clouds"},
    {"city": "New Delhi", "state": "Delhi", "country": "IN", "lat": 28.6139, "lon": 77.2090, "base_temp": 29, "humidity": 45, "condition": "Clear"},
    {"city": "Bengaluru", "state": "Karnataka", "country": "IN", "lat": 12.9716, "lon": 77.5946, "base_temp": 26, "humidity": 60, "condition": "Clouds"},
    {"city": "Hyderabad", "state": "Telangana", "country": "IN", "lat": 17.3850, "lon": 78.4867, "base_temp": 29, "humidity": 55, "condition": "Clear"},
    {"city": "Jaipur", "state": "Rajasthan", "country": "IN", "lat": 26.9124, "lon": 75.7873, "base_temp": 31, "humidity": 38, "condition": "Clear"},
    {"city": "Ahmedabad", "state": "Gujarat", "country": "IN", "lat": 23.0225, "lon": 72.5714, "base_temp": 32, "humidity": 48, "condition": "Clear"},
    {"city": "Chennai", "state": "Tamil Nadu", "country": "IN", "lat": 13.0827, "lon": 80.2707, "base_temp": 31, "humidity": 78, "condition": "Clouds"},
    {"city": "Kolkata", "state": "West Bengal", "country": "IN", "lat": 22.5726, "lon": 88.3639, "base_temp": 30, "humidity": 72, "condition": "Clouds"},
    {"city": "Lucknow", "state": "Uttar Pradesh", "country": "IN", "lat": 26.8467, "lon": 80.9462, "base_temp": 29, "humidity": 50, "condition": "Clear"},
    {"city": "Chandigarh", "state": "Punjab", "country": "IN", "lat": 30.7333, "lon": 76.7794, "base_temp": 27, "humidity": 48, "condition": "Clear"},
    {"city": "Indore", "state": "Madhya Pradesh", "country": "IN", "lat": 22.7196, "lon": 75.8577, "base_temp": 28, "humidity": 50, "condition": "Clear"},
]


def _get_api_key():
    return os.getenv("OPENWEATHER_API_KEY") or os.getenv("VITE_OPENWEATHER_API_KEY")


def _map_condition(code):
    if 200 <= code < 600:
        return "Rain"
    if 600 <= code < 700:
        return "Snow"
    if 700 <= code < 800:
        return "Clouds"
    if code == 800:
        return "Clear"
    return "Clouds"


def _format_hour(ts):
    return datetime.fromtimestamp(ts).strftime("%I:%M %p")


def _format_day(ts):
    return datetime.fromtimestamp(ts).strftime("%a")


def _find_closest_city(lat, lon):
    closest = None
    min_dist = float("inf")
    for item in KNOWN_CITIES:
        d = math.hypot(lat - item["lat"], lon - item["lon"])
        if d < min_dist:
            min_dist = d
            closest = item
    return closest


def _generate_fallback_weather(lat, lon):
    """Generate realistic agricultural weather forecast when OpenWeather API key is not present or invalid."""
    city_info = _find_closest_city(lat, lon)
    city_name = city_info["city"] if city_info else "Agricultural Region"
    state_name = city_info["state"] if city_info else "India"
    country_name = "IN"
    label = f"{city_name}, {state_name}, {country_name}"

    base_temp = city_info["base_temp"] if city_info else 28
    humidity = city_info["humidity"] if city_info else 55
    condition = city_info["condition"] if city_info else "Clear"

    now = datetime.now()
    hourly = []
    for i in range(24):
        target_time = now + timedelta(hours=i)
        hour = target_time.hour
        # Diurnal temperature cycle: peak around 14:00, coolest around 05:00
        diurnal_offset = 5.0 * math.sin((hour - 8) * math.pi / 12)
        hour_temp = round(base_temp + diurnal_offset)
        hour_rain_chance = 10 if condition == "Clear" else 35
        hour_cond = condition if hour_rain_chance < 40 else "Rain"

        hourly.append({
            "time": target_time.strftime("%I:%M %p"),
            "temp": hour_temp,
            "rain_chance": hour_rain_chance,
            "condition": hour_cond,
        })

    daily = []
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    day_conds = ["Clear", "Clear", "Clouds", "Clear", "Clouds", "Rain", "Clear"]
    for i in range(7):
        target_day = now + timedelta(days=i)
        day_str = target_day.strftime("%a")
        day_cond = day_conds[i % len(day_conds)]
        min_temp = round(base_temp - 5 + (i % 3) - 1)
        max_temp = round(base_temp + 4 + ((i * 2) % 3))
        rain_chance = 45 if day_cond == "Rain" else (20 if day_cond == "Clouds" else 5)
        rain_amount = 3.5 if day_cond == "Rain" else 0.0

        daily.append({
            "day": day_str,
            "min": min_temp,
            "max": max_temp,
            "rain_chance": rain_chance,
            "condition": day_cond,
            "rain": rain_amount,
        })

    return {
        "current": {
            "temp": base_temp,
            "humidity": humidity,
            "wind": 3.8,
            "rain": 0.0,
            "rain_chance": 10 if condition == "Clear" else 30,
            "condition": condition,
        },
        "hourly": hourly,
        "daily": daily,
        "location": {
            "city": city_name,
            "state": state_name,
            "country": country_name,
            "label": label,
        },
        "location_label": label,
        "is_live": False,
        "note": "Using realistic agricultural climate estimate. Configure OPENWEATHER_API_KEY in backend/.env for live satellite weather."
    }


def _fetch_location_label(lat, lon, api_key):
    params = {
        "lat": lat,
        "lon": lon,
        "limit": 1,
        "appid": api_key,
    }
    try:
        response = requests.get(GEO_BASE, params=params, timeout=10)
    except requests.RequestException:
        return None

    if not response.ok:
        return None

    try:
        data = response.json()
    except ValueError:
        return None

    if not isinstance(data, list) or not data:
        return None

    entry = data[0]
    city = entry.get("name")
    state = entry.get("state")
    country = entry.get("country")

    parts = [p for p in [city, state, country] if p]
    label = ", ".join(parts)

    return {
        "city": city,
        "state": state,
        "country": country,
        "label": label,
    }


def fetch_weather_data(lat, lon):
    api_key = _get_api_key()
    if not api_key:
        print("[INFO] OPENWEATHER_API_KEY is not configured; using smart climate forecast fallback.")
        return _generate_fallback_weather(lat, lon)

    location = _fetch_location_label(lat, lon, api_key)

    # Try One Call (7-day + hourly)
    params = {
        "lat": lat,
        "lon": lon,
        "appid": api_key,
        "units": "metric",
        "exclude": "minutely,alerts",
    }
    try:
        response = requests.get(ONECALL_BASE, params=params, timeout=15)
        if response.ok:
            data = response.json()
            hourly = data.get("hourly", [])[:24]
            daily = data.get("daily", [])[:7]
            current = data.get("current", {})

            return {
                "current": {
                    "temp": round(current.get("temp", 0)),
                    "humidity": current.get("humidity", 0),
                    "wind": current.get("wind_speed", 0),
                    "rain": current.get("rain", {}).get("1h", 0),
                    "rain_chance": round((hourly[0].get("pop", 0) if hourly else 0) * 100),
                    "condition": _map_condition(current.get("weather", [{}])[0].get("id", 800)),
                },
                "hourly": [
                    {
                        "time": _format_hour(h.get("dt", 0)),
                        "temp": round(h.get("temp", 0)),
                        "rain_chance": round(h.get("pop", 0) * 100),
                        "condition": _map_condition(h.get("weather", [{}])[0].get("id", 800)),
                    }
                    for h in hourly
                ],
                "daily": [
                    {
                        "day": _format_day(d.get("dt", 0)),
                        "min": round(d.get("temp", {}).get("min", 0)),
                        "max": round(d.get("temp", {}).get("max", 0)),
                        "rain_chance": round(d.get("pop", 0) * 100),
                        "condition": _map_condition(d.get("weather", [{}])[0].get("id", 800)),
                        "rain": d.get("rain", 0),
                    }
                    for d in daily
                ],
                "location": location,
                "location_label": (location or {}).get("label") if location else None,
                "is_live": True,
            }
    except Exception as exc:
        print(f"[DEBUG] OneCall request error: {exc}")

    # Fallback to standard 5-day/3-hour forecast
    forecast_params = {
        "lat": lat,
        "lon": lon,
        "appid": api_key,
        "units": "metric",
    }
    try:
        forecast = requests.get(f"{OPENWEATHER_BASE}/forecast", params=forecast_params, timeout=15)
        if forecast.ok:
            data = forecast.json()
            items = data.get("list", [])
            current_item = items[0] if items else {}

            hourly = items[:24] if len(items) >= 24 else items[:8]
            daily_map = {}
            for item in items:
                day_key = datetime.fromtimestamp(item["dt"]).strftime("%a")
                daily_map.setdefault(day_key, []).append(item)

            daily = []
            for day, entries in list(daily_map.items())[:7]:
                temps = [e["main"]["temp"] for e in entries]
                pops = [e.get("pop", 0) for e in entries]
                rain_sum = sum([e.get("rain", {}).get("3h", 0) for e in entries])
                daily.append({
                    "day": day,
                    "min": round(min(temps)) if temps else 0,
                    "max": round(max(temps)) if temps else 0,
                    "rain_chance": round(max(pops) * 100) if pops else 0,
                    "condition": _map_condition(entries[0]["weather"][0]["id"]) if entries else "Clouds",
                    "rain": rain_sum,
                })

            loc_label = None
            if location and location.get("label"):
                loc_label = location["label"]
            elif data.get("city", {}).get("name"):
                loc_label = f"{data['city']['name']}, {data.get('city', {}).get('country', 'IN')}"

            return {
                "current": {
                    "temp": round(current_item.get("main", {}).get("temp", 0)),
                    "humidity": current_item.get("main", {}).get("humidity", 0),
                    "wind": current_item.get("wind", {}).get("speed", 0),
                    "rain": current_item.get("rain", {}).get("3h", 0),
                    "rain_chance": round(current_item.get("pop", 0) * 100),
                    "condition": _map_condition(current_item.get("weather", [{}])[0].get("id", 800)),
                },
                "hourly": [
                    {
                        "time": _format_hour(h.get("dt", 0)),
                        "temp": round(h.get("main", {}).get("temp", 0)),
                        "rain_chance": round(h.get("pop", 0) * 100),
                        "condition": _map_condition(h.get("weather", [{}])[0].get("id", 800)),
                    }
                    for h in hourly
                ],
                "daily": daily,
                "location": location,
                "location_label": loc_label,
                "is_live": True,
            }
        else:
            print(f"[WARNING] OpenWeather returned status {forecast.status_code}: {forecast.text}")
    except Exception as exc:
        print(f"[WARNING] OpenWeather request exception: {exc}")

    # If OpenWeather call failed or returned error status, provide fallback
    return _generate_fallback_weather(lat, lon)
