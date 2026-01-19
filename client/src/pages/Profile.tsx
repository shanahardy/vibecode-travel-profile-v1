import { AppLayout } from '@/components/layout/AppLayout';
import { useProfileStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plane, Wallet, Users, Utensils, Heart, MapPin, Calendar, Mail, Phone, Map } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function Profile() {
  const { profile } = useProfileStore();

  const isEmpty = !profile.contactInfo?.email && !profile.name;

  if (isEmpty) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Plane className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold">No Profile Found</h2>
          <p className="text-muted-foreground">Start the onboarding conversation to build your profile.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 pb-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-serif font-bold">Your Travel Profile</h1>
          <p className="text-muted-foreground">Manage your preferences and travel settings.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Identity Card */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                {profile.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <CardTitle className="text-2xl">{profile.name || 'Traveler'}</CardTitle>
                <CardDescription>Based in {profile.location?.city || 'Unknown'}</CardDescription>
                {profile.contactInfo && (
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {profile.contactInfo.email}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {profile.contactInfo.phone}</span>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Travel Group */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-primary" /> Travel Group
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.travelGroup ? (
                <div className="space-y-3">
                   <Badge variant="secondary" className="uppercase">{profile.travelGroup.type}</Badge>
                   <div className="space-y-2">
                      {profile.travelGroup.members.map((m, i) => (
                        <div key={i} className="flex justify-between items-center text-sm border-b border-border/50 pb-2 last:border-0">
                           <span className="font-medium">{m.name}</span>
                           <span className="text-muted-foreground">{m.age} yrs</span>
                        </div>
                      ))}
                   </div>
                </div>
              ) : <span className="text-muted-foreground italic">Not specified</span>}
            </CardContent>
          </Card>

          {/* Location & Terminals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-primary" /> Location & Hubs
              </CardTitle>
            </CardHeader>
            <CardContent>
               {profile.location ? (
                 <div className="space-y-4">
                    <div>
                       <p className="font-medium">{profile.location.city}, {profile.location.state}</p>
                       <p className="text-xs text-muted-foreground">{profile.location.zipCode}</p>
                    </div>
                    <div>
                       <label className="text-xs text-muted-foreground font-semibold uppercase">Preferred Airports</label>
                       <div className="flex flex-wrap gap-2 mt-1">
                          {profile.location.preferredAirports.map(code => (
                            <Badge key={code} variant="outline" className="font-mono bg-muted/50">{code}</Badge>
                          ))}
                       </div>
                    </div>
                 </div>
               ) : <span className="text-muted-foreground italic">Not specified</span>}
            </CardContent>
          </Card>

          {/* Budget Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="w-5 h-5 text-primary" /> Budget Priorities
              </CardTitle>
            </CardHeader>
            <CardContent>
               {profile.budgetPreferences ? (
                 <div className="space-y-4">
                    {profile.budgetPreferences.budgetRange && (
                      <div className="p-3 bg-secondary/30 rounded-lg text-center">
                         <span className="text-lg font-bold text-primary">
                           ${profile.budgetPreferences.budgetRange.min.toLocaleString()} - ${profile.budgetPreferences.budgetRange.max.toLocaleString()}
                         </span>
                         <p className="text-xs text-muted-foreground">Typical spend per week</p>
                      </div>
                    )}
                    <div className="space-y-2">
                       {Object.entries(profile.budgetPreferences.priorityCategories).map(([cat, priority]) => (
                         <div key={cat} className="flex justify-between items-center text-sm">
                            <span className="capitalize text-muted-foreground">{cat}</span>
                            <Badge variant={priority === 'high' ? 'default' : priority === 'medium' ? 'secondary' : 'outline'} className="capitalize">
                               {priority} Priority
                            </Badge>
                         </div>
                       ))}
                    </div>
                 </div>
               ) : <span className="text-muted-foreground italic">Not specified</span>}
            </CardContent>
          </Card>

          {/* Upcoming Trips */}
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-primary" /> Upcoming Trips
              </CardTitle>
            </CardHeader>
            <CardContent>
               {profile.upcomingTrips && profile.upcomingTrips.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.upcomingTrips.map((trip, i) => (
                       <div key={i} className="p-4 rounded-lg border border-border bg-card shadow-sm flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                             <h4 className="font-bold text-lg">{trip.destination}</h4>
                             <Badge>{trip.purpose}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                             <Calendar className="w-4 h-4" />
                             {trip.timeframe.description}
                          </div>
                       </div>
                    ))}
                 </div>
               ) : <span className="text-muted-foreground italic">No upcoming trips planned</span>}
            </CardContent>
          </Card>

           {/* Past Trip Summary */}
           <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Map className="w-5 h-5 text-primary" /> Last Trip Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.pastTrips && profile.pastTrips.length > 0 ? (
                 <div className="space-y-4">
                    <p className="italic text-muted-foreground">"{profile.pastTrips[0].summary}"</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {profile.pastTrips[0].likes.length > 0 && (
                          <div>
                             <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-green-600"><Heart className="w-4 h-4" /> Liked</h4>
                             <ul className="list-disc list-inside text-sm text-muted-foreground">
                                {profile.pastTrips[0].likes.map(l => <li key={l}>{l}</li>)}
                             </ul>
                          </div>
                        )}
                        {profile.pastTrips[0].dislikes.length > 0 && (
                          <div>
                             <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-red-500">Disliked</h4>
                             <ul className="list-disc list-inside text-sm text-muted-foreground">
                                {profile.pastTrips[0].dislikes.map(l => <li key={l}>{l}</li>)}
                             </ul>
                          </div>
                        )}
                        {profile.pastTrips[0].specialNeeds.length > 0 && (
                          <div>
                             <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-orange-500">Special Needs</h4>
                             <div className="flex flex-wrap gap-2">
                                {profile.pastTrips[0].specialNeeds.map(n => <Badge key={n} variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">{n}</Badge>)}
                             </div>
                          </div>
                        )}
                    </div>
                 </div>
              ) : <span className="text-muted-foreground italic">No past trip details available</span>}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
