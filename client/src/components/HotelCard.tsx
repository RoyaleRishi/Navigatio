import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Hotel } from '../types';
import { Star, MapPin, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface HotelCardProps {
  hotel: Hotel;
  isExpanded: boolean;
  onViewDetails: () => void;
  onSelect: () => void;
}

export function HotelCard({ hotel, isExpanded, onViewDetails, onSelect }: HotelCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow">
      <div className="relative h-48">
        <ImageWithFallback
          src={hotel.image}
          alt={hotel.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-lg">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{hotel.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <CardHeader>
        <div className="space-y-2">
          <h3 className="text-xl">{hotel.name}</h3>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{hotel.location}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-muted-foreground mb-4">{hotel.description}</p>
        
        {isExpanded && (
          <div className="space-y-3 border-t pt-4">
            <div>
              <p className="mb-2">Amenities:</p>
              <div className="flex flex-wrap gap-2">
                {hotel.amenities.map((amenity) => (
                  <Badge key={amenity} variant="secondary">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-2xl">${hotel.price}</span>
          <span className="text-muted-foreground">total</span>
          <span className="text-sm text-muted-foreground ml-auto">
            ${hotel.pricePerNight}/night
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <div className="flex gap-2 w-full">
          <Button onClick={onViewDetails} variant="outline" className="flex-1">
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                View Details
              </>
            )}
          </Button>
          <Button onClick={onSelect} className="flex-1">
            Select This Hotel
          </Button>
        </div>
        <Button variant="link" className="w-full" asChild>
          <a href={hotel.bookingUrl} target="_blank" rel="noopener noreferrer">
            View on Booking.com
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
