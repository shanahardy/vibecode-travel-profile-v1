import { AppLayout } from '@/components/layout/AppLayout';
import { useProfileStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plane, Wallet, Users, Utensils, Heart, MapPin } from 'lucide-react';

export default function Profile() {
  const { profile } = useProfileStore();

  const isEmpty = !profile.name;

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
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-2xl">{profile.name}</CardTitle>
                <CardDescription>Based in {profile.homeAirport || 'Unknown'}</CardDescription>
              </div>
            </CardHeader>
          </Card>

          {/* Travel Style */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plane className="w-5 h-5 text-primary" /> Travel Style
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.travelStyle.length > 0 ? (
                  profile.travelStyle.map((style) => (
                    <Badge key={style} variant="secondary" className="px-3 py-1">
                      {style}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground italic">Not specified</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Budget */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="w-5 h-5 text-primary" /> Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize text-foreground/80">
                {profile.budget || <span className="text-muted-foreground text-base italic">Not specified</span>}
              </div>
            </CardContent>
          </Card>

          {/* Companions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-primary" /> Companions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{profile.travelCompanions || <span className="text-muted-foreground italic">Not specified</span>}</p>
            </CardContent>
          </Card>

          {/* Dietary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Utensils className="w-5 h-5 text-primary" /> Dietary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.dietaryRestrictions.length > 0 ? (
                  profile.dietaryRestrictions.map((diet) => (
                    <Badge key={diet} variant="outline" className="border-destructive/30 text-destructive">
                      {diet}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground italic">None</span>
                )}
              </div>
            </CardContent>
          </Card>

           {/* Interests */}
           <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="w-5 h-5 text-primary" /> Interests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.interests.length > 0 ? (
                  profile.interests.map((interest, i) => (
                    <Badge key={i} variant="secondary">
                      {interest}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground italic">None</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
