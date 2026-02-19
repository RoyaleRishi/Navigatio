import { useState } from 'react';
import { SearchForm } from './components/SearchForm';
import { HotelResults } from './components/HotelResults';
import { FinalRecommendations } from './components/FinalRecommendations';
import { TripOverview } from './components/TripOverview';
import { Hotel, Restaurant, Activity, TripPreferences } from './types';

// Define the possible states of the application flow
type AppState = 'search' | 'hotels' | 'recommendations' | 'overview';

/**
 * Main Application Component
 * Manages the overall state of the trip planning flow.
 */
export default function App() {
  // State to track the current step in the application flow
  const [appState, setAppState] = useState<AppState>('search');
  
  // State to store user's trip preferences (destination, dates, travelers)
  const [tripPreferences, setTripPreferences] = useState<TripPreferences | null>(null);
  
  // State to store the hotel selected by the user
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  
  // State to store saved restaurants and activities for the final itinerary
  const [savedRestaurants, setSavedRestaurants] = useState<Restaurant[]>([]);
  const [savedActivities, setSavedActivities] = useState<Activity[]>([]);

  // Handler for when the search form is submitted
  const handleSearchSubmit = (preferences: TripPreferences) => {
    setTripPreferences(preferences);
    setAppState('hotels'); // Move to hotel selection step
  };

  // Handler for when a hotel is selected
  const handleHotelSelect = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setAppState('recommendations'); // Move to recommendations step
  };

  // Handler for saving the final trip itinerary
  const handleSaveTrip = (restaurants: Restaurant[], activities: Activity[]) => {
    setSavedRestaurants(restaurants);
    setSavedActivities(activities);
    setAppState('overview'); // Move to final overview step
  };

  // Reset everything to start a new search
  const handleBackToSearch = () => {
    setAppState('search');
    setTripPreferences(null);
    setSelectedHotel(null);
    setSavedRestaurants([]);
    setSavedActivities([]);
  };

  // Go back to hotel selection (clear selected hotel)
  const handleBackToHotels = () => {
    setAppState('hotels');
    setSelectedHotel(null);
  };

  // Go back to recommendations (from overview)
  const handleBackToRecommendations = () => {
    setAppState('recommendations');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Step 1: Search Form */}
      {appState === 'search' && (
        <SearchForm onSubmit={handleSearchSubmit} />
      )}
      
      {/* Step 2: Hotel Selection */}
      {appState === 'hotels' && tripPreferences && (
        <HotelResults
          preferences={tripPreferences}
          onHotelSelect={handleHotelSelect}
          onBack={handleBackToSearch}
        />
      )}
      
      {/* Step 3: Recommendations (Restaurants & Activities) */}
      {appState === 'recommendations' && tripPreferences && selectedHotel && (
        <FinalRecommendations
          preferences={tripPreferences}
          hotel={selectedHotel}
          onBack={handleBackToHotels}
          onSaveTrip={handleSaveTrip}
        />
      )}
      
      {/* Step 4: Trip Overview */}
      {appState === 'overview' && tripPreferences && selectedHotel && (
        <TripOverview
          preferences={tripPreferences}
          hotel={selectedHotel}
          restaurants={savedRestaurants}
          activities={savedActivities}
          onBack={handleBackToRecommendations}
          onStartNew={handleBackToSearch}
        />
      )}
    </div>
  );
}