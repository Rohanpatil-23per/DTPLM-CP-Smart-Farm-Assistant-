import os
import requests

OLLAMA_ENDPOINT = os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:1b")

WEATHER_SYSTEM_PROMPT = """
You are an expert agricultural weather advisor.

You analyze weather data and give practical farming advice.

Keep answers:
- Short (max 7 lines unless needed)
- Structured
- Clear
- Action-oriented

Format:

• Weather Summary
• Irrigation Advice
• Risk Alerts
• Recommended Action

Use emojis properly.
No long paragraphs.
No generic text.
No repetition.
No markdown symbols like **.
""".strip()


def _rule_based_advice(weather, rules):
    """Generate structured rule-based agricultural advice if LLM is unavailable."""
    temp = weather.get('current', {}).get('temp', 28)
    humidity = weather.get('current', {}).get('humidity', 50)
    rain_chance = weather.get('current', {}).get('rain_chance', 10)
    irrigation = rules.get('irrigation', 'Normal')
    irrigation_reason = rules.get('irrigation_reason', 'Maintain regular schedule')
    pest_risk = rules.get('pest_risk', 'Low')
    spray = rules.get('spray_warning', 'Safe to spray')
    fertilizer = rules.get('fertilizer_warning', 'Safe to apply')

    lines = [
        f"🌤️ Weather Summary: Current temperature is {temp}°C with {humidity}% humidity and {rain_chance}% chance of rain.",
        f"💧 Irrigation Advice: {irrigation} — {irrigation_reason}.",
        f"⚠️ Risk Alerts: Pest risk is {pest_risk}. {spray}.",
        f"🌱 Recommended Action: {fertilizer}. Inspect topsoil moisture before field operations."
    ]
    return "\n\n".join(lines)


def generate_weather_advice(weather, rules):
    prompt = f"""
{WEATHER_SYSTEM_PROMPT}

Weather Data:
Temperature: {weather['current']['temp']}°C
Humidity: {weather['current']['humidity']}%
Rain Chance: {weather['current']['rain_chance']}%
Wind Speed: {weather['current']['wind']} m/s

Rules:
Irrigation: {rules['irrigation']} ({rules['irrigation_reason']})
Pest Risk: {rules['pest_risk']}
Disease Risk: {rules['disease_risk']}
Spray Warning: {rules['spray_warning']}
Fertilizer Warning: {rules['fertilizer_warning']}

Generate clear structured advice.
""".strip()

    model_name = os.getenv("OLLAMA_MODEL", "llama3.2:1b")
    fallback_model = os.getenv("OLLAMA_FALLBACK_MODEL", "llama3.1:8b")

    for m in [model_name, fallback_model]:
        if not m:
            continue
        payload = {
            "model": m,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": 128,
                "temperature": 0.3,
            }
        }
        try:
            response = requests.post(OLLAMA_ENDPOINT, json=payload, timeout=20)
            if response.status_code == 200:
                data = response.json()
                text = (data.get("response", "") if isinstance(data, dict) else "").strip()
                if text:
                    return text
        except requests.RequestException:
            pass

    # High quality fallback
    return _rule_based_advice(weather, rules)
