import { AppLayout } from '@/components/layout/AppLayout';
import { useProfileStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
  CloudRain,
  AlertTriangle,
  School,
  MessageSquareText,
  Heart,
  Check,
  Star,
  Globe
} from 'lucide-react';
import { Link, useRoute } from 'wouter';
import tropicalImage from '@assets/generated_images/tropical_beach_vacation_paradise.png';
import hotel1 from '@assets/images/hotel-1.jpg';
import hotel2 from '@assets/images/hotel-2.jpg';
import hotel3 from '@assets/images/hotel-3.jpg';
import activity1 from '@assets/images/activity-1.jpg';
import activity2 from '@assets/images/activity-2.jpg';
import { PlannerChat } from '@/components/planner/PlannerChat';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface ProductOption {
  id: string;
  title: string;
  type: 'stay' | 'activity' | 'food';
  image: string;
  rating: number;
  reviews: number;
  price: number;
  currency: string;
  location: string;
  description: string;
  isSelected?: boolean;
  isSaved?: boolean;
}

interface ItinerarySlot {
    period: string;
    timeRange: string;
    title: string;
    description: string;
    options: ProductOption[];
}

export default function TripDetails() {
  const [match, params] = useRoute("/trip/:id");
  const { profile } = useProfileStore();
  const tripIndex = params?.id ? parseInt(params.id) : 0;
  
  const trip = profile.upcomingTrips ? profile.upcomingTrips[tripIndex] : null;

  // Check for school schedule conflicts
  const schoolKids = profile.travelGroup?.members.filter(m => m.isMinor && m.schoolInfo?.schoolName) || [];
  const hasSchoolConflict = trip?.timeframe.startDate && schoolKids.length > 0 && (() => {
      const start = new Date(trip.timeframe.startDate);
      const month = start.getMonth(); // 0-11
      // Simple logic: School is in session Sep(8) - May(4), and often part of Jun(5)
      // Safe summer months: July(6), August(7)
      // Conflict months: 0, 1, 2, 3, 4, 8, 9, 10, 11
      // June(5) is borderline, let's treat early June as school too for safety in this demo
      return [0, 1, 2, 3, 4, 5, 8, 9, 10, 11].includes(month);
  })();

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
      title: "Arrival & Exploring the City",
      description: "Arrive in Bora Bora and check into your accommodation. Start your exploration with a visit to the local town.",
      slots: [
        {
            period: "Morning",
            timeRange: "10:00 AM - 1:00 PM",
            title: "Check-in & Settlement",
            description: "Choose your preferred stay option based on your budget and style.",
            options: [
                {
                    id: "stay-1",
                    title: "The Royal Palms Resort",
                    type: 'stay',
                    image: hotel1,
                    rating: 4.9,
                    reviews: 1240,
                    price: 1244,
                    currency: '$',
                    location: "Motu Piti Aau",
                    description: "Luxury overwater bungalows with direct lagoon access.",
                    isSelected: true
                },
                {
                    id: "stay-2",
                    title: "Bora Bora Pearl Beach",
                    type: 'stay',
                    image: hotel2,
                    rating: 4.7,
                    reviews: 890,
                    price: 850,
                    currency: '$',
                    location: "Tevairoa",
                    description: "Polynesian style suites with garden views.",
                    isSaved: true
                },
                 {
                    id: "stay-3",
                    title: "Sunset Hill Lodge",
                    type: 'stay',
                    image: hotel3,
                    rating: 4.5,
                    reviews: 320,
                    price: 450,
                    currency: '$',
                    location: "Vaitape",
                    description: "Cozy apartments with panoramic lagoon views.",
                }
            ] as ProductOption[]
        },
        {
            period: "Afternoon",
            timeRange: "2:00 PM - 6:00 PM",
            title: "Lagoon Discovery",
            description: "Experience the crystal clear waters of Bora Bora.",
            options: [
                {
                    id: "act-1",
                    title: "Private Lagoon Boat Tour",
                    type: 'activity',
                    image: activity1,
                    rating: 4.9,
                    reviews: 560,
                    price: 320,
                    currency: '$',
                    location: "Main Dock",
                    description: "Exclusive boat tour with snorkeling stops.",
                    isSaved: true
                },
                {
                    id: "act-2",
                    title: "Jet Ski Adventure",
                    type: 'activity',
                    image: activity2,
                    rating: 4.8,
                    reviews: 420,
                    price: 180,
                    currency: '$',
                    location: "Matira Beach",
                    description: "Guided jet ski tour around the island.",
                },
                 {
                    id: "act-3",
                    title: "Relax at Matira Beach",
                    type: 'activity',
                    image: tropicalImage,
                    rating: 4.9,
                    reviews: 2100,
                    price: 0,
                    currency: '$',
                    location: "Matira Point",
                    description: "Free time at the world-famous public beach.",
                    isSelected: true
                }
            ] as ProductOption[]
        }
      ]
    },
    {
      day: 2,
      date: "Tue, Jun 13",
      title: "Island Exploration",
      description: "Dive deep into the culture and natural beauty of the island.",
      slots: [
           {
            period: "Morning",
            timeRange: "09:00 AM - 1:00 PM",
            title: "4x4 Island Safari",
            description: "Explore the mountainous interior of the island.",
            options: [
                {
                    id: "act-4",
                    title: "Jeep Safari Tour",
                    type: 'activity',
                    image: activity1,
                    rating: 4.7,
                    reviews: 340,
                    price: 120,
                    currency: '$',
                    location: "Hotel Pickup",
                    description: "Visit WWII cannons and viewpoints.",
                    isSelected: true
                }
            ] as ProductOption[]
        }
      ]
    }
  ];

  return (
    <AppLayout>
      <div className="h-[calc(100vh-6rem)] flex gap-6">
        
        {/* Main Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto pr-2 pb-20">
          <div className="space-y-8">
            
            {/* Navigation & Header */}
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <Link href="/plan">
                        <Button variant="ghost" className="w-fit pl-0 hover:pl-2 transition-all text-muted-foreground hover:text-primary">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Trips
                        </Button>
                    </Link>
                    
                    {/* Mobile Chat Trigger */}
                    <div className="xl:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button className="rounded-full shadow-lg gap-2">
                                    <MessageSquareText className="w-4 h-4" /> AI Planner
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="sm:max-w-md w-full p-0 flex flex-col pt-10">
                                <div className="flex-1 overflow-hidden">
                                    <PlannerChat tripIndex={tripIndex} />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>

                {hasSchoolConflict && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4 animate-in slide-in-from-top duration-500">
                    <div className="bg-amber-100 p-2 rounded-full text-amber-600 mt-1">
                        <School className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-amber-800 flex items-center gap-2">
                            Potential School Schedule Conflict
                        </h4>
                        <p className="text-amber-700 text-sm mt-1">
                            This trip is scheduled for <strong>{trip.timeframe.description}</strong>, which appears to conflict with the school calendar for:
                        </p>
                        <ul className="list-disc list-inside text-sm text-amber-700 mt-1 ml-1 font-medium">
                            {schoolKids.map((kid, idx) => (
                                <li key={idx}>{kid.name} ({kid.schoolInfo?.schoolName})</li>
                            ))}
                        </ul>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800">
                        View Calendar
                    </Button>
                </div>
            )}

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
        </div>

        {/* Right Sidebar: Planner Chat (Desktop) */}
        <div className="hidden xl:flex w-[380px] flex-col border rounded-2xl overflow-hidden shadow-sm bg-card h-full sticky top-0">
            <PlannerChat tripIndex={tripIndex} />
        </div>

      </div>
    </AppLayout>
  );
}
