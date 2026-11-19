import os
import requests

payload = {
    "userId": "purva_test",
    "cropName": "Wheat",
    "location": "Pune",
    "soilType": "Loamy",
    "sowingDate": "2026-02-20T00:00:00Z",
    "irrigationMethod": "Drip",
    "landSizeAcres": 1.0,
    "expectedInvestment": 1000,
    "waterSourceType": "Well",
}

api_base = os.getenv("API_BASE_URL", "http://localhost:8000")
resp = requests.post(f"{api_base}/crop-plan/create", json=payload)
print(resp.status_code)
print(resp.text)
