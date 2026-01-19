import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ArrowRight, Compass, Calendar, Plus } from 'lucide-react';
import { useProfileStore } from '@/lib/store';

export default function Home() {
  const { profile } = useProfileStore();

  return (
    <AppLayout>
      <div className="space-y-12 py-8">
        {/* Hero Section */}
        <div className="relative rounded-3xl overflow-hidden bg-sidebar text-sidebar-foreground p-8 md:p-12 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          
          <div className="relative z-10 max-w-2xl space-y-6">
            <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight">
              {profile.name ? `Welcome back, ${profile.name.split(' ')[0]}` : "Design your dream trip"}
            </h1>
            <p className="text-lg text-sidebar-foreground/80 leading-relaxed">
              Your personal AI travel concierge is ready to help you plan your next adventure using your unique travel DNA.
            </p>
            <div className="flex gap-4 pt-4">
              <Link href={profile.name ? "/plan" : "/onboarding"}>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 h-12 text-base shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95">
                  {profile.name ? "Plan a New Trip" : "Build Your Profile"}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Compass className="w-6 h-6 text-primary" />
            Your Travel Hub
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/onboarding">
              <div className="group cursor-pointer rounded-2xl border border-border bg-card p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <UserIcon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Update Profile</h3>
                <p className="text-muted-foreground text-sm">Refine your preferences, budget, and travel style.</p>
              </div>
            </Link>

            <div className="group cursor-not-allowed opacity-60 rounded-2xl border border-border bg-card p-6 relative overflow-hidden">
               <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center mb-4 text-secondary-foreground">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Upcoming Trips</h3>
                <p className="text-muted-foreground text-sm">You have no upcoming trips planned yet.</p>
            </div>

            <div className="group cursor-pointer rounded-2xl border border-dashed border-border bg-muted/30 p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors">
                <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mb-4 shadow-sm text-primary">
                  <Plus className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold">Create New Itinerary</h3>
                <p className="text-muted-foreground text-xs mt-2">Start planning from scratch</p>
            </div>
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
