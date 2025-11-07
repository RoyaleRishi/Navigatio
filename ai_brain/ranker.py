import json
import os
import time
from typing import Dict, List, Any
import requests
import google.generativeai as genai
from datetime import datetime

class PlaceScorer:
    def __init__(self, google_api_key: str, gemini_api_key: str):
        """Initialize the PlaceScorer with API keys."""
        self.google_api_key = google_api_key
        self.gemini_api_key = gemini_api_key
        
        # Configure Gemini
        genai.configure(api_key=gemini_api_key)
        self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Load data
        self.load_data()
        
    def load_data(self):
        """Load places and trip details from JSON files."""
        with open('places.json', 'r') as f:
            self.places_data = json.load(f)
        
        with open('trip_details.json', 'r') as f:
            self.trip_details = json.load(f)
    
    def get_place_details(self, place_id: str) -> Dict[str, Any]:
        """Fetch detailed information about a place from Google Places API."""
        # Using correct field names from the official API documentation
        fields = [
            'name',
            'formatted_address',
            'geometry/location',
            'rating',
            'user_ratings_total',
            'price_level',
            'types',
            'opening_hours',
            'website',
            'formatted_phone_number',
            'reviews',
            'editorial_summary',
            'wheelchair_accessible_entrance',
            'serves_vegetarian_food',
            'serves_vegan_food',
            'dine_in',
            'delivery',
            'takeout',
            'reservable',
            'serves_breakfast',
            'serves_lunch',
            'serves_dinner',
            'serves_beer',
            'serves_wine',
            'live_music',
            'good_for_groups'
        ]
        
        url = "https://maps.googleapis.com/maps/api/place/details/json"
        params = {
            'place_id': place_id,
            'fields': ','.join(fields),
            'key': self.google_api_key,
            'language': 'en'
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data['status'] == 'OK':
                return data.get('result', {})
            elif data['status'] == 'INVALID_REQUEST':
                # Some fields might not be available for all place types
                # Retry with basic fields only
                basic_fields = [
                    'name',
                    'formatted_address',
                    'geometry/location',
                    'rating',
                    'user_ratings_total',
                    'price_level',
                    'types',
                    'website',
                    'wheelchair_accessible_entrance'
                ]
                params['fields'] = ','.join(basic_fields)
                response = requests.get(url, params=params)
                data = response.json()
                if data['status'] == 'OK':
                    return data.get('result', {})
                    
            print(f"Error fetching details for place_id {place_id}: {data.get('status')}")
            if 'error_message' in data:
                print(f"Error message: {data['error_message']}")
            return {}
        except Exception as e:
            print(f"Exception fetching details for place_id {place_id}: {str(e)}")
            return {}
    
    def create_scoring_prompt(self, place_type: str, place_data: Dict, place_details: Dict) -> str:
        """Create a prompt for Gemini to score a place based on user preferences."""
        base_prompt = f"""
        Score this {place_type} for a group trip based on the following criteria.
        Return ONLY a JSON object with the format: {{"score": <number 0-100>, "reasoning": "<brief explanation>"}}
        
        TRIP DETAILS:
        - Budget: ${self.trip_details['budget']} per person ({self.trip_details['number_of_travelers']} travelers)
        - Accessibility: One traveler uses a walker, group is NOT ok with much walking
        - Dietary needs: Vegetarian
        - Age group: {self.trip_details['age_group_of_travelers']}
        - Interests: {', '.join(self.trip_details['interests'])}
        - Trip style: {self.trip_details['how_packed_trip']}
        - Trip type: {self.trip_details['trip_type']}
        - Dates: {self.trip_details['dates_of_travel']['start_date']} to {self.trip_details['dates_of_travel']['end_date']}
        
        PLACE INFORMATION:
        Name: {place_data.get('name', 'Unknown')}
        Address: {place_data.get('address', 'Unknown')}
        """
        
        # Add specific criteria based on place type
        if place_type == 'lodging':
            prompt = base_prompt + f"""
        
        LODGING SCORING CRITERIA (weight accordingly):
        1. Wheelchair accessibility (30 points) - Essential due to walker
        2. Location convenience (20 points) - Close to attractions, minimal travel needed
        3. Price/Budget fit (20 points) - Within budget for 4 people for 2 nights
        4. Reviews/Rating (15 points) - Quality and guest satisfaction
        5. Amenities for young adults (15 points) - WiFi, common areas, etc.
        
        Google Places Details:
        {json.dumps(place_details, indent=2)}
        """
        
        elif place_type == 'restaurant':
            prompt = base_prompt + f"""
        
        RESTAURANT SCORING CRITERIA (weight accordingly):
        1. Vegetarian options (25 points) - Must have good vegetarian menu
        2. Wheelchair accessibility (25 points) - Essential due to walker
        3. Music/Atmosphere (20 points) - Aligns with music interest
        4. Price range (15 points) - Reasonable for young adults
        5. Reviews/Rating (15 points) - Food quality and service
        
        Google Places Details:
        {json.dumps(place_details, indent=2)}
        """
        
        elif place_type == 'attraction':
            prompt = base_prompt + f"""
        
        ATTRACTION SCORING CRITERIA (weight accordingly):
        1. Wheelchair accessibility (30 points) - Essential due to walker
        2. Music relevance (25 points) - Aligns with music interest
        3. Relaxed pace friendly (20 points) - Not too demanding or rushed
        4. Group friendly (15 points) - Good for friends in their 20s
        5. Value/Cost (10 points) - Worth the price
        
        Google Places Details:
        {json.dumps(place_details, indent=2)}
        """
        
        return prompt
    
    def score_place_with_gemini(self, place_type: str, place_data: Dict, place_details: Dict) -> Dict:
        """Use Gemini to score a place based on the criteria."""
        prompt = self.create_scoring_prompt(place_type, place_data, place_details)
        
        try:
            response = self.gemini_model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Extract JSON from response
            if result_text.startswith('```json'):
                result_text = result_text[7:-3]
            elif result_text.startswith('```'):
                result_text = result_text[3:-3]
            
            score_data = json.loads(result_text)
            
            return {
                'name': place_data.get('name'),
                'address': place_data.get('address'),
                'place_id': place_data.get('place_id'),
                'score': score_data.get('score', 0),
                'reasoning': score_data.get('reasoning', ''),
                'location': place_data.get('location', {})
            }
            
        except Exception as e:
            print(f"Error scoring {place_data.get('name')}: {str(e)}")
            return {
                'name': place_data.get('name'),
                'address': place_data.get('address'),
                'place_id': place_data.get('place_id'),
                'score': 0,
                'reasoning': f'Error during scoring: {str(e)}',
                'location': place_data.get('location', {})
            }
    
    def score_all_places(self):
        """Score all places in each category."""
        results = {
            'lodging': [],
            'restaurants': [],
            'attractions': []
        }
        
        # Score lodging
        print("Scoring lodging options...")
        for i, place in enumerate(self.places_data.get('lodging', [])):
            print(f"  Processing {i+1}/{len(self.places_data['lodging'])}: {place['name']}")
            
            # Get place details from Google
            details = self.get_place_details(place['place_id'])
            time.sleep(0.5)  # Rate limiting
            
            # Score with Gemini
            score_result = self.score_place_with_gemini('lodging', place, details)
            results['lodging'].append(score_result)
            time.sleep(1)  # Rate limiting for Gemini
        
        # Score restaurants
        print("\nScoring restaurants...")
        # Remove duplicates based on place_id
        unique_restaurants = {}
        for r in self.places_data.get('restaurants', []):
            unique_restaurants[r['place_id']] = r
        
        restaurant_list = list(unique_restaurants.values())
        
        for i, place in enumerate(restaurant_list):
            print(f"  Processing {i+1}/{len(restaurant_list)}: {place['name']}")
            
            # Get place details from Google
            details = self.get_place_details(place['place_id'])
            time.sleep(0.5)  # Rate limiting
            
            # Score with Gemini
            score_result = self.score_place_with_gemini('restaurant', place, details)
            results['restaurants'].append(score_result)
            time.sleep(1)  # Rate limiting for Gemini
        
        # Score attractions
        print("\nScoring attractions...")
        for i, place in enumerate(self.places_data.get('attractions', [])):
            print(f"  Processing {i+1}/{len(self.places_data['attractions'])}: {place['name']}")
            
            # Get place details from Google
            details = self.get_place_details(place['place_id'])
            time.sleep(0.5)  # Rate limiting
            
            # Score with Gemini
            score_result = self.score_place_with_gemini('attraction', place, details)
            results['attractions'].append(score_result)
            time.sleep(1)  # Rate limiting for Gemini
        
        return results
    
    def save_results(self, results: Dict):
        """Save scored results to JSON files, sorted by score."""
        # Sort each category by score (highest to lowest)
        for category in results:
            results[category].sort(key=lambda x: x['score'], reverse=True)
        
        # Save lodging scores
        with open('scored_lodging.json', 'w') as f:
            json.dump({
                'trip_details': self.trip_details,
                'scored_at': datetime.now().isoformat(),
                'lodging': results['lodging']
            }, f, indent=2)
        
        # Save restaurant scores
        with open('scored_restaurants.json', 'w') as f:
            json.dump({
                'trip_details': self.trip_details,
                'scored_at': datetime.now().isoformat(),
                'restaurants': results['restaurants']
            }, f, indent=2)
        
        # Save attraction scores
        with open('scored_attractions.json', 'w') as f:
            json.dump({
                'trip_details': self.trip_details,
                'scored_at': datetime.now().isoformat(),
                'attractions': results['attractions']
            }, f, indent=2)
        
        print("\nResults saved to:")
        print("  - scored_lodging.json")
        print("  - scored_restaurants.json")
        print("  - scored_attractions.json")


# def main():
    
#     # Create scorer instance
#     scorer = PlaceScorer(google_api_key, gemini_api_key)
    
#     # Score all places
#     print("Starting place scoring process...")
#     print("This may take several minutes due to API rate limits.\n")
    
#     try:
#         results = scorer.score_all_places()
        
#         # Save results
#         scorer.save_results(results)
        
#         # Print summary
#         print("\n=== SCORING SUMMARY ===")
        
#         print("\nTop 5 Lodging Options:")
#         for i, place in enumerate(results['lodging'][:5]):
#             print(f"{i+1}. {place['name']} - Score: {place['score']}/100")
#             print(f"   {place['reasoning']}\n")
        
#         print("\nTop 5 Restaurants:")
#         for i, place in enumerate(results['restaurants'][:5]):
#             print(f"{i+1}. {place['name']} - Score: {place['score']}/100")
#             print(f"   {place['reasoning']}\n")
        
#         print("\nTop 5 Attractions:")
#         for i, place in enumerate(results['attractions'][:5]):
#             print(f"{i+1}. {place['name']} - Score: {place['score']}/100")
#             print(f"   {place['reasoning']}\n")
            
#     except KeyboardInterrupt:
#         print("\n\nProcess interrupted by user. Partial results may have been saved.")
#     except Exception as e:
#         print(f"\n\nError during scoring process: {str(e)}")
#         print("Partial results may have been saved.")


# if __name__ == "__main__":
#     main()