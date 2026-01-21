import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ArrowRight, Compass, Calendar, Plus, User, Sparkles } from 'lucide-react';
import { useProfileStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import tropicalImage from '@assets/generated_images/tropical_beach_vacation_paradise.png';
import { Mic, Shield, Globe, ArrowRight as ArrowRightIcon } from 'lucide-react';

export default function Home() {
  const { profile } = useProfileStore();
  const hasProfile = !!profile.name;
  const tripCount = profile.upcomingTrips?.length || 0;

  return (
    <AppLayout>
      <div className="space-y-12 py-8">
        {/* Voice Promo Section */}
        {!hasProfile && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1 text-xs font-medium uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 mr-2" />
                        AI-Powered Travel Agent
                    </Badge>
                    
                    <h1 className="text-5xl md:text-6xl font-serif font-bold leading-[1.1] tracking-tight text-foreground">
                        Build your travel profile with <span className="text-green-600">your voice.</span>
                    </h1>
                    
                    <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                        Stop filling out repetitive forms. Have a natural conversation with our AI to build a comprehensive, reusable travel profile that remembers your preferences, family details, and budget forever.
                    </p>
                    
                    <div className="flex flex-wrap gap-4">
                        <Link href="/onboarding">
                            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-8 h-12 text-base shadow-lg shadow-green-600/20 transition-all hover:scale-105 active:scale-95 font-medium">
                                <Mic className="mr-2 w-5 h-5" />
                                Start Voice Onboarding
                            </Button>
                        </Link>
                        <Link href="/onboarding">
                            <Button variant="outline" size="lg" className="rounded-lg px-8 h-12 text-base border-border hover:bg-muted font-medium">
                                Use Text Instead
                                <ArrowRightIcon className="ml-2 w-4 h-4" />
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                        <div className="space-y-2">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
                                <Mic className="w-5 h-5" />
                            </div>
                            <h4 className="font-semibold text-sm">Natural Voice</h4>
                            <p className="text-xs text-muted-foreground leading-snug">Just talk naturally. We extract the details.</p>
                        </div>
                        <div className="space-y-2">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-2">
                                <Shield className="w-5 h-5" />
                            </div>
                            <h4 className="font-semibold text-sm">Secure Profile</h4>
                            <p className="text-xs text-muted-foreground leading-snug">Your data is stored securely and editable anytime.</p>
                        </div>
                        <div className="space-y-2">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-2">
                                <Globe className="w-5 h-5" />
                            </div>
                            <h4 className="font-semibold text-sm">Smart Planning</h4>
                            <p className="text-xs text-muted-foreground leading-snug">Get personalized itineraries instantly.</p>
                        </div>
                    </div>
                </div>

                <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-2xl group">
                     <img 
                        src={tropicalImage} 
                        alt="Tropical Vacation" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                     
                     {/* Floating Card */}
                     <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/20 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-foreground">Dreaming of Bora Bora?</p>
                            <p className="text-xs text-muted-foreground">"I want a relaxing beach vacation..."</p>
                        </div>
                     </div>
                </div>
            </div>
        )}

        {/* Onboarding CTA & Summary Section */}
        {hasProfile && (
            <div className="relative rounded-3xl overflow-hidden bg-sidebar text-sidebar-foreground p-6 md:p-8 shadow-2xl">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <img src={tropicalImage} alt="Tropical Vacation" className="w-full h-full object-cover opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-transparent/50"></div>
            </div>

            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none relative z-10"></div>
            
            <div className="relative z-10 max-w-3xl space-y-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium uppercase tracking-wider mb-2">
                    <User className="w-3 h-3" />
                    Travel Profile Active
                </div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold leading-tight">
                    Welcome back, {profile.name.split(' ')[0]}
                </h1>
                <div className="flex flex-wrap gap-4 py-1">
                        {profile.location?.city && (
                            <Badge variant="outline" className="bg-background/50 backdrop-blur border-primary/20 text-foreground py-1 px-3">
                                📍 Based in {profile.location.city}
                            </Badge>
                        )}
                        {tripCount > 0 && (
                            <Badge variant="outline" className="bg-background/50 backdrop-blur border-primary/20 text-foreground py-1 px-3">
                                ✈️ {tripCount} Trip{tripCount !== 1 ? 's' : ''} Planned
                            </Badge>
                        )}
                        {profile.travelGroup?.type && (
                            <Badge variant="outline" className="bg-background/50 backdrop-blur border-primary/20 text-foreground py-1 px-3 capitalize">
                                👥 {profile.travelGroup.type} Traveler
                            </Badge>
                        )}
                </div>
                <p className="text-base text-sidebar-foreground/80 leading-relaxed max-w-xl">
                    Your profile is set up and ready. Continue planning your upcoming adventures or refine your preferences.
                </p>
                <div className="flex gap-4 pt-2">
                    <Link href="/plan">
                        <Button size="default" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 h-10 text-sm shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95">
                            Plan a New Trip
                            <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </Link>
                    <Link href="/onboarding">
                            <Button variant="outline" size="default" className="rounded-full px-6 h-10 text-sm bg-background/50 backdrop-blur border-primary/20 hover:bg-background/80">
                            Update Profile
                        </Button>
                    </Link>
                </div>
            </div>
            </div>
        )}

        {/* Dashboard Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Compass className="w-6 h-6 text-primary" />
            Your Travel Hub
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/onboarding">
              <div className="group cursor-pointer rounded-2xl border border-border bg-card p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/50 relative overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <UserIcon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Update Profile</h3>
                <p className="text-muted-foreground text-sm">Refine your preferences, budget, and travel style.</p>
              </div>
            </Link>

            <Link href="/plan">
                <div className="group cursor-pointer rounded-2xl border border-border bg-card p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/50 relative overflow-hidden h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center mb-4 text-secondary-foreground group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Upcoming Trips</h3>
                    <p className="text-muted-foreground text-sm">
                        {tripCount > 0 ? `Manage your ${tripCount} upcoming adventure${tripCount !== 1 ? 's' : ''}.` : "You have no upcoming trips planned yet."}
                    </p>
                </div>
            </Link>

            <Link href="/plan">
                <div className="group cursor-pointer rounded-2xl border border-dashed border-border bg-muted/30 p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors h-full">
                    <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mb-4 shadow-sm text-primary group-hover:scale-110 transition-transform">
                        <Plus className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold">Create New Itinerary</h3>
                    <p className="text-muted-foreground text-xs mt-2">Start planning from scratch</p>
                </div>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
