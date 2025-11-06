import json
import os
from datetime import datetime, timedelta
import google.generativeai as genai
from typing import Dict, List, Any

class TripItineraryGenerator:
    def __init__(self, api_key: str):
        """Initialize the generator with Gemini API key."""
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
    def load_json_file(self, filepath: str) -> Dict[str, Any]:
        """Load a JSON file and return its contents."""
        with open(filepath, 'r') as f:
            return json.load(f)
    
    def prepare_context(self, trip_details: Dict, attractions: List[Dict], 
                       restaurants: List[Dict], lodging: List[Dict]) -> str:
        """Prepare context for Gemini API."""
        # Extract key trip information
        start_date = trip_details['dates_of_travel']['start_date']
        end_date = trip_details['dates_of_travel']['end_date']
        
        # Calculate number of days
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
        num_days = (end - start).days + 1
        
        context = f"""
        Create a {num_days}-day itinerary for a trip to {trip_details['destination']} from {start_date} to {end_date}.
        
        Trip Details:
        - Number of travelers: {trip_details['number_of_travelers']}
        - Age group: {trip_details['age_group_of_travelers']}
        - Trip type: {trip_details['trip_type']}
        - Budget: {trip_details['budget']}
        - Interests: {', '.join(trip_details['interests'])}
        - Trip pace: {trip_details['how_packed_trip']}
        - Accessibility needs: {trip_details['accessibility_needs']}
        - Dietary needs: {trip_details['dietary_needs']}
        - Ok with walking: {trip_details['ok_with_walking']}
        
        Available Options (sorted by score, highest first):
        
        LODGING OPTIONS:
        {json.dumps([{'name': l['name'], 'score': l['score'], 'address': l['address'], 'reasoning': l['reasoning']} 
                     for l in lodging[:10]], indent=2)}
        
        ATTRACTIONS:
        {json.dumps([{'name': a['name'], 'score': a['score'], 'address': a['address'], 'reasoning': a['reasoning']} 
                     for a in attractions], indent=2)}
        
        RESTAURANTS:
        {json.dumps([{'name': r['name'], 'score': r['score'], 'address': r['address'], 'reasoning': r['reasoning']} 
                     for r in restaurants[:20]], indent=2)}
        
        Instructions:
        1. Select ONE lodging option for the entire stay (consider accessibility and location)
        2. Create a day-by-day itinerary with specific times
        3. Include  attractions per day based on the pace
        4. Include breakfast, lunch, and dinner restaurants each day
        5. Consider travel time between locations and accessibility needs
        6. Prioritize higher-scored options but also consider logical routing
        7. Ensure all selections respect dietary needs (vegetarian) and accessibility requirements
        
        Return ONLY a JSON object in this exact format:
        {{
            "lodging": {{
                "name": "Hotel Name",
                "address": "Hotel Address",
                "check_in_date": "{start_date}",
                "check_out_date": "{end_date}"
            }},
            "itinerary": [
                {{
                    "day": 1,
                    "date": "{start_date}",
                    "activities": [
                        {{
                            "time": "9:00 AM",
                            "type": "breakfast",
                            "name": "Restaurant Name",
                            "address": "Restaurant Address",
                            "duration": "1 hour"
                        }},
                        {{
                            "time": "10:30 AM",
                            "type": "attraction",
                            "name": "Attraction Name",
                            "address": "Attraction Address",
                            "duration": "2 hours"
                        }}
                    ]
                }}
            ]
        }}
        """
        
        return context
    
    def generate_itinerary(self, trip_details: Dict, attractions: Dict, 
                          restaurants: Dict, lodging: Dict) -> Dict[str, Any]:
        """Generate itinerary using Gemini API."""
        # Sort by scores (highest first)
        sorted_attractions = sorted(attractions['attractions'], 
                                  key=lambda x: x['score'], reverse=True)
        sorted_restaurants = sorted(restaurants['restaurants'], 
                                  key=lambda x: x['score'], reverse=True)
        sorted_lodging = sorted(lodging['lodging'], 
                               key=lambda x: x['score'], reverse=True)
        
        # Prepare context
        context = self.prepare_context(trip_details, sorted_attractions, 
                                     sorted_restaurants, sorted_lodging)
        
        # Generate response
        response = self.model.generate_content(
            context,
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                response_mime_type="application/json"
            )
        )
        
        # Parse and return the JSON response
        try:
            return json.loads(response.text)
        except json.JSONDecodeError:
            # If parsing fails, try to extract JSON from the response
            import re
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                raise ValueError("Failed to parse Gemini response as JSON")
    
    def save_itinerary(self, itinerary: Dict[str, Any], output_path: str):
        """Save the itinerary to a JSON file."""
        with open(output_path, 'w') as f:
            json.dump(itinerary, f, indent=2)
        print(f"Itinerary saved to: {output_path}")
    
    def process_trip_files(self, trip_details_path: str, attractions_path: str,
                          restaurants_path: str, lodging_path: str, 
                          output_path: str = "trip_itinerary.json"):
        """Process all trip files and generate itinerary."""
        # Load all files
        print("Loading trip files...")
        trip_details = self.load_json_file(trip_details_path)
        attractions = self.load_json_file(attractions_path)
        restaurants = self.load_json_file(restaurants_path)
        lodging = self.load_json_file(lodging_path)
        
        # Generate itinerary
        print("Generating itinerary with Gemini API...")
        itinerary = self.generate_itinerary(trip_details, attractions, 
                                          restaurants, lodging)
        
        # Add metadata
        itinerary['metadata'] = {
            'generated_at': datetime.now().isoformat(),
            'trip_destination': trip_details['destination'],
            'trip_dates': trip_details['dates_of_travel'],
            'number_of_travelers': trip_details['number_of_travelers']
        }
        
        # Save itinerary
        self.save_itinerary(itinerary, output_path)
        
        return itinerary


# def main():
#     # Configuration
#     GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'AIzaSyDwbpE5ofjrFINkyKbKtg2Rfm8aBFOhAZ8')
    
#     # File paths - these can be modified for different trips
#     trip_details_path = 'trip_details.json'
#     attractions_path = 'scored_attractions.json'
#     restaurants_path = 'scored_restaurants.json'
#     lodging_path = 'scored_lodging.json'
#     output_path = 'trip_itinerary.json'
    
#     # Create generator
#     generator = TripItineraryGenerator(GEMINI_API_KEY)
    
#     try:
#         # Process files and generate itinerary
#         itinerary = generator.process_trip_files(
#             trip_details_path,
#             attractions_path,
#             restaurants_path,
#             lodging_path,
#             output_path
#         )
        
#         print("\nItinerary generated successfully!")
#         print(f"Total days: {len(itinerary['itinerary'])}")
#         print(f"Lodging: {itinerary['lodging']['name']}")
        
#     except Exception as e:
#         print(f"Error generating itinerary: {e}")
#         raise

# if __name__ == "__main__":
#     main()