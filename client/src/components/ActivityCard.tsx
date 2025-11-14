import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Activity } from '../types';
import { Star, Clock, DollarSign, ExternalLink } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ActivityCardProps {
  activity: Activity;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-40">
        <ImageWithFallback
          src={activity.image}
          alt={activity.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <Badge className="bg-white text-black hover:bg-white">
            {activity.category}
          </Badge>
        </div>
        <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full shadow-md text-sm">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span>{activity.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <CardHeader>
        <h3>{activity.name}</h3>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{activity.description}</p>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            {activity.duration}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            {activity.price}
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button variant="default" className="w-full" asChild>
          <a href={activity.bookingUrl} target="_blank" rel="noopener noreferrer">
            Book Activity
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
