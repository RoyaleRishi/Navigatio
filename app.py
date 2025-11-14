from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from functools import wraps
import os
from dotenv import load_dotenv
from datetime import datetime
import concurrent.futures

from utils.places_api import PlacesAPI
from utils.gemini_ai import GeminiAI
from utils.validators import validate_date_range, validate_request_body
from middleware.auth import require_api_key

load_dotenv()

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

# Configure CORS to allow requests from the frontend
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["100 per minute"],
    storage_uri="memory://"
)

# Initialize services
places_api = PlacesAPI(os.getenv('GOOGLE_PLACES_API_KEY'))
gemini_ai = GeminiAI(os.getenv('GEMINI_API_KEY'))

# Error handlers
@app.errorhandler(400)
def bad_request(error):
    return jsonify({
        "success": False,
        "data": None,
        "error": {
            "code": "INVALID_REQUEST",
            "message": str(error.description) if hasattr(error, 'description') else "Invalid request"
        }
    }), 400

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({
        "success": False,
        "data": None,
        "error": {
            "code": "AUTHENTICATION_FAILED",
            "message": "Invalid or missing API key"
        }
    }), 401

@app.errorhandler(429)
def rate_limit_exceeded(error):
    return jsonify({
        "success": False,
        "data": None,
        "error": {
            "code": "RATE_LIMIT_EXCEEDED",
            "message": "Too many requests. Rate limit: 100 requests per minute."
        }
    }), 429

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "success": False,
        "data": None,
        "error": {
            "code": "INTERNAL_ERROR",
            "message": "An unexpected error occurred"
        }
    }), 500

# Add rate limit headers to all responses
@app.after_request
def add_rate_limit_headers(response):
    # Try to get rate limit info from flask-limiter
    try:
        rate_limit = getattr(request, 'rate_limit', None)
        if rate_limit:
            response.headers['X-RateLimit-Limit'] = str(rate_limit.limit) if hasattr(rate_limit, 'limit') else '100'
            response.headers['X-RateLimit-Remaining'] = str(rate_limit.remaining) if hasattr(rate_limit, 'remaining') else '0'
            if hasattr(rate_limit, 'reset_at') and rate_limit.reset_at:
                response.headers['X-RateLimit-Reset'] = str(int(rate_limit.reset_at.timestamp()))
    except:
        # Fallback values if rate limit info not available
        response.headers['X-RateLimit-Limit'] = '100'
        response.headers['X-RateLimit-Remaining'] = '99'
    return response

# Routes
@app.route('/hotels/search', methods=['POST'])
@require_api_key
@limiter.limit("100 per minute")
def search_hotels():
    """Search for hotels based on location, dates, and preferences."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['city', 'dateRange', 'priceRange']
        validate_request_body(data, required_fields)
        
        # Validate date range
        check_in = data['dateRange']['checkIn']
        check_out = data['dateRange']['checkOut']
        if not validate_date_range(check_in, check_out):
            return jsonify({
                "success": False,
                "data": None,
                "error": {
                    "code": "INVALID_DATE_RANGE",
                    "message": "Check-in date must be before check-out date"
                }
            }), 400
        
        city = data['city']
        price_range = data['priceRange']
        location_prefs = data.get('locationPreferences', '')
        trip_description = data.get('tripDescription', '')
        excluded_hotels = data.get('excludedHotels', [])
        
        # Generate search query using Gemini
        search_query = gemini_ai.generate_hotel_search_query(
            city, check_in, check_out, price_range, location_prefs, trip_description
        )
        
        # Search for hotels using Google Places
        hotels = places_api.search_hotels(
            city, price_range, location_prefs, excluded_hotels
        )
        
        if not hotels:
            return jsonify({
                "success": False,
                "data": None,
                "error": {
                    "code": "NO_RESULTS_FOUND",
                    "message": "No hotels found matching the search criteria"
                }
            }), 404
        
        # Score hotels with AI in parallel
        scored_hotels = gemini_ai.score_hotels_parallel(
            hotels, city, check_in, check_out, price_range, 
            location_prefs, trip_description
        )
        
        # Sort by relevance score (highest first)
        scored_hotels.sort(key=lambda x: x['aiAnalysis']['relevanceScore'], reverse=True)
        
        # Format response
        results = []
        for hotel in scored_hotels:
            hotel_result = {
                "name": hotel['name'],
                "images": hotel.get('images', []),
                "roomPrices": hotel.get('roomPrices', {
                    "available": False,
                    "pricePerNight": None,
                    "totalPrice": None,
                    "currency": "USD"
                }),
                "address": hotel.get('address', ''),
                "reviews": hotel.get('reviews', {
                    "rating": 0,
                    "totalReviews": 0,
                    "snippets": []
                }),
                "aiAnalysis": hotel['aiAnalysis'],
                "placeId": hotel.get('placeId', '')
            }
            results.append(hotel_result)
        
        return jsonify({
            "success": True,
            "data": {
                "query": search_query,
                "results": results,
                "totalResults": len(results)
            },
            "error": None
        })
        
    except ValueError as e:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "INVALID_REQUEST",
                "message": str(e)
            }
        }), 400
    except Exception as e:
        app.logger.error(f"Error in hotel search: {str(e)}")
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "EXTERNAL_SERVICE_ERROR",
                "message": f"Error communicating with external services: {str(e)}"
            }
        }), 500

@app.route('/restaurants/search', methods=['POST'])
@require_api_key
@limiter.limit("100 per minute")
def search_restaurants():
    """Search for restaurants near a specific address."""
    try:
        data = request.get_json()
        
        # Validate required fields
        validate_request_body(data, ['address'])
        
        address = data['address']
        price_range = data.get('priceRange', '')
        eating_preferences = data.get('eatingPreferences', '')
        food_restrictions = data.get('foodRestrictions', [])
        
        # Generate search query using Gemini
        search_query = gemini_ai.generate_restaurant_search_query(
            address, price_range, eating_preferences, food_restrictions
        )
        
        # Search for restaurants using Google Places
        restaurants = places_api.search_restaurants(
            address, price_range, eating_preferences, food_restrictions
        )
        
        if not restaurants:
            return jsonify({
                "success": False,
                "data": None,
                "error": {
                    "code": "NO_RESULTS_FOUND",
                    "message": "No restaurants found matching the search criteria"
                }
            }), 404
        
        # Score restaurants with AI in parallel
        scored_restaurants = gemini_ai.score_restaurants_parallel(
            restaurants, address, price_range, eating_preferences, food_restrictions
        )
        
        # Sort by relevance score (highest first)
        scored_restaurants.sort(key=lambda x: x['aiAnalysis']['relevanceScore'], reverse=True)
        
        # Format response
        results = []
        for restaurant in scored_restaurants:
            restaurant_result = {
                "name": restaurant['name'],
                "images": restaurant.get('images', []),
                "priceLevel": restaurant.get('priceLevel', ''),
                "address": restaurant.get('address', ''),
                "reviews": restaurant.get('reviews', {
                    "rating": 0,
                    "totalReviews": 0,
                    "snippets": []
                }),
                "aiAnalysis": restaurant['aiAnalysis'],
                "placeId": restaurant.get('placeId', ''),
                "distance": restaurant.get('distance', {
                    "meters": 0,
                    "text": "Unknown"
                })
            }
            results.append(restaurant_result)
        
        return jsonify({
            "success": True,
            "data": {
                "query": search_query,
                "referenceAddress": address,
                "results": results,
                "totalResults": len(results)
            },
            "error": None
        })
        
    except ValueError as e:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "INVALID_REQUEST",
                "message": str(e)
            }
        }), 400
    except Exception as e:
        app.logger.error(f"Error in restaurant search: {str(e)}")
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "EXTERNAL_SERVICE_ERROR",
                "message": f"Error communicating with external services: {str(e)}"
            }
        }), 500

@app.route('/activities/search', methods=['POST'])
@require_api_key
@limiter.limit("100 per minute")
def search_activities():
    """Search for activities and attractions near a specific address."""
    try:
        data = request.get_json()
        
        # Validate required fields
        validate_request_body(data, ['address', 'searchPrompt'])
        
        address = data['address']
        price_range = data.get('priceRange', '')
        max_distance = data.get('maxDistance', '')
        search_prompt = data['searchPrompt']
        
        # Generate search query using Gemini
        search_query = gemini_ai.generate_activity_search_query(
            address, price_range, max_distance, search_prompt
        )
        
        # Search for activities using Google Places
        activities = places_api.search_activities(
            address, price_range, max_distance, search_prompt
        )
        
        if not activities:
            return jsonify({
                "success": False,
                "data": None,
                "error": {
                    "code": "NO_RESULTS_FOUND",
                    "message": "No activities found matching the search criteria"
                }
            }), 404
        
        # Score activities with AI in parallel
        scored_activities = gemini_ai.score_activities_parallel(
            activities, address, price_range, max_distance, search_prompt
        )
        
        # Sort by relevance score (highest first)
        scored_activities.sort(key=lambda x: x['aiAnalysis']['relevanceScore'], reverse=True)
        
        # Format response
        results = []
        for activity in scored_activities:
            activity_result = {
                "name": activity['name'],
                "images": activity.get('images', []),
                "priceInfo": activity.get('priceInfo', ''),
                "address": activity.get('address', ''),
                "reviews": activity.get('reviews', {
                    "rating": 0,
                    "totalReviews": 0,
                    "snippets": []
                }),
                "aiAnalysis": activity['aiAnalysis'],
                "placeId": activity.get('placeId', ''),
                "distance": activity.get('distance', {
                    "meters": 0,
                    "text": "Unknown"
                }),
                "activityType": activity.get('activityType', '')
            }
            results.append(activity_result)
        
        return jsonify({
            "success": True,
            "data": {
                "query": search_query,
                "referenceAddress": address,
                "results": results,
                "totalResults": len(results)
            },
            "error": None
        })
        
    except ValueError as e:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "INVALID_REQUEST",
                "message": str(e)
            }
        }), 400
    except Exception as e:
        app.logger.error(f"Error in activity search: {str(e)}")
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "EXTERNAL_SERVICE_ERROR",
                "message": f"Error communicating with external services: {str(e)}"
            }
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "success": True,
        "data": {
            "status": "healthy",
            "timestamp": datetime.now().isoformat()
        },
        "error": None
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)

