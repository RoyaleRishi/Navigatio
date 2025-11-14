import requests
import json
from typing import List, Dict, Any, Optional
import time

class PlacesAPI:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://maps.googleapis.com/maps/api/place"
        
    def _get_place_coordinates(self, location: str) -> Optional[Dict[str, float]]:
        """Get coordinates for a location (city or address)."""
        url = f"{self.base_url}/findplacefromtext/json"
        params = {
            "input": location,
            "inputtype": "textquery",
            "fields": "geometry/location",
            "key": self.api_key
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data.get("candidates"):
                location_data = data["candidates"][0]["geometry"]["location"]
                return location_data
        except Exception as e:
            print(f"Error getting coordinates: {e}")
        
        return None
    
    def _get_place_details(self, place_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a place."""
        fields = [
            'name', 'formatted_address', 'geometry/location', 'rating',
            'user_ratings_total', 'price_level', 'types', 'photos',
            'reviews', 'website', 'formatted_phone_number',
            'wheelchair_accessible_entrance', 'serves_vegetarian_food',
            'serves_vegan_food', 'opening_hours', 'editorial_summary'
        ]
        
        url = f"{self.base_url}/details/json"
        params = {
            'place_id': place_id,
            'fields': ','.join(fields),
            'key': self.api_key,
            'language': 'en'
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data['status'] == 'OK':
                return data.get('result', {})
            
            # Retry with basic fields if some are not available
            basic_fields = ['name', 'formatted_address', 'geometry/location', 
                          'rating', 'user_ratings_total', 'price_level', 'photos', 'reviews']
            params['fields'] = ','.join(basic_fields)
            response = requests.get(url, params=params)
            data = response.json()
            
            if data['status'] == 'OK':
                return data.get('result', {})
                
        except Exception as e:
            print(f"Error getting place details: {e}")
        
        return None
    
    def _get_photo_url(self, photo_reference: str, max_width: int = 400) -> str:
        """Generate a photo URL from a photo reference."""
        url = f"{self.base_url}/photo"
        params = {
            'photo_reference': photo_reference,
            'maxwidth': max_width,
            'key': self.api_key
        }
        return f"{url}?{'&'.join([f'{k}={v}' for k, v in params.items()])}"
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance in meters between two coordinates using Haversine formula."""
        from math import radians, cos, sin, asin, sqrt
        
        # Convert to radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        r = 6371000  # Radius of earth in meters
        
        return c * r
    
    def search_hotels(self, city: str, price_range: str, location_prefs: str, 
                     excluded_hotels: List[str]) -> List[Dict[str, Any]]:
        """Search for hotels in a city."""
        # Get city coordinates
        coords = self._get_place_coordinates(city)
        if not coords:
            return []
        
        # Build keywords
        keywords = ["hotel", "lodging", "accommodation"]
        if location_prefs:
            keywords.append(location_prefs.lower())
        
        # Search for lodging
        url = f"{self.base_url}/nearbysearch/json"
        params = {
            "location": f"{coords['lat']},{coords['lng']}",
            "radius": 5000,  # 5km radius
            "type": "lodging",
            "key": self.api_key
        }
        
        hotels = []
        next_page_token = None
        max_results = 20
        
        while len(hotels) < max_results:
            try:
                if next_page_token:
                    params['pagetoken'] = next_page_token
                    time.sleep(2)  # Required delay between page requests
                
                response = requests.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if data.get('status') != 'OK':
                    break
                
                for place in data.get('results', []):
                    place_name = place.get('name', '')
                    if place_name not in excluded_hotels and len(hotels) < max_results:
                        hotels.append({
                            'name': place_name,
                            'placeId': place.get('place_id'),
                            'address': place.get('vicinity') or place.get('formatted_address', ''),
                            'location': place.get('geometry', {}).get('location', {}),
                            'rating': place.get('rating', 0),
                            'user_ratings_total': place.get('user_ratings_total', 0),
                            'price_level': place.get('price_level'),
                            'types': place.get('types', []),
                            'photos': place.get('photos', [])
                        })
                
                next_page_token = data.get('next_page_token')
                if not next_page_token:
                    break
                    
            except Exception as e:
                print(f"Error searching hotels: {e}")
                break
        
        # Get detailed information for each hotel
        detailed_hotels = []
        for hotel in hotels[:max_results]:
            details = self._get_place_details(hotel['placeId'])
            if details:
                # Get images
                images = []
                for photo in details.get('photos', [])[:2]:
                    photo_ref = photo.get('photo_reference')
                    if photo_ref:
                        images.append(self._get_photo_url(photo_ref))
                
                # Get review snippets
                review_snippets = []
                for review in details.get('reviews', [])[:3]:
                    if 'text' in review:
                        review_snippets.append(review['text'][:200])  # Limit length
                
                hotel.update({
                    'images': images,
                    'address': details.get('formatted_address', hotel['address']),
                    'reviews': {
                        'rating': details.get('rating', hotel.get('rating', 0)),
                        'totalReviews': details.get('user_ratings_total', hotel.get('user_ratings_total', 0)),
                        'snippets': review_snippets
                    },
                    'roomPrices': {
                        'available': False,  # Would need booking API for real prices
                        'pricePerNight': None,
                        'totalPrice': None,
                        'currency': 'USD'
                    }
                })
                detailed_hotels.append(hotel)
            time.sleep(0.1)  # Rate limiting
        
        return detailed_hotels
    
    def search_restaurants(self, address: str, price_range: str, eating_preferences: str,
                          food_restrictions: List[str]) -> List[Dict[str, Any]]:
        """Search for restaurants near an address."""
        # Get address coordinates
        coords = self._get_place_coordinates(address)
        if not coords:
            return []
        
        # Build keywords
        keywords = ["restaurant", "food"]
        if eating_preferences:
            keywords.extend(eating_preferences.lower().split())
        if food_restrictions:
            keywords.extend([r.lower() for r in food_restrictions])
        
        # Search for restaurants
        url = f"{self.base_url}/nearbysearch/json"
        params = {
            "location": f"{coords['lat']},{coords['lng']}",
            "radius": 2000,  # 2km radius
            "type": "restaurant",
            "key": self.api_key
        }
        
        restaurants = []
        next_page_token = None
        max_results = 20
        
        ref_lat = coords['lat']
        ref_lng = coords['lng']
        
        while len(restaurants) < max_results:
            try:
                if next_page_token:
                    params['pagetoken'] = next_page_token
                    time.sleep(2)
                
                response = requests.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if data.get('status') != 'OK':
                    break
                
                for place in data.get('results', []):
                    if len(restaurants) < max_results:
                        place_loc = place.get('geometry', {}).get('location', {})
                        distance_meters = self._calculate_distance(
                            ref_lat, ref_lng,
                            place_loc.get('lat', ref_lat),
                            place_loc.get('lng', ref_lng)
                        )
                        
                        restaurants.append({
                            'name': place.get('name'),
                            'placeId': place.get('place_id'),
                            'address': place.get('vicinity') or place.get('formatted_address', ''),
                            'location': place_loc,
                            'rating': place.get('rating', 0),
                            'user_ratings_total': place.get('user_ratings_total', 0),
                            'price_level': place.get('price_level'),
                            'photos': place.get('photos', []),
                            'distance_meters': distance_meters
                        })
                
                next_page_token = data.get('next_page_token')
                if not next_page_token:
                    break
                    
            except Exception as e:
                print(f"Error searching restaurants: {e}")
                break
        
        # Get detailed information for each restaurant
        detailed_restaurants = []
        for restaurant in restaurants[:max_results]:
            details = self._get_place_details(restaurant['placeId'])
            if details:
                # Get images
                images = []
                for photo in details.get('photos', [])[:2]:
                    photo_ref = photo.get('photo_reference')
                    if photo_ref:
                        images.append(self._get_photo_url(photo_ref))
                
                # Get review snippets
                review_snippets = []
                for review in details.get('reviews', [])[:3]:
                    if 'text' in review:
                        review_snippets.append(review['text'][:200])
                
                # Format price level
                price_level_map = {0: '', 1: '$', 2: '$$', 3: '$$$', 4: '$$$$'}
                price_level = price_level_map.get(details.get('price_level'), '')
                
                # Format distance
                distance_m = restaurant['distance_meters']
                if distance_m < 1000:
                    distance_text = f"{int(distance_m)} meters"
                else:
                    distance_text = f"{distance_m/1000:.1f} km"
                
                restaurant.update({
                    'images': images,
                    'priceLevel': price_level,
                    'address': details.get('formatted_address', restaurant['address']),
                    'reviews': {
                        'rating': details.get('rating', restaurant.get('rating', 0)),
                        'totalReviews': details.get('user_ratings_total', restaurant.get('user_ratings_total', 0)),
                        'snippets': review_snippets
                    },
                    'distance': {
                        'meters': int(distance_m),
                        'text': distance_text
                    }
                })
                detailed_restaurants.append(restaurant)
            time.sleep(0.1)
        
        return detailed_restaurants
    
    def search_activities(self, address: str, price_range: str, max_distance: str,
                         search_prompt: str) -> List[Dict[str, Any]]:
        """Search for activities and attractions near an address."""
        # Get address coordinates
        coords = self._get_place_coordinates(address)
        if not coords:
            return []
        
        # Convert max_distance to meters
        radius = 10000  # Default 10km
        if max_distance:
            max_distance_lower = max_distance.lower()
            if 'mile' in max_distance_lower:
                try:
                    miles = float(max_distance_lower.split()[0])
                    radius = int(miles * 1609.34)  # Convert to meters
                except:
                    pass
            elif 'km' in max_distance_lower or 'kilometer' in max_distance_lower:
                try:
                    km = float(max_distance_lower.split()[0])
                    radius = int(km * 1000)
                except:
                    pass
            elif 'walking' in max_distance_lower:
                radius = 2000  # 2km for walking distance
        
        # Search for tourist attractions and related places
        url = f"{self.base_url}/nearbysearch/json"
        params = {
            "location": f"{coords['lat']},{coords['lng']}",
            "radius": radius,
            "type": "tourist_attraction",
            "key": self.api_key
        }
        
        activities = []
        next_page_token = None
        max_results = 20
        
        ref_lat = coords['lat']
        ref_lng = coords['lng']
        
        while len(activities) < max_results:
            try:
                if next_page_token:
                    params['pagetoken'] = next_page_token
                    time.sleep(2)
                
                response = requests.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if data.get('status') != 'OK':
                    break
                
                for place in data.get('results', []):
                    if len(activities) < max_results:
                        place_loc = place.get('geometry', {}).get('location', {})
                        distance_meters = self._calculate_distance(
                            ref_lat, ref_lng,
                            place_loc.get('lat', ref_lat),
                            place_loc.get('lng', ref_lng)
                        )
                        
                        activities.append({
                            'name': place.get('name'),
                            'placeId': place.get('place_id'),
                            'address': place.get('vicinity') or place.get('formatted_address', ''),
                            'location': place_loc,
                            'rating': place.get('rating', 0),
                            'user_ratings_total': place.get('user_ratings_total', 0),
                            'types': place.get('types', []),
                            'photos': place.get('photos', []),
                            'distance_meters': distance_meters
                        })
                
                next_page_token = data.get('next_page_token')
                if not next_page_token:
                    break
                    
            except Exception as e:
                print(f"Error searching activities: {e}")
                break
        
        # Get detailed information for each activity
        detailed_activities = []
        for activity in activities[:max_results]:
            details = self._get_place_details(activity['placeId'])
            if details:
                # Get images
                images = []
                for photo in details.get('photos', [])[:2]:
                    photo_ref = photo.get('photo_reference')
                    if photo_ref:
                        images.append(self._get_photo_url(photo_ref))
                
                # Get review snippets
                review_snippets = []
                for review in details.get('reviews', [])[:3]:
                    if 'text' in review:
                        review_snippets.append(review['text'][:200])
                
                # Determine activity type
                types_list = details.get('types', activity.get('types', []))
                activity_type = 'attraction'
                if 'museum' in ' '.join(types_list).lower():
                    activity_type = 'museum'
                elif 'park' in ' '.join(types_list).lower():
                    activity_type = 'park'
                elif 'zoo' in ' '.join(types_list).lower():
                    activity_type = 'zoo'
                elif 'theater' in ' '.join(types_list).lower() or 'theatre' in ' '.join(types_list).lower():
                    activity_type = 'theater'
                
                # Format distance
                distance_m = activity['distance_meters']
                if distance_m < 1000:
                    distance_text = f"{int(distance_m)} meters"
                else:
                    distance_text = f"{distance_m/1000:.1f} km"
                
                activity.update({
                    'images': images,
                    'priceInfo': price_range if price_range else 'Price varies',
                    'address': details.get('formatted_address', activity['address']),
                    'reviews': {
                        'rating': details.get('rating', activity.get('rating', 0)),
                        'totalReviews': details.get('user_ratings_total', activity.get('user_ratings_total', 0)),
                        'snippets': review_snippets
                    },
                    'distance': {
                        'meters': int(distance_m),
                        'text': distance_text
                    },
                    'activityType': activity_type
                })
                detailed_activities.append(activity)
            time.sleep(0.1)
        
        return detailed_activities

