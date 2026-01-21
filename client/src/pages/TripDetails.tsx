import { AppLayout } from '@/components/layout/AppLayout';
import { useProfileStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Plane, 
  Hotel, 
  Utensils, 
  Camera, 
  ArrowLeft,
  Share2,
  Download,
  Map as MapIcon,
  Sun,
  CloudRain
} from 'lucide-react';
import { Link, useRoute } from 'wouter';
import tropicalImage from '@assets/generated_images/tropical_beach_vacation_paradise.png';

export default function TripDetails() {
  const [match, params] = useRoute("/trip/:id");
  const { profile } = useProfileStore();
  const tripIndex = params?.id ? parseInt(params.id) : 0;
  
  const trip = profile.upcomingTrips ? profile.upcomingTrips[tripIndex] : null;

  if (!trip) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <h2 className="text-2xl font-bold">Trip Not Found</h2>
          <Link href="/plan">
            <Button>Back to Planner</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  // Mock Data for Itinerary Details (since store doesn't have deep details yet)
  const itineraryDays = [
    {
      day: 1,
      date: "Mon, Jun 12",
      title: "Arrival & Relaxation",
      activities: [
        { time: "14:00", title: "Check-in at Resort", type: "lodging", icon: Hotel, description: "Ocean view suite at The Royal Palms" },
        { time: "16:00", title: "Beach Walk", type: "activity", icon: Sun, description: "Explore the private beach area" },
        { time: "19:00", title: "Welcome Dinner", type: "food", icon: Utensils, description: "Seafood reservation at Blue Horizon" }
      ]
    },
    {
      day: 2,
      date: "Tue, Jun 13",
      title: "Island Exploration",
      activities: [
        { time: "09:00", title: "Island Boat Tour", type: "activity", icon: Camera, description: "Full day snorkeling and island hopping tour" },
        { time: "13:00", title: "Picnic Lunch", type: "food", icon: Utensils, description: "Provided on the boat" },
        { time: "18:00", title: "Sunset Cocktails", type: "activity", icon: Utensils, description: "Rooftop lounge downtown" }
      ]
    },
    {
      day: 3,
      date: "Wed, Jun 14",
      title: "Culture & History",
      activities: [
        { time: "10:00", title: "Old Town Market", type: "activity", icon: MapPin, description: "Shopping for local crafts and spices" },
        { time: "12:30", title: "Local Street Food Tour", type: "food", icon: Utensils, description: "Guided tasting of 5 local dishes" },
        { time: "15:00", title: "Museum Visit", type: "activity", icon: Camera, description: "National History Museum" }
      ]
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-8 pb-20">
        
        {/* Navigation & Header */}
        <div className="flex flex-col gap-6">
            <Link href="/plan">
                <Button variant="ghost" className="w-fit pl-0 hover:pl-2 transition-all text-muted-foreground hover:text-primary">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Trips
                </Button>
            </Link>

            <div className="relative h-[300px] rounded-3xl overflow-hidden shadow-xl group">
                <img 
                    src={tropicalImage} 
                    alt={trip.destination} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8 text-white w-full">
                    <div className="flex justify-between items-end">
                        <div>
                            <Badge className="bg-white/20 hover:bg-white/30 text-white border-none mb-4 backdrop-blur-md uppercase tracking-wider font-semibold">
                                {trip.purpose}
                            </Badge>
                            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-2">{trip.destination}</h1>
                            <div className="flex items-center gap-4 text-white/80 text-sm md:text-base">
                                <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {trip.timeframe.description}</span>
                                <span className="hidden md:inline">•</span>
                                <span className="flex items-center gap-2"><Users className="w-4 h-4" /> {profile.travelGroup?.members.length || 1} Travelers</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <Button size="icon" variant="secondary" className="rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 text-white border-none">
                                <Share2 className="w-4 h-4" />
                             </Button>
                             <Button size="icon" variant="secondary" className="rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 text-white border-none">
                                <Download className="w-4 h-4" />
                             </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="itinerary" className="w-full">
            <TabsList className="w-full justify-start h-12 bg-transparent border-b rounded-none px-0 mb-6 gap-6">
                <TabsTrigger value="itinerary" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 font-semibold text-base">Itinerary</TabsTrigger>
                <TabsTrigger value="flights" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 font-semibold text-base">Flights & Stay</TabsTrigger>
                <TabsTrigger value="budget" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 font-semibold text-base">Budget</TabsTrigger>
            </TabsList>

            <TabsContent value="itinerary" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Timeline */}
                    <div className="lg:col-span-2 space-y-8">
                        {itineraryDays.map((day) => (
                            <Card key={day.day} className="border-none shadow-sm bg-secondary/10">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <Badge variant="outline" className="mb-2 bg-background">Day {day.day}</Badge>
                                            <CardTitle className="text-xl">{day.title}</CardTitle>
                                            <CardDescription>{day.date}</CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                             <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background px-2 py-1 rounded-full border">
                                                <Sun className="w-3 h-3 text-orange-400" /> 82°F
                                             </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="relative pl-6 border-l-2 border-primary/20 space-y-8 my-4">
                                        {day.activities.map((activity, idx) => (
                                            <div key={idx} className="relative">
                                                <div className="absolute -left-[31px] bg-background border-2 border-primary/20 rounded-full p-1.5 text-primary">
                                                    <activity.icon className="w-3 h-3" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold font-mono text-primary">{activity.time}</span>
                                                        <h4 className="font-semibold">{activity.title}</h4>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Right Column: Map & Notes */}
                    <div className="space-y-6">
                        <Card className="overflow-hidden">
                            <CardHeader className="pb-0">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <MapIcon className="w-4 h-4" /> Trip Map
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="aspect-square w-full bg-muted rounded-xl flex items-center justify-center text-muted-foreground relative overflow-hidden group cursor-pointer">
                                    <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/-122.4241,37.78,14.25,0,0/600x600?access_token=pk.eyJ1IjoidHJhdmVsdXhlIiwiYSI6ImNrbHl5bHhyaDAwYnoydm8xZ3J5bHhyaDAifQ.xv_y_z')] bg-cover opacity-50 group-hover:opacity-60 transition-opacity"></div>
                                    <span className="relative z-10 font-medium flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-1.5 rounded-full border shadow-sm">
                                        <MapPin className="w-4 h-4 text-primary" /> View Interactive Map
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                             <CardHeader>
                                <CardTitle className="text-lg">Trip Notes</CardTitle>
                             </CardHeader>
                             <CardContent>
                                 <p className="text-sm text-muted-foreground italic">
                                     "{trip.notes || "No specific notes added yet. Use the planner chat to add details."}"
                                 </p>
                             </CardContent>
                        </Card>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="flights">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Plane className="w-5 h-5 text-primary" /> Flight Details</CardTitle>
                            <CardDescription>Round trip configuration</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center p-3 border rounded-lg">
                                <div className="flex gap-3 items-center">
                                    <div className="font-bold text-xl text-primary">SFO</div>
                                    <Separator className="w-8" />
                                    <Plane className="w-4 h-4 text-muted-foreground rotate-90" />
                                    <Separator className="w-8" />
                                    <div className="font-bold text-xl text-primary">PPT</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-sm">Outbound</div>
                                    <div className="text-xs text-muted-foreground">Jun 12 • 08:30 AM</div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-3 border rounded-lg">
                                <div className="flex gap-3 items-center">
                                    <div className="font-bold text-xl text-primary">PPT</div>
                                    <Separator className="w-8" />
                                    <Plane className="w-4 h-4 text-muted-foreground -rotate-90" />
                                    <Separator className="w-8" />
                                    <div className="font-bold text-xl text-primary">SFO</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-sm">Return</div>
                                    <div className="text-xs text-muted-foreground">Jun 18 • 10:15 PM</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Hotel className="w-5 h-5 text-primary" /> Accommodation</CardTitle>
                            <CardDescription>Primary stay</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="aspect-video w-full bg-muted rounded-lg mb-4 overflow-hidden relative">
                                <img src={tropicalImage} className="w-full h-full object-cover" />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-3 text-white">
                                    <h4 className="font-bold">The Royal Palms Resort</h4>
                                    <p className="text-xs text-white/80">Oceanfront Suite • 5 Nights</p>
                                </div>
                             </div>
                             <div className="space-y-2">
                                 <div className="flex justify-between text-sm">
                                     <span className="text-muted-foreground">Check-in</span>
                                     <span className="font-medium">Jun 12, 3:00 PM</span>
                                 </div>
                                 <div className="flex justify-between text-sm">
                                     <span className="text-muted-foreground">Check-out</span>
                                     <span className="font-medium">Jun 17, 11:00 AM</span>
                                 </div>
                                 <Separator />
                                 <div className="flex justify-between text-sm">
                                     <span className="text-muted-foreground">Address</span>
                                     <span className="font-medium text-right">123 Palm Ave, Bora Bora</span>
                                 </div>
                             </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
            
            <TabsContent value="budget">
                <Card>
                    <CardHeader>
                        <CardTitle>Estimated Costs</CardTitle>
                        <CardDescription>Based on your preferences and current bookings</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-2 border-b">
                                <span className="flex items-center gap-2"><Plane className="w-4 h-4 text-muted-foreground" /> Flights</span>
                                <span className="font-mono font-medium">$1,250</span>
                            </div>
                             <div className="flex justify-between items-center p-2 border-b">
                                <span className="flex items-center gap-2"><Hotel className="w-4 h-4 text-muted-foreground" /> Accommodation</span>
                                <span className="font-mono font-medium">$2,400</span>
                            </div>
                             <div className="flex justify-between items-center p-2 border-b">
                                <span className="flex items-center gap-2"><Utensils className="w-4 h-4 text-muted-foreground" /> Food & Dining</span>
                                <span className="font-mono font-medium">$850</span>
                            </div>
                             <div className="flex justify-between items-center p-2 border-b">
                                <span className="flex items-center gap-2"><Camera className="w-4 h-4 text-muted-foreground" /> Activities</span>
                                <span className="font-mono font-medium">$600</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-muted/20 rounded-lg">
                                <span className="font-bold text-lg">Total Estimated</span>
                                <span className="font-mono font-bold text-xl text-primary">$5,100</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
