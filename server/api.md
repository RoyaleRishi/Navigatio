# Navigatio - API Documentation

## Base URL
`http://localhost:5000` (development)
`https://api.yourservice.com/v1` (production)

## Authentication

All API requests require authentication using an API key passed in the header:

```
Authorization: Bearer YOUR_API_KEY
```

## Common Response Format

All endpoints return responses in the following format:

```json
{
  "success": boolean,
  "data": object | array,
  "error": {
    "code": string,
    "message": string
  } | null
}
```

## Endpoints

### 1. Hotel Search

**Endpoint:** `POST /hotels/search`

**Description:** Search for hotels based on location, dates, price range, and preferences. Results are scored by AI for relevance to your trip description.

#### Request Body

```json
{
  "city": "string (required)",
  "dateRange": {
    "checkIn": "string (required, ISO 8601 date format: YYYY-MM-DD)",
    "checkOut": "string (required, ISO 8601 date format: YYYY-MM-DD)"
  },
  "priceRange": "string (required, examples: '$50-150', 'budget', 'luxury', '$$')",
  "locationPreferences": "string (optional, examples: 'downtown', 'near beach', 'quiet neighborhood')",
  "tripDescription": "string (optional, description of trip purpose and preferences)",
  "excludedHotels": ["string"] (optional, array of hotel names to exclude)
}
```

#### Example Request

```bash
curl -X POST http://localhost:5000/hotels/search \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "city": "San Francisco",
    "dateRange": {
      "checkIn": "2025-12-15",
      "checkOut": "2025-12-18"
    },
    "priceRange": "$100-200 per night",
    "locationPreferences": "near Fisherman'\''s Wharf",
    "tripDescription": "Family vacation with two kids, looking for hotels with pools and nearby attractions"
  }'
```

#### Response

```json
{
  "success": true,
  "data": {
    "query": "string (the generated search query used)",
    "results": [
      {
        "name": "string",
        "images": ["string (URL)", "string (URL)"],
        "roomPrices": {
          "available": boolean,
          "pricePerNight": number | null,
          "totalPrice": number | null,
          "currency": "string (ISO 4217 code, e.g., 'USD')"
        },
        "address": "string",
        "reviews": {
          "rating": number,
          "totalReviews": number,
          "snippets": ["string"]
        },
        "aiAnalysis": {
          "relevanceScore": number (1-10),
          "summary": "string (explanation of why this hotel matches the request)"
        },
        "placeId": "string (Google Places ID for reference)"
      }
    ],
    "totalResults": number
  },
  "error": null
}
```

### 2. Restaurant Search

**Endpoint:** `POST /restaurants/search`

**Description:** Search for restaurants near a specific address based on price range, eating preferences, and dietary restrictions. Results are scored by AI for relevance.

#### Request Body

```json
{
  "address": "string (required, reference address for search)",
  "priceRange": "string (optional, examples: '$', '$$', '$$$', 'budget', 'moderate', 'fine dining')",
  "eatingPreferences": "string (optional, cuisine types, ambiance, etc.)",
  "foodRestrictions": ["string"] (optional, array of dietary restrictions like 'vegan', 'gluten-free', 'nut allergy')
}
```

#### Example Request

```bash
curl -X POST http://localhost:5000/restaurants/search \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "350 Fifth Avenue, New York, NY 10118",
    "priceRange": "$$-$$$",
    "eatingPreferences": "Italian or French cuisine, romantic atmosphere",
    "foodRestrictions": ["vegetarian options required", "no shellfish"]
  }'
```

#### Response

```json
{
  "success": true,
  "data": {
    "query": "string (the generated search query used)",
    "referenceAddress": "string",
    "results": [
      {
        "name": "string",
        "images": ["string (URL)", "string (URL)"],
        "priceLevel": "string (from Google Places: '$', '$$', '$$$', or '$$$$')",
        "address": "string",
        "reviews": {
          "rating": number,
          "totalReviews": number,
          "snippets": ["string"]
        },
        "aiAnalysis": {
          "relevanceScore": number (1-10),
          "summary": "string (explanation of why this restaurant matches the request)"
        },
        "placeId": "string (Google Places ID for reference)",
        "distance": {
          "meters": number,
          "text": "string (human-readable distance)"
        }
      }
    ],
    "totalResults": number
  },
  "error": null
}
```

### 3. Activity Search

**Endpoint:** `POST /activities/search`

**Description:** Search for activities and attractions near a specific address based on preferences, price range, and travel distance. Results are scored by AI for relevance.

#### Request Body

```json
{
  "address": "string (required, central reference address)",
  "priceRange": "string (optional, examples: 'free', '$20-50', 'budget', 'any')",
  "maxDistance": "string (optional, examples: '5 miles', '2km', 'walking distance')",
  "searchPrompt": "string (required, description of desired activities)"
}
```

#### Example Request

```bash
curl -X POST http://localhost:5000/activities/search \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "1600 Amphitheatre Parkway, Mountain View, CA",
    "priceRange": "free to $30",
    "maxDistance": "10 miles",
    "searchPrompt": "Outdoor activities for families with young children, prefer parks and interactive museums"
  }'
```

#### Response

```json
{
  "success": true,
  "data": {
    "query": "string (the generated search query used)",
    "referenceAddress": "string",
    "results": [
      {
        "name": "string",
        "images": ["string (URL)", "string (URL)"],
        "priceInfo": "string (price information if available)",
        "address": "string",
        "reviews": {
          "rating": number,
          "totalReviews": number,
          "snippets": ["string"]
        },
        "aiAnalysis": {
          "relevanceScore": number (1-10),
          "summary": "string (explanation of why this activity matches the request)"
        },
        "placeId": "string (Google Places ID for reference)",
        "distance": {
          "meters": number,
          "text": "string (human-readable distance)"
        },
        "activityType": "string (category of activity)"
      }
    ],
    "totalResults": number
  },
  "error": null
}
```

### 4. Health Check

**Endpoint:** `GET /health`

**Description:** Check API health status.

#### Response

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-01T12:00:00"
  },
  "error": null
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Missing or invalid required parameters |
| `INVALID_DATE_RANGE` | Check-in date must be before check-out date |
| `AUTHENTICATION_FAILED` | Invalid or missing API key |
| `RATE_LIMIT_EXCEEDED` | Too many requests in a given time period |
| `EXTERNAL_SERVICE_ERROR` | Error communicating with Google Places or Gemini API |
| `NO_RESULTS_FOUND` | No results matched the search criteria |
| `INTERNAL_ERROR` | Unexpected server error |

