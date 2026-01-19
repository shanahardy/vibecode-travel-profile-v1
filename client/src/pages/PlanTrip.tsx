import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { 
  Plus, 
  Map, 
  Calendar, 
  Plane, 
  Hotel, 
  ArrowRight,
  MoreVertical,
  Clock,
  AlertTriangle,
  X
} from 'lucide-react';
import { useProfileStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { checkSchoolConflict } from '@/lib/school-calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from 'react';

export default function PlanTrip() {
  const { profile } = useProfileStore();
  const [dismissedWarnings, setDismissedWarnings] = useState<number[]>([]);

  const hasMinors = profile.travelGroup?.members.some(m => m.isMinor);

  return (
    <AppLayout>
      <div className="space-y-8 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-serif font-bold">Plan a Trip</h1>
                <p className="text-muted-foreground mt-1">Manage your itineraries and start new adventures.</p>
            </div>
            <Link href="/onboarding">
                <Button size="lg" className="rounded-full shadow-lg shadow-primary/20">
                    <Plus className="w-5 h-5 mr-2" />
                    New Trip
                </Button>
            </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Content: Trip List */}
            <div className="md:col-span-2 space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Upcoming Trips
                </h2>
                
                {(!profile.upcomingTrips || profile.upcomingTrips.length === 0) ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <Map className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium">No trips planned yet</h3>
                            <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                                Start planning your next getaway by chatting with our AI travel concierge.
                            </p>
                            <Link href="/onboarding">
                                <Button variant="outline">Start Planning</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {profile.upcomingTrips.map((trip, idx) => {
                            const isSchoolConflict = hasMinors && checkSchoolConflict(trip.timeframe.description) && !dismissedWarnings.includes(idx);
                            
                            return (
                                <Card key={idx} className="group hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary/0 hover:border-l-primary relative overflow-hidden">
                                    {isSchoolConflict && (
                                        <div className="bg-amber-100 text-amber-800 text-xs px-4 py-2 flex items-center justify-between border-b border-amber-200">
                                            <span className="flex items-center gap-2 font-medium">
                                                <AlertTriangle className="w-3 h-3" />
                                                Warning: This trip date overlaps with school session.
                                            </span>
                                            <button onClick={(e) => {
                                                e.stopPropagation();
                                                setDismissedWarnings([...dismissedWarnings, idx]);
                                            }} className="hover:bg-amber-200 rounded p-0.5">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                                        <div>
                                            <CardTitle className="text-xl flex items-center gap-2">
                                                {trip.destination}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="font-normal capitalize">
                                                    {trip.purpose}
                                                </Badge>
                                                <span className="text-xs">•</span>
                                                <span className="flex items-center gap-1 text-xs">
                                                    <Clock className="w-3 h-3" />
                                                    {trip.timeframe.description}
                                                </span>
                                            </CardDescription>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                                <DropdownMenuItem>View Itinerary</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-4 mt-2">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-md">
                                                <Plane className="w-4 h-4" />
                                                <span>Flights TBD</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-md">
                                                <Hotel className="w-4 h-4" />
                                                <span>Lodging TBD</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-2 border-t bg-muted/5">
                                        <Button variant="ghost" size="sm" className="ml-auto text-primary hover:text-primary hover:bg-primary/10 group-hover:pr-2 transition-all">
                                            Continue Planning <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Sidebar: Inspiration / Quick Actions */}
            <div className="space-y-6">
                <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none"></div>
                    <CardHeader>
                        <CardTitle>Ready for a new adventure?</CardTitle>
                        <CardDescription className="text-primary-foreground/80">
                            Our AI can help you discover perfect destinations based on your preferences.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Link href="/onboarding">
                            <Button variant="secondary" className="w-full font-semibold">
                                Start New Plan
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>

                <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">Drafts</h3>
                    <div className="space-y-3">
                        {/* Placeholder Drafts */}
                        <div className="p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                            <div className="font-medium text-sm">Weekend Getaway</div>
                            <div className="text-xs text-muted-foreground">Last edited 2 days ago</div>
                        </div>
                        <div className="p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                            <div className="font-medium text-sm">Summer 2026 Ideas</div>
                            <div className="text-xs text-muted-foreground">Last edited 1 week ago</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </AppLayout>
  );
}
