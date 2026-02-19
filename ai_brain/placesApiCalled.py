import requests
import json
from datetime import datetime

def generate_places_api_calls(trip_data, google_places_api_key):
    """
    Generates Google Places API calls for lodging, attractions, and nearby restaurants,
    aligning with user's specific needs.

    Args:
        trip_data (dict): A dictionary containing trip information, including:
            - "destination" (str): The primary destination for the trip.
            - "dates_of_travel" (dict): {"start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD"}
            - "accessibility_needs" (str): User's accessibility requirements.
            - "dietary_needs" (str): User's dietary restrictions.
            - "interests" (list): List of user's interests.
            - Other fields as per the user's provided format.
        google_places_api_key (str): Your Google Places API key.

    Returns:
        dict: A dictionary containing the actual API responses for lodging, attractions,
              and restaurants, or error messages if calls fail.
    """

    base_url = "https://maps.googleapis.com/maps/api/place/"
    destination = trip_data.get("destination")

    if not destination:
        print("Error: 'destination' is missing from trip_data.")
        return {"error": "'destination' is missing from trip_data."}

    print(f"--- Making Google Places API calls for destination: {destination} ---")

    dest_lat = None
    dest_lng = None
    destination_name = None

    # Step 1: Find the latitude and longitude of the main destination
    find_place_url = f"{base_url}findplacefromtext/json"
    find_place_params = {
        "input": destination,
        "inputtype": "textquery",
        "fields": "geometry,name,place_id",
        "key": google_places_api_key
    }
    print("\n--- Calling Find Place from Text API (to get destination coordinates and place_id) ---")
    try:
        response = requests.get(find_place_url, params=find_place_params)
        response.raise_for_status()
        data = response.json()

        if data and data.get("candidates"):
            location = data["candidates"][0]["geometry"]["location"]
            dest_lat = location["lat"]
            dest_lng = location["lng"]
            destination_name = data["candidates"][0].get("name", destination)
            destination_place_id = data["candidates"][0].get("place_id")
            print(f"Found destination coordinates for {destination_name}: Lat={dest_lat}, Lng={dest_lng}, Place ID={destination_place_id}")
        else:
            print(f"Could not find coordinates for the destination: {destination}. Response: {data}")
            return {"error": f"Could not find coordinates for {destination}"}
    except requests.exceptions.RequestException as e:
        print(f"Error making Find Place API call: {e}")
        return {"error": f"Find Place API call failed: {e}"}

    # Calculate length of stay for attractions radius
    length_of_stay_days = 0
    if trip_data.get("dates_of_travel") and trip_data["dates_of_travel"].get("start_date") and trip_data["dates_of_travel"].get("end_date"):
        try:
            start_date = datetime.strptime(trip_data["dates_of_travel"]["start_date"], "%Y-%m-%d")
            end_date = datetime.strptime(trip_data["dates_of_travel"]["end_date"], "%Y-%m-%d")
            length_of_stay_days = (end_date - start_date).days + 1
            print(f"Calculated length of stay: {length_of_stay_days} days.")
        except ValueError as e:
            print(f"Warning: Could not parse dates for length of stay: {e}")

    # Determine attractions radius based on length of stay
    attractions_radius = 5000 # Default to 5km
    if length_of_stay_days > 0:
        if length_of_stay_days <= 3:
            attractions_radius = 3000 # Shorter stays, smaller radius
        elif length_of_stay_days <= 7:
            attractions_radius = 7000 # Medium stays, medium radius
        else:
            attractions_radius = 15000 # Longer stays, larger radius (capped at 15km to avoid excessively broad searches)
    print(f"Attractions search radius set to: {attractions_radius} meters based on length of stay.")

    # Extract user needs for filtering
    user_accessibility_needs = trip_data.get("accessibility_needs", "").lower()
    user_dietary_needs = trip_data.get("dietary_needs", "").lower()
    user_interests = [interest.lower() for interest in trip_data.get("interests", [])]

    # Store locations of found lodging and attractions to find nearby restaurants
    found_poi_locations = []
    results_summary = {
        "destination_info": {
            "name": destination_name,
            "location": {"lat": dest_lat, "lng": dest_lng},
            "place_id": destination_place_id
        },
        "lodging": [],
        "attractions": [],
        "restaurants": []
    }

    # Step 2: Find Lodging options around the destination
    lodging_keywords = ["hotel", "resort", "motel", "accommodation"]
    if "wheelchair accessible" in user_accessibility_needs:
        lodging_keywords.append("wheelchair accessible") # Add as keyword for bias
    lodging_params = {
        "location": f"{dest_lat},{dest_lng}",
        "radius": 5000,
        "type": "lodging",
        "keyword": " OR ".join(lodging_keywords),
        "key": google_places_api_key
    }
    print("\n--- Calling Nearby Search API for Lodging (with accessibility bias) ---")
    lodging_url = f"{base_url}nearbysearch/json"
    try:
        response = requests.get(lodging_url, params=lodging_params)
        response.raise_for_status()
        data = response.json()
        if data and data.get("results"):
            for place in data["results"]:
                # Simple check for accessibility in name/types - for more robust, need Place Details
                place_name = place.get("name", "").lower()
                place_types = [t.lower() for t in place.get("types", [])]

                is_accessible_match = True
                if "wheelchair accessible" in user_accessibility_needs:
                    # Very basic check: does "wheelchair" appear in name or type?
                    if "wheelchair" not in place_name and "wheelchair_accessible" not in place_types:
                        is_accessible_match = False

                if is_accessible_match:
                    if "geometry" in place and "location" in place["geometry"]:
                        found_poi_locations.append(place["geometry"]["location"])
                        results_summary["lodging"].append({
                            "name": place.get("name"),
                            "address": place.get("vicinity") or place.get("formatted_address"),
                            "location": place["geometry"]["location"],
                            "place_id": place.get("place_id")
                        })
            print(f"Found {len(results_summary['lodging'])} lodging options aligning with needs.")
        else:
            print("No lodging options found.")
    except requests.exceptions.RequestException as e:
        print(f"Error making Lodging Nearby Search API call: {e}")
        results_summary["lodging_error"] = f"Lodging search failed: {e}"

    # Step 3: Find Attractions around the destination
    attraction_keywords = ["tourist_attraction", "sightseeing"]
    attraction_keywords.extend(user_interests) # Add user interests as keywords
    if "wheelchair accessible" in user_accessibility_needs:
        attraction_keywords.append("wheelchair accessible") # Add as keyword for bias

    attractions_params = {
        "location": f"{dest_lat},{dest_lng}",
        "radius": attractions_radius,
        "type": "tourist_attraction", # Use one type, keywords cover broader
        "keyword": " OR ".join(set(attraction_keywords)), # Use set to avoid duplicate keywords
        "key": google_places_api_key
    }
    print("\n--- Calling Nearby Search API for Attractions (with interests and accessibility bias) ---")
    attractions_url = f"{base_url}nearbysearch/json"
    try:
        response = requests.get(attractions_url, params=attractions_params)
        response.raise_for_status()
        data = response.json()
        if data and data.get("results"):
            for place in data["results"]:
                # Simple check for accessibility in name/types
                place_name = place.get("name", "").lower()
                place_types = [t.lower() for t in place.get("types", [])]

                is_accessible_match = True
                if "wheelchair accessible" in user_accessibility_needs:
                    if "wheelchair" not in place_name and "wheelchair_accessible" not in place_types:
                        is_accessible_match = False

                if is_accessible_match:
                    if "geometry" in place and "location" in place["geometry"]:
                        found_poi_locations.append(place["geometry"]["location"])
                        results_summary["attractions"].append({
                            "name": place.get("name"),
                            "address": place.get("vicinity") or place.get("formatted_address"),
                            "location": place["geometry"]["location"],
                            "place_id": place.get("place_id")
                        })
            print(f"Found {len(results_summary['attractions'])} attractions aligning with needs.")
        else:
            print("No attractions found.")
    except requests.exceptions.RequestException as e:
        print(f"Error making Attractions Nearby Search API call: {e}")
        results_summary["attractions_error"] = f"Attractions search failed: {e}"


    # Step 4: Find Restaurants near the found lodging and attractions
    restaurant_api_calls_made = []
    processed_locations = set()
    MAX_RESTAURANTS_PER_LOCATION = 2

    print("\n--- Calling Nearby Search API for Restaurants (near found lodging/attractions, with dietary bias) ---")
    if not found_poi_locations:
        print("No lodging or attractions found to base restaurant searches on.")

    for loc in found_poi_locations:
        loc_tuple = (loc["lat"], loc["lng"])
        if loc_tuple not in processed_locations:
            processed_locations.add(loc_tuple)

            restaurant_keywords = ["food", "dine", "cafe", "restaurant"]
            if user_dietary_needs:
                restaurant_keywords.append(user_dietary_needs) # Add dietary need as keyword for bias

            restaurant_params = {
                "location": f"{loc['lat']},{loc['lng']}",
                "radius": 1500,
                "type": "restaurant",
                "keyword": " OR ".join(set(restaurant_keywords)),
                "key": google_places_api_key
            }
            restaurant_url = f"{base_url}nearbysearch/json" 
            try:
                print(f"Searching restaurants near Lat={loc['lat']}, Lng={loc['lng']}")
                response = requests.get(restaurant_url, params=restaurant_params)
                response.raise_for_status()
                data = response.json()
                if data and data.get("results"):
                    # Limit the number of restaurants to MAX_RESTAURANTS_PER_LOCATION
                    restaurants_for_this_location = data["results"][:MAX_RESTAURANTS_PER_LOCATION]
                    for place in restaurants_for_this_location:
                        # Basic dietary check (already biased by keyword, but can refine)
                        place_name = place.get("name", "").lower()
                        place_types = [t.lower() for t in place.get("types", [])]
                        
                        is_dietary_match = True
                        if user_dietary_needs:
                            # A more robust check might involve parsing reviews or Place Details,
                            # but for now, we rely on keyword biasing and a basic name/type check.
                            if user_dietary_needs not in place_name and user_dietary_needs not in " ".join(place_types):
                                # This is a very simple check, the keyword in API params does most of the work
                                pass # Keep it simple as keyword biasing is primary

                        if is_dietary_match:
                            results_summary["restaurants"].append({
                                "name": place.get("name"),
                                "address": place.get("vicinity") or place.get("formatted_address"),
                                "location": place.get("geometry", {}).get("location"),
                                "place_id": place.get("place_id")
                            })
                    print(f"  Found {len(restaurants_for_this_location)} restaurants (limited to {MAX_RESTAURANTS_PER_LOCATION}) aligning with needs.")
                else:
                    print(f"  No restaurants found near Lat={loc['lat']}, Lng={loc['lng']}.")
                restaurant_api_calls_made.append(data)
            except requests.exceptions.RequestException as e:
                print(f"Error making Restaurant Nearby Search API call near {loc_tuple}: {e}")
                results_summary["restaurants_error"] = f"Restaurant search failed near {loc_tuple}: {e}"

    print("\n--- End of API Calls ---")
    with open("places.json", "w") as file:
        file.write(json.dumps(results_summary, indent=2))

# Sample trip data based on the format you provided
sample_trip_data = {
    "budget": "moderate",
    "starting_location": "New York, NY",
    "destination": "Los Angeles, CA",
    "accessibility_needs": "wheelchair accessible",
    "accessibility": True,
    "dietary_needs": "vegetarian",
    "age_group_of_travelers": "adults",
    "interests": ["beaches", "hiking", "museums"],
    "how_packed_trip": "relaxed",
    "ok_with_walking": True,
    "dates_of_travel": {"start_date": "2025-07-01", "end_date": "2025-07-07"},
    "trip_type": "leisure",
    "number_of_travelers": 2
}
