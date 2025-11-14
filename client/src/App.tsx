import { useState } from 'react';
import { SearchForm } from './components/SearchForm';
import { HotelResults } from './components/HotelResults';
import { FinalRecommendations } from './components/FinalRecommendations';
import { TripOverview } from './components/TripOverview';
import { Hotel, Restaurant, Activity, TripPreferences } from './types';

type AppState = 'search' | 'hotels' | 'recommendations' | 'overview';

export default function App() {
  const [appState, setAppState] = useState<AppState>('search');
  const [tripPreferences, setTripPreferences] = useState<TripPreferences | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [savedRestaurants, setSavedRestaurants] = useState<Restaurant[]>([]);
  const [savedActivities, setSavedActivities] = useState<Activity[]>([]);

  const handleSearchSubmit = (preferences: TripPreferences) => {
    setTripPreferences(preferences);
    setAppState('hotels');
  };

  const handleHotelSelect = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setAppState('recommendations');
  };

  const handleSaveTrip = (restaurants: Restaurant[], activities: Activity[]) => {
    setSavedRestaurants(restaurants);
    setSavedActivities(activities);
    setAppState('overview');
  };

  const handleBackToSearch = () => {
    setAppState('search');
    setTripPreferences(null);
    setSelectedHotel(null);
    setSavedRestaurants([]);
    setSavedActivities([]);
  };

  const handleBackToHotels = () => {
    setAppState('hotels');
    setSelectedHotel(null);
  };

  const handleBackToRecommendations = () => {
    setAppState('recommendations');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {appState === 'search' && (
        <SearchForm onSubmit={handleSearchSubmit} />
      )}
      {appState === 'hotels' && tripPreferences && (
        <HotelResults
          preferences={tripPreferences}
          onHotelSelect={handleHotelSelect}
          onBack={handleBackToSearch}
        />
      )}
      {appState === 'recommendations' && tripPreferences && selectedHotel && (
        <FinalRecommendations
          preferences={tripPreferences}
          hotel={selectedHotel}
          onBack={handleBackToHotels}
          onSaveTrip={handleSaveTrip}
        />
      )}
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