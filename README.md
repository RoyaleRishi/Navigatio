# Navigatio

Navigatio is an AI-powered travel assistant that helps users find hotels, restaurants, and activities based on their preferences. This project consists of a Python Flask backend and a React/Vite frontend.

## Installation

### Server

1.  Navigate to the server directory:
    ```bash
    cd server
    ```

2.  Install the required Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```

3.  **Environment Configuration**:
    Create a `.env` file in the `server/` directory with the following variables:
    ```env
    GOOGLE_PLACES_API_KEY=your_google_places_api_key
    GEMINI_API_KEY=your_gemini_api_key
    ```

### Client

1.  Navigate to the client directory:
    ```bash
    cd client
    ```

2.  Install the required Node.js packages:
    ```bash
    npm install
    ```

3.  **Environment Configuration**:
    Ensure the client is configured to point to your local server (default is usually `http://localhost:5000`). Check `vite.config.ts` or `.env` if applicable, but usually defaults work for development.

## Running the Application

### Server

1.  Make sure you are in the `server` directory and your virtual environment is activated (if using one).
2.  Run the Flask application:
    ```bash
    python app.py
    ```
    The server will start on `http://localhost:5000`.

### Client

1.  Make sure you are in the `client` directory.
2.  Start the development server:
    ```bash
    npm run dev
    ```
    The application will be available at the URL shown in the terminal (typically `http://localhost:5173`).

## Features Supported

*   **Hotel Search**: Find hotels based on location and date.
*   **Restaurant Search**: Find dining options near your stay.
*   **Activity Search**: Discover things to do in the area.
*   **AI Powered Scoring**: Results are analyzed and scored for relevance.

## Notes

*   **Hotel Prices**: Exact room prices may not always be available for the specified dates due to API limitations.
*   **Restaurant Pricing**: Price levels are indicated using Google's standard notation (e.g., $, $$, $$$).
*   **Performance**: AI analysis is run in parallel to optimize speed, but **response times usually take 1-2 minutes to appear** due to the depth of processing.
*   **API Documentation**: For detailed API endpoint information, please refer to `server/api.md`.
