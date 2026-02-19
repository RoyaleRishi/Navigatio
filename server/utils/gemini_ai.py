import google.generativeai as genai
from typing import List, Dict, Any
import json
import concurrent.futures
import re

class GeminiAI:
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("Gemini API key is required")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
    def generate_hotel_search_query(self, city: str, check_in: str, check_out: str,
                                   price_range: str, location_prefs: str, trip_description: str) -> str:
        """Generate an optimized search query for hotel search."""
        prompt = f"""Generate a concise, optimal search query string for finding hotels in {city} with these criteria:
- Check-in: {check_in}, Check-out: {check_out}
- Price range: {price_range}
- Location preferences: {location_prefs if location_prefs else 'none'}
- Trip description: {trip_description if trip_description else 'none'}

Return ONLY the search query string, nothing else."""
        
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Error generating hotel search query: {e}")
            return f"hotels in {city}"
    
    def generate_restaurant_search_query(self, address: str, price_range: str,
                                        eating_preferences: str, food_restrictions: List[str]) -> str:
        """Generate an optimized search query for restaurant search."""
        restrictions_text = ', '.join(food_restrictions) if food_restrictions else 'none'
        
        prompt = f"""Generate a concise, optimal search query string for finding restaurants near {address} with these criteria:
- Price range: {price_range if price_range else 'any'}
- Eating preferences: {eating_preferences if eating_preferences else 'none'}
- Food restrictions: {restrictions_text}

Return ONLY the search query string, nothing else."""
        
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Error generating restaurant search query: {e}")
            return f"restaurants near {address}"
    
    def generate_activity_search_query(self, address: str, price_range: str,
                                      max_distance: str, search_prompt: str) -> str:
        """Generate an optimal search query for activity search that includes various establishment types."""
        prompt = f"""Generate a comprehensive, optimal search query string for Google Places API to find activities and attractions near {address} with these criteria:
- Price range: {price_range if price_range else 'any'}
- Max distance: {max_distance if max_distance else 'no limit'}
- User preferences: {search_prompt}

IMPORTANT: The query should include various types of activities and establishments such as:
- Tourist attractions, landmarks, museums, art galleries
- Entertainment venues: movie theatres, concert halls, comedy clubs, arcades, bowling alleys
- Recreation: parks, zoos, aquariums, botanical gardens, sports facilities
- Cultural sites: historical sites, monuments, theaters, opera houses
- Shopping and markets: shopping malls, markets, boutiques
- Other activities: escape rooms, trampoline parks, laser tag, go-kart tracks

The query should be natural language and work well with Google Places text search. Include location context (near {address}) and activity types that match the user's preferences.

Return ONLY the search query string (2-10 words max), nothing else. Example format: "museums parks movie theatres near {address}"
        
Query:"""
        
        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=50
                )
            )
            query = response.text.strip()
            # Clean up the response if it has quotes or extra text
            query = query.strip('"\'')
            if not query or len(query) < 5:
                # Fallback query
                return f"{search_prompt} near {address}"
            return query
        except Exception as e:
            print(f"Error generating activity search query: {e}")
            return f"{search_prompt} attractions activities near {address}"
    
    def score_hotel(self, hotel: Dict[str, Any], city: str, check_in: str, check_out: str,
                   price_range: str, location_prefs: str, trip_description: str) -> Dict[str, Any]:
        """Score a single hotel for relevance (1-10 scale)."""
        prompt = f"""Analyze this hotel and score its relevance (1-10) for this hotel search request.

SEARCH CRITERIA:
- City: {city}
- Check-in: {check_in}, Check-out: {check_out}
- Price range: {price_range}
- Location preferences: {location_prefs if location_prefs else 'none'}
- Trip description: {trip_description if trip_description else 'none'}

HOTEL INFORMATION:
Name: {hotel.get('name', 'Unknown')}
Address: {hotel.get('address', 'Unknown')}
Rating: {hotel.get('reviews', {}).get('rating', 'N/A')}
Total Reviews: {hotel.get('reviews', {}).get('totalReviews', 0)}
Review Snippets: {', '.join(hotel.get('reviews', {}).get('snippets', [])[:2])}

Return ONLY a JSON object in this exact format:
{{
  "relevanceScore": <number 1-10>,
  "summary": "<brief explanation of why this hotel matches the request, max 200 characters>"
}}

Scoring guidelines:
- 1-3: Poor match (doesn't meet key criteria)
- 4-6: Moderate match (meets some criteria)
- 7-8: Good match (meets most criteria well)
- 9-10: Excellent match (perfectly matches all criteria)"""
        
        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.3,
                    response_mime_type="application/json"
                )
            )
            
            result_text = response.text.strip()
            # Extract JSON if wrapped in markdown
            if result_text.startswith('```json'):
                result_text = result_text[7:-3]
            elif result_text.startswith('```'):
                result_text = result_text[3:-3]
            
            score_data = json.loads(result_text)
            
            hotel['aiAnalysis'] = {
                'relevanceScore': int(score_data.get('relevanceScore', 5)),
                'summary': score_data.get('summary', 'No analysis available')
            }
            
        except Exception as e:
            print(f"Error scoring hotel {hotel.get('name')}: {e}")
            hotel['aiAnalysis'] = {
                'relevanceScore': 5,
                'summary': 'Unable to analyze hotel'
            }
        
        return hotel
    
    def score_hotels_parallel(self, hotels: List[Dict[str, Any]], city: str, check_in: str,
                            check_out: str, price_range: str, location_prefs: str,
                            trip_description: str) -> List[Dict[str, Any]]:
        """Score multiple hotels in parallel."""
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [
                executor.submit(self.score_hotel, hotel, city, check_in, check_out,
                              price_range, location_prefs, trip_description)
                for hotel in hotels
            ]
            
            scored_hotels = []
            for future in concurrent.futures.as_completed(futures):
                try:
                    scored_hotels.append(future.result())
                except Exception as e:
                    print(f"Error in parallel hotel scoring: {e}")
        
        return scored_hotels
    
    def score_restaurant(self, restaurant: Dict[str, Any], address: str, price_range: str,
                        eating_preferences: str, food_restrictions: List[str]) -> Dict[str, Any]:
        """Score a single restaurant for relevance (1-10 scale)."""
        restrictions_text = ', '.join(food_restrictions) if food_restrictions else 'none'
        
        prompt = f"""Analyze this restaurant and score its relevance (1-10) for this restaurant search request.

SEARCH CRITERIA:
- Reference address: {address}
- Price range: {price_range if price_range else 'any'}
- Eating preferences: {eating_preferences if eating_preferences else 'none'}
- Food restrictions: {restrictions_text}

RESTAURANT INFORMATION:
Name: {restaurant.get('name', 'Unknown')}
Address: {restaurant.get('address', 'Unknown')}
Price Level: {restaurant.get('priceLevel', 'N/A')}
Rating: {restaurant.get('reviews', {}).get('rating', 'N/A')}
Total Reviews: {restaurant.get('reviews', {}).get('totalReviews', 0)}
Distance: {restaurant.get('distance', {}).get('text', 'Unknown')}
Review Snippets: {', '.join(restaurant.get('reviews', {}).get('snippets', [])[:2])}

Return ONLY a JSON object in this exact format:
{{
  "relevanceScore": <number 1-10>,
  "summary": "<brief explanation of why this restaurant matches the request, max 200 characters>"
}}

Scoring guidelines:
- 1-3: Poor match (doesn't meet key criteria)
- 4-6: Moderate match (meets some criteria)
- 7-8: Good match (meets most criteria well)
- 9-10: Excellent match (perfectly matches all criteria)"""
        
        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.3,
                    response_mime_type="application/json"
                )
            )
            
            result_text = response.text.strip()
            if result_text.startswith('```json'):
                result_text = result_text[7:-3]
            elif result_text.startswith('```'):
                result_text = result_text[3:-3]
            
            score_data = json.loads(result_text)
            
            restaurant['aiAnalysis'] = {
                'relevanceScore': int(score_data.get('relevanceScore', 5)),
                'summary': score_data.get('summary', 'No analysis available')
            }
            
        except Exception as e:
            print(f"Error scoring restaurant {restaurant.get('name')}: {e}")
            restaurant['aiAnalysis'] = {
                'relevanceScore': 5,
                'summary': 'Unable to analyze restaurant'
            }
        
        return restaurant
    
    def score_restaurants_parallel(self, restaurants: List[Dict[str, Any]], address: str,
                                  price_range: str, eating_preferences: str,
                                  food_restrictions: List[str]) -> List[Dict[str, Any]]:
        """Score multiple restaurants in parallel."""
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [
                executor.submit(self.score_restaurant, restaurant, address, price_range,
                              eating_preferences, food_restrictions)
                for restaurant in restaurants
            ]
            
            scored_restaurants = []
            for future in concurrent.futures.as_completed(futures):
                try:
                    scored_restaurants.append(future.result())
                except Exception as e:
                    print(f"Error in parallel restaurant scoring: {e}")
        
        return scored_restaurants
    
    def score_activity(self, activity: Dict[str, Any], address: str, price_range: str,
                      max_distance: str, search_prompt: str) -> Dict[str, Any]:
        """Score a single activity for relevance (1-10 scale)."""
        prompt = f"""Analyze this activity/attraction and score its relevance (1-10) for this activity search request.

SEARCH CRITERIA:
- Reference address: {address}
- Price range: {price_range if price_range else 'any'}
- Max distance: {max_distance if max_distance else 'no limit'}
- Search description: {search_prompt}

ACTIVITY INFORMATION:
Name: {activity.get('name', 'Unknown')}
Address: {activity.get('address', 'Unknown')}
Type: {activity.get('activityType', 'attraction')}
Rating: {activity.get('reviews', {}).get('rating', 'N/A')}
Total Reviews: {activity.get('reviews', {}).get('totalReviews', 0)}
Distance: {activity.get('distance', {}).get('text', 'Unknown')}
Review Snippets: {', '.join(activity.get('reviews', {}).get('snippets', [])[:2])}

Return ONLY a JSON object in this exact format:
{{
  "relevanceScore": <number 1-10>,
  "summary": "<brief explanation of why this activity matches the request, max 200 characters>"
}}

Scoring guidelines:
- 1-3: Poor match (doesn't meet key criteria)
- 4-6: Moderate match (meets some criteria)
- 7-8: Good match (meets most criteria well)
- 9-10: Excellent match (perfectly matches all criteria)"""
        
        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.3,
                    response_mime_type="application/json"
                )
            )
            
            result_text = response.text.strip()
            if result_text.startswith('```json'):
                result_text = result_text[7:-3]
            elif result_text.startswith('```'):
                result_text = result_text[3:-3]
            
            score_data = json.loads(result_text)
            
            activity['aiAnalysis'] = {
                'relevanceScore': int(score_data.get('relevanceScore', 5)),
                'summary': score_data.get('summary', 'No analysis available')
            }
            
        except Exception as e:
            print(f"Error scoring activity {activity.get('name')}: {e}")
            activity['aiAnalysis'] = {
                'relevanceScore': 5,
                'summary': 'Unable to analyze activity'
            }
        
        return activity
    
    def score_activities_parallel(self, activities: List[Dict[str, Any]], address: str,
                                 price_range: str, max_distance: str,
                                 search_prompt: str) -> List[Dict[str, Any]]:
        """Score multiple activities in parallel."""
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [
                executor.submit(self.score_activity, activity, address, price_range,
                              max_distance, search_prompt)
                for activity in activities
            ]
            
            scored_activities = []
            for future in concurrent.futures.as_completed(futures):
                try:
                    scored_activities.append(future.result())
                except Exception as e:
                    print(f"Error in parallel activity scoring: {e}")
        
        return scored_activities

