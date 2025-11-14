import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { HotelCard } from './HotelCard';
import { Hotel, TripPreferences } from '../types';
import { generateHotels } from '../data/mockData';
import { ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';

interface HotelResultsProps {
  preferences: TripPreferences;
  onHotelSelect: (hotel: Hotel) => void;
  onBack: () => void;
}

export function HotelResults({ preferences, onHotelSelect, onBack }: HotelResultsProps) {
  const [hotels, setHotels] = useState<Hotel[]>(() => generateHotels(preferences));
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);

  const handleRetry = () => {
    setHotels(generateHotels(preferences));
    setSelectedHotelId(null);
  };

  const handleViewDetails = (hotelId: string) => {
    setSelectedHotelId(selectedHotelId === hotelId ? null : hotelId);
  };

  const handleSelectHotel = (hotel: Hotel) => {
    onHotelSelect(hotel);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Button>
          
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl mb-2">
                    Hotels in {preferences.city}
                  </CardTitle>
                  <CardDescription>
                    {preferences.duration} nights • {preferences.tripType}
                    {preferences.locationPreferences && (
                      <> • {preferences.locationPreferences}</>
                    )}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-sm px-4 py-2">
                  {preferences.priceRange}
                </Badge>
              </div>
            </CardHeader>
            <CardFooter>
              <Button onClick={handleRetry} variant="outline" className="w-full sm:w-auto">
                <RefreshCw className="w-4 h-4 mr-2" />
                Show Different Hotels
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {hotels.map((hotel) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              isExpanded={selectedHotelId === hotel.id}
              onViewDetails={() => handleViewDetails(hotel.id)}
              onSelect={() => handleSelectHotel(hotel)}
            />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
            <CardContent className="pt-6">
              <Sparkles className="w-8 h-8 mx-auto mb-2" />
              <p>
                Choose a hotel to continue to restaurant and activity recommendations
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}