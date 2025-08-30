import requests
import json

# Test the video call creation endpoint
url = "http://localhost:5000/api/meetings/video-call/create"
headers = {"Content-Type": "application/json"}
data = {
    "claimId": "TEST-123",
    "patientName": "Test Patient",
    "procedure": "Test Verification"
}

try:
    response = requests.post(url, headers=headers, json=data)
    print("Status Code:", response.status_code)
    print("Response:", response.json())
except Exception as e:
    print("Error:", e)
