"""
Example script to test the Navigatio Hotels API endpoints.
Make sure the Flask server is running before executing this script.
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:5000"
API_KEY = "your_api_key_here"  # Replace with your API key

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def test_hotel_search():
    """Test the hotel search endpoint."""
    print("Testing Hotel Search...")
    
    url = f"{BASE_URL}/hotels/search"
    payload = {
        "city": "San Francisco",
        "dateRange": {
            "checkIn": "2025-12-15",
            "checkOut": "2025-12-18"
        },
        "priceRange": "$100-200 per night",
        "locationPreferences": "near Fisherman's Wharf",
        "tripDescription": "Family vacation with two kids, looking for hotels with pools and nearby attractions",
        "excludedHotels": []
    }
    
    try:
        response = requests.post(url, headers=HEADERS, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_restaurant_search():
    """Test the restaurant search endpoint."""
    print("\nTesting Restaurant Search...")
    
    url = f"{BASE_URL}/restaurants/search"
    payload = {
        "address": "350 Fifth Avenue, New York, NY 10118",
        "priceRange": "$$-$$$",
        "eatingPreferences": "Italian or French cuisine, romantic atmosphere",
        "foodRestrictions": ["vegetarian options required", "no shellfish"]
    }
    
    try:
        response = requests.post(url, headers=HEADERS, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_activity_search():
    """Test the activity search endpoint."""
    print("\nTesting Activity Search...")
    
    url = f"{BASE_URL}/activities/search"
    payload = {
        "address": "1600 Amphitheatre Parkway, Mountain View, CA",
        "priceRange": "free to $30",
        "maxDistance": "10 miles",
        "searchPrompt": "Outdoor activities for families with young children, prefer parks and interactive museums"
    }
    
    try:
        response = requests.post(url, headers=HEADERS, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_health_check():
    """Test the health check endpoint."""
    print("\nTesting Health Check...")
    
    url = f"{BASE_URL}/health"
    
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Navigatio Hotels API Test Script")
    print("=" * 60)
    
    # Test health check first (doesn't require auth)
    test_health_check()
    
    # Update API_KEY if needed
    if API_KEY == "your_api_key_here":
        print("\n⚠️  WARNING: Please update API_KEY in this script before testing protected endpoints!")
        print("   Testing protected endpoints...")
    
    # Test protected endpoints
    results = {
        "health_check": test_health_check(),
        "hotel_search": test_hotel_search() if API_KEY != "your_api_key_here" else None,
        "restaurant_search": test_restaurant_search() if API_KEY != "your_api_key_here" else None,
        "activity_search": test_activity_search() if API_KEY != "your_api_key_here" else None,
    }
    
    print("\n" + "=" * 60)
    print("Test Results Summary")
    print("=" * 60)
    for test_name, result in results.items():
        if result is not None:
            status = "✓ PASSED" if result else "✗ FAILED"
            print(f"{test_name}: {status}")
        else:
            print(f"{test_name}: ⏭ SKIPPED (API key not set)")

