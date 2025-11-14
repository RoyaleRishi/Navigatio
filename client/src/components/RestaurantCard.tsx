import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Restaurant } from '../types';
import { Star, MapPin, ExternalLink } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-40">
        <ImageWithFallback
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full shadow-md text-sm">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span>{restaurant.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <CardHeader>
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3>{restaurant.name}</h3>
            <Badge variant="secondary">{restaurant.priceLevel}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{restaurant.cuisine}</Badge>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {restaurant.distance}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground">{restaurant.description}</p>
      </CardContent>

      <CardFooter>
        <Button variant="default" className="w-full" asChild>
          <a href={restaurant.googlePlacesUrl} target="_blank" rel="noopener noreferrer">
            View on Google Maps
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
