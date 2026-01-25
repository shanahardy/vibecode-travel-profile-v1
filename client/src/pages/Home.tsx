import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ArrowRight, Compass, Calendar, Plus, User, Sparkles, LogOut } from 'lucide-react';
import { useProfileStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import tropicalImage from '@assets/generated_images/tropical_beach_vacation_paradise.png';
import { Mic, Shield, Globe, ArrowRight as ArrowRightIcon } from 'lucide-react';
import Landing from './Landing';
import { useAuth } from '@/hooks/use-auth';

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { profile } = useProfileStore();
  const hasProfile = !!profile.name;
  const tripCount = profile.upcomingTrips?.length || 0;

  // Show landing page for unauthenticated users
  if (isLoading) {
    return <Landing />;
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  // Show onboarding prompt if authenticated but no profile
  if (!hasProfile) {
    return <Landing />;
  }

  return (
      <AppLayout>
          <div className="space-y-12 py-8">
            {/* Onboarding CTA & Summary Section */}
            {hasProfile ? (
                <div className="relative rounded-3xl overflow-hidden bg-sidebar text-sidebar-foreground p-8 md:p-12 shadow-2xl">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img src={tropicalImage} alt="Tropical Vacation" className="w-full h-full object-cover opacity-40" />
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-transparent/50"></div>
                </div>

                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none relative z-10"></div>
                
                <div className="relative z-10 max-w-3xl space-y-6">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium uppercase tracking-wider mb-2">
                        <User className="w-3 h-3" />
                        Travel Profile Active
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight">
                        Welcome back, {profile.name.split(' ')[0]}
                    </h1>
                    <div className="flex flex-wrap gap-4 py-2">
                            {profile.location?.city && (
                                <Badge variant="outline" className="bg-background/50 backdrop-blur border-primary/20 text-foreground py-1.5 px-3">
                                    📍 Based in {profile.location.city}
                                </Badge>
                            )}
                            {tripCount > 0 && (
                                <Badge variant="outline" className="bg-background/50 backdrop-blur border-primary/20 text-foreground py-1.5 px-3">
                                    ✈️ {tripCount} Trip{tripCount !== 1 ? 's' : ''} Planned
                                </Badge>
                            )}
                            {profile.travelGroup?.type && (
                                <Badge variant="outline" className="bg-background/50 backdrop-blur border-primary/20 text-foreground py-1.5 px-3 capitalize">
                                    👥 {profile.travelGroup.type} Traveler
                                </Badge>
                            )}
                    </div>
                    <p className="text-lg text-sidebar-foreground/80 leading-relaxed max-w-xl">
                        Your profile is set up and ready. Continue planning your upcoming adventures or refine your preferences.
                    </p>
                    <div className="flex gap-4 pt-4">
                        <Link href="/plan">
                            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 h-12 text-base shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95">
                                Plan a New Trip
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                        <Link href="/profile">
                                <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-base bg-background/50 backdrop-blur border-primary/20 hover:bg-background/80">
                                Edit Profile
                            </Button>
                        </Link>
                    </div>
                </div>
                </div>
            ) : (
                 <div className="relative rounded-3xl overflow-hidden bg-primary text-primary-foreground p-8 md:p-12 shadow-2xl">
                     <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2021&q=80')] bg-cover bg-center"></div>
                     <div className="relative z-10 max-w-2xl space-y-6">
                         <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight">
                             Start your journey.
                         </h1>
                         <p className="text-xl text-primary-foreground/90 leading-relaxed">
                             Build your comprehensive travel profile with our voice-guided assistant to get personalized trip recommendations instantly.
                         </p>
                         <div className="pt-4">
                             <Link href="/onboarding">
                                 <Button size="lg" variant="secondary" className="rounded-full px-8 h-14 text-lg shadow-xl hover:scale-105 transition-transform font-bold text-primary">
                                     <Mic className="w-5 h-5 mr-2" />
                                     Start Voice Onboarding
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
                <div 
                    className="group cursor-pointer rounded-2xl border border-dashed border-red-200 bg-red-50 p-6 flex flex-col items-center justify-center text-center hover:bg-red-100 transition-colors h-full"
                    onClick={() => {
                        const isDemo = profile.name === 'Alex Johnson';
                        const message = isDemo 
                            ? "Are you sure you want to clear the demo profile and start fresh?"
                            : "Are you sure you want to delete your profile and start over?";
                            
                        if (window.confirm(message)) {
                            useProfileStore.getState().resetConversation();
                            window.location.reload();
                        }
                    }}
                >
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm text-red-500 group-hover:scale-110 transition-transform">
                        <LogOut className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-red-800">
                        {profile.name === 'Alex Johnson' ? 'Exit Demo Mode' : 'Reset Profile'}
                    </h3>
                    <p className="text-red-600 text-xs mt-2">Clear data & start fresh</p>
                </div>

                <Link href="/plan">
                  <div className="group cursor-pointer rounded-2xl border border-border bg-card p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/50 relative overflow-hidden h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                      <Plus className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">New Trip</h3>
                    <p className="text-muted-foreground text-sm">Start planning a new adventure with AI assistance.</p>
                  </div>
                </Link>

                <Link href="/plan">
                    <div className="group cursor-pointer rounded-2xl border border-border bg-card p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/50 relative overflow-hidden h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Upcoming Trips</h3>
                        <p className="text-muted-foreground text-sm">
                            {tripCount > 0 ? `Manage your ${tripCount} upcoming adventure${tripCount !== 1 ? 's' : ''}.` : "You have no upcoming trips planned yet."}
                        </p>
                    </div>
                </Link>

                <Link href="/onboarding">
                    <div className="group cursor-pointer rounded-2xl border border-border bg-card p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/50 relative overflow-hidden h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <Mic className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Voice Builder</h3>
                        <p className="text-muted-foreground text-sm">Update your profile using our voice assistant.</p>
                    </div>
                </Link>

                <Link href="/profile">
                    <div className="group cursor-pointer rounded-2xl border border-border bg-card p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/50 relative overflow-hidden h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <User className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Travel Profile</h3>
                        <p className="text-muted-foreground text-sm">Update your preferences and settings.</p>
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
