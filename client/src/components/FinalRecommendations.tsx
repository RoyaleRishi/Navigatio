import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { RestaurantCard } from './RestaurantCard';
import { ActivityCard } from './ActivityCard';
import { Hotel, Restaurant, Activity, TripPreferences } from '../types';
import { generateRestaurants, generateActivities } from '../data/mockData';
import { generateRestaurantsWithPreferences } from '../data/restaurantMockData';
import { ArrowLeft, RefreshCw, Hotel as HotelIcon, UtensilsCrossed, MapPin, Save } from 'lucide-react';

interface FinalRecommendationsProps {
  preferences: TripPreferences;
  hotel: Hotel;
  onBack: () => void;
  onSaveTrip: (restaurants: Restaurant[], activities: Activity[]) => void;
}

export function FinalRecommendations({ preferences, hotel, onBack, onSaveTrip }: FinalRecommendationsProps) {
  const [restaurantPreferences, setRestaurantPreferences] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const handleSubmit = () => {
    const generatedRestaurants = dietaryPreferences 
      ? generateRestaurantsWithPreferences(preferences.city, hotel.location, dietaryPreferences)
      : generateRestaurants(preferences, hotel.location);
    
    setRestaurants(generatedRestaurants);
    setActivities(generateActivities(preferences, hotel.location));
    setHasSubmitted(true);
  };

  const handleRegenerate = () => {
    const generatedRestaurants = dietaryPreferences 
      ? generateRestaurantsWithPreferences(preferences.city, hotel.location, dietaryPreferences)
      : generateRestaurants(preferences, hotel.location);
    
    setRestaurants(generatedRestaurants);
    setActivities(generateActivities(preferences, hotel.location));
  };

  const handleSaveTrip = () => {
    onSaveTrip(restaurants, activities);
  };

  if (!hasSubmitted) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hotels
          </Button>

          <Card className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <HotelIcon className="w-6 h-6 text-green-600" />
                <CardTitle>Hotel Selected!</CardTitle>
              </div>
              <CardDescription>
                You've chosen {hotel.name} in {hotel.location}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customize Your Experience</CardTitle>
              <CardDescription>
                Tell us about your dining preferences and what activities you'd like to do
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preferences">
                  What type of restaurants and experiences are you looking for?
                </Label>
                <Textarea
                  id="preferences"
                  placeholder="e.g., Romantic fine dining restaurants, local authentic food spots, outdoor activities, cultural experiences, nightlife..."
                  value={restaurantPreferences}
                  onChange={(e) => setRestaurantPreferences(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dietary">
                  Dietary Restrictions & Restaurant Preferences (Optional)
                </Label>
                <Textarea
                  id="dietary"
                  placeholder="e.g., Vegan, Gluten-free, Halal, Kosher, Clean places, Near the hotel, Casual dining, Quick service..."
                  value={dietaryPreferences}
                  onChange={(e) => setDietaryPreferences(e.target.value)}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Specify any dietary needs or preferences for restaurant selection
                </p>
              </div>
              <Button onClick={handleSubmit} className="w-full" size="lg">
                Get Recommendations
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hotels
          </Button>

          <Card className="bg-white/80 backdrop-blur mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl mb-2">
                    Your {preferences.city} Itinerary
                  </CardTitle>
                  <CardDescription>
                    Staying at {hotel.name} • {preferences.duration} nights
                  </CardDescription>
                </div>
                <Button onClick={handleRegenerate} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate All
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Restaurants Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-lg">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl">Recommended Restaurants</h2>
              <p className="text-muted-foreground">
                Carefully selected based on your preferences
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </div>

        {/* Activities Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-lg">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl">Things to Do</h2>
              <p className="text-muted-foreground">
                Popular activities near {hotel.name}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </div>

        {/* Save Trip Button */}
        <div className="mt-12">
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <Save className="w-12 h-12" />
                <div>
                  <h3 className="text-xl mb-2">Ready to finalize your trip?</h3>
                  <p className="text-white/90">
                    Save your itinerary to view a complete overview of your {preferences.city} adventure
                  </p>
                </div>
                <Button
                  onClick={handleSaveTrip}
                  size="lg"
                  className="bg-white text-green-600 hover:bg-white/90"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save Trip & View Overview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}