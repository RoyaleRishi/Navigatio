# Project Structure

This document provides an overview of the `src` structure for both the Client and Server components of the Navigatio application.

## Directory Layout

```
Navigatio/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # UI and feature components
│   │   ├── services/       # API integration services
│   │   ├── types.ts        # TypeScript definitions
│   │   ├── App.tsx         # Main application component
│   │   └── main.tsx        # Entry point
│   └── ...
├── server/                 # Backend Flask application
│   ├── middleware/         # Request processing middleware
│   ├── utils/              # Helper functions and integrations
│   ├── app.py              # Main application entry point
│   └── ...
└── README.md               # Main project documentation
```

## Client Structure (`client/src`)

The frontend is built with React, TypeScript, and Vite, using Shadcn UI for components.

*   **`components/`**: Contains all React components.
    *   `ui/`: Reusable UI primitives (Buttons, Cards, Inputs, etc.) from Shadcn UI.
    *   `SearchForm.tsx`: Initial trip preference input form.
    *   `HotelResults.tsx`: Displays search results for hotels with pagination.
    *   `HotelCard.tsx`: Individual hotel display card.
    *   `FinalRecommendations.tsx`: Shows restaurant and activity recommendations based on selected hotel.
    *   `TripOverview.tsx`: Final summary of the planned trip.
*   **`services/`**:
    *   `api.ts`: Centralized API service for communicating with the backend endpoints (Hotels, Restaurants, Activities).
*   **`types.ts`**: Shared TypeScript interfaces for API responses and application state (e.g., `TripPreferences`, `Hotel`, `Restaurant`).
*   **`App.tsx`**: Manages the main application flow and state transitions (Search -> Hotels -> Recommendations -> Overview).

## Server Structure (`server/`)

The backend is a Flask API that handles requests, integrates with external APIs (Google Places, Gemini), and serves data to the frontend.

*   **`app.py`**: The main Flask application file. Defines routes, error handlers, and application configuration.
*   **`middleware/`**:
    *   `auth.py`: Handles API key authentication (if enabled/configured).
*   **`utils/`**:
    *   `places_api.py`: Wrapper for Google Places API interactions (Text Search, Nearby Search).
    *   `gemini_ai.py`: Integration with Google Gemini AI for scoring relevance and generating summaries.
    *   `validators.py`: Helper functions to validate incoming request data (dates, required fields).
*   **`requirements.txt`**: Lists all Python dependencies required to run the server.

