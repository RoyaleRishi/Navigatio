# Trip Planner App - Client

This is the React frontend client for the Navigatio Hotels API.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the client directory with your API configuration:
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_API_KEY=your_api_key_here
```

**Note:** The API key is optional for development. If your Flask backend doesn't require authentication, you can leave it empty or remove it.

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Features

- **Search Form**: Input city, check-in/check-out dates, price range, location preferences, and trip description
- **Hotel Results**: Displays hotels from the API with:
  - Multiple images (with image carousel navigation)
  - AI analysis with relevance score (1-10)
  - Price information (total price and per night)
  - Address/location
  - Ratings and reviews
  - Review snippets

## API Integration

The client makes a POST request to `/hotels/search` with the following format:

```typescript
{
  city: string;
  dateRange: {
    checkIn: string; // YYYY-MM-DD
    checkOut: string; // YYYY-MM-DD
  };
  priceRange: string;
  locationPreferences?: string;
  tripDescription?: string;
  excludedHotels?: string[];
}
```

## Environment Variables

- `VITE_API_BASE_URL`: Base URL of the Flask API (default: `http://localhost:5000`)
- `VITE_API_KEY`: API key for authentication (optional for development)

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.
