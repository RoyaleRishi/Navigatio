import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { MapPin, Calendar, DollarSign, Sparkles } from 'lucide-react';
import { TripPreferences } from '../types';

interface SearchFormProps {
  onSubmit: (preferences: TripPreferences) => void;
}

export function SearchForm({ onSubmit }: SearchFormProps) {
  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [tripType, setTripType] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [locationPreferences, setLocationPreferences] = useState('');

  // Calculate minimum check-out date (day after check-in)
  const getMinCheckOutDate = () => {
    if (!checkIn) return '';
    const checkInDate = new Date(checkIn);
    checkInDate.setDate(checkInDate.getDate() + 1);
    return checkInDate.toISOString().split('T')[0];
  };

  // Set default check-out to day after check-in
  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCheckIn = e.target.value;
    setCheckIn(newCheckIn);
    if (newCheckIn && (!checkOut || checkOut <= newCheckIn)) {
      const checkInDate = new Date(newCheckIn);
      checkInDate.setDate(checkInDate.getDate() + 1);
      setCheckOut(checkInDate.toISOString().split('T')[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (city && checkIn && checkOut && tripType && priceRange) {
      onSubmit({
        city,
        checkIn,
        checkOut,
        tripType,
        priceRange,
        locationPreferences: locationPreferences || undefined,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-full">
              <MapPin className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl">Plan Your Perfect Trip</CardTitle>
          <CardDescription>
            Tell us about your dream vacation and we'll find the perfect hotels, restaurants, and experiences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="city" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Destination City
              </Label>
              <Input
                id="city"
                placeholder="e.g., Paris, Tokyo, New York"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkIn" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Check-In Date
                </Label>
                <Input
                  id="checkIn"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={checkIn}
                  onChange={handleCheckInChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOut" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Check-Out Date
                </Label>
                <Input
                  id="checkOut"
                  type="date"
                  min={getMinCheckOutDate()}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceRange" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Price Range / Budget
              </Label>
              <Input
                id="priceRange"
                placeholder="e.g., Budget, $2000, $500-1000, Luxury, Moderate"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                Enter a specific amount, range, or description (Budget, Moderate, Luxury)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationPreferences" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                City Location Preferences (Optional)
              </Label>
              <Input
                id="locationPreferences"
                placeholder="e.g., Close to airport, Near restaurants, Near tourist sites, Downtown area"
                value={locationPreferences}
                onChange={(e) => setLocationPreferences(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Specify where in the city you'd like to stay
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tripType" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                What kind of trip are you planning?
              </Label>
              <Textarea
                id="tripType"
                placeholder="e.g., Romantic getaway with fine dining, Family adventure with outdoor activities, Solo cultural exploration..."
                value={tripType}
                onChange={(e) => setTripType(e.target.value)}
                rows={4}
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg">
              Find My Perfect Trip
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}