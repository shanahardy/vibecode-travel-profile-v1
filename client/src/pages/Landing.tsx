import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ArrowRight, Mic, Shield, Globe, Sparkles, Check, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import tropicalImage from '@assets/generated_images/tropical_beach_vacation_paradise.png';

export default function Landing() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-background text-foreground">
        {/* Navigation */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between mx-auto px-4 md:px-8 max-w-7xl">
                <div className="flex items-center gap-2 font-serif font-bold text-xl text-primary">
                    <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                        <Compass className="w-5 h-5" />
                    </span>
                    TraveLuxe
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/onboarding">
                         <Button variant="ghost" className="font-medium hidden sm:flex">Log In</Button>
                    </Link>
                    <Link href="/onboarding">
                         <Button className="rounded-full font-medium">Get Started</Button>
                    </Link>
                </div>
            </div>
        </header>

        <main className="flex-1">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-16 md:pt-24 pb-32">
                 <div className="container px-4 md:px-8 mx-auto max-w-7xl relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8 animate-in slide-in-from-left duration-700 fade-in">
                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-4 py-1.5 text-sm font-medium rounded-full mb-4">
                                <Sparkles className="w-3 h-3 mr-2" />
                                The Future of Travel Planning
                            </Badge>
                            
                            <h1 className="text-5xl md:text-7xl font-serif font-bold leading-[1.1] tracking-tight">
                                Design your dream trip with <span className="text-primary italic">AI precision.</span>
                            </h1>
                            
                            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                                Forget generic itineraries. Our AI travel concierge learns your preferences, budget, and style to craft perfectly personalized journeys in seconds.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Link href="/onboarding">
                                    <Button size="lg" className="rounded-full h-14 px-8 text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                                        Start Planning Free
                                        <ArrowRight className="ml-2 w-5 h-5" />
                                    </Button>
                                </Link>
                                <Button variant="outline" size="lg" className="rounded-full h-14 px-8 text-lg border-2 hover:bg-muted">
                                    <Play className="mr-2 w-4 h-4 fill-current" /> Watch Demo
                                </Button>
                            </div>

                            <div className="flex items-center gap-4 pt-4 text-sm font-medium text-muted-foreground">
                                <span className="flex items-center"><Check className="w-4 h-4 mr-1 text-green-500" /> Free Forever</span>
                                <span className="flex items-center"><Check className="w-4 h-4 mr-1 text-green-500" /> No Credit Card</span>
                                <span className="flex items-center"><Check className="w-4 h-4 mr-1 text-green-500" /> Instant Itineraries</span>
                            </div>
                        </div>

                        <div className="relative h-[600px] lg:h-[700px] rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-right duration-1000 fade-in">
                             <img 
                                src={tropicalImage} 
                                alt="Tropical Vacation" 
                                className="w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-[2s]" 
                             />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                             
                             {/* Floating Cards Mockups */}
                             <div className="absolute bottom-10 left-10 right-10 flex flex-col gap-4">
                                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/20 flex items-center gap-4 max-w-md self-end animate-in slide-in-from-bottom duration-700 delay-300 fill-mode-both">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                                        <Mic className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">You said</p>
                                        <p className="font-medium text-sm text-foreground">"I want a relaxing beach vacation in Bora Bora for my anniversary..."</p>
                                    </div>
                                </div>

                                <div className="bg-primary text-primary-foreground p-4 rounded-2xl shadow-xl flex items-center gap-4 max-w-md self-start animate-in slide-in-from-bottom duration-700 delay-500 fill-mode-both">
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white flex-shrink-0">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">AI Suggestion</p>
                                        <p className="font-medium text-sm text-white">"I've found the perfect overwater bungalow at The Royal Palms with sunset views."</p>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                 </div>

                 {/* Background decoration */}
                 <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
                 <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none"></div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-muted/30">
                <div className="container px-4 md:px-8 mx-auto max-w-7xl">
                    <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                        <h2 className="text-3xl md:text-5xl font-serif font-bold">Why plan with TraveLuxe?</h2>
                        <p className="text-lg text-muted-foreground">We combine the ease of conversation with the power of modern travel planning.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-background p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-6">
                                <Mic className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Natural Voice Control</h3>
                            <p className="text-muted-foreground leading-relaxed">Just speak your plans. Our AI understands context, nuances, and corrections instantly.</p>
                        </div>
                        <div className="bg-background p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
                             <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-6">
                                <Shield className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Private & Secure</h3>
                            <p className="text-muted-foreground leading-relaxed">Your personal data and travel preferences are encrypted and never shared without permission.</p>
                        </div>
                        <div className="bg-background p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
                             <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 mb-6">
                                <Globe className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Global Expertise</h3>
                            <p className="text-muted-foreground leading-relaxed">Access local insights, hidden gems, and travel tips for thousands of destinations worldwide.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24">
                 <div className="container px-4 md:px-8 mx-auto max-w-5xl">
                     <div className="bg-primary rounded-[3rem] p-8 md:p-16 text-center text-primary-foreground relative overflow-hidden">
                         <div className="relative z-10 space-y-8">
                             <h2 className="text-3xl md:text-5xl font-serif font-bold">Ready to travel smarter?</h2>
                             <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
                                 Join thousands of travelers who are saving time and discovering better trips with TraveLuxe.
                             </p>
                             <Link href="/onboarding">
                                <Button size="lg" variant="secondary" className="rounded-full h-14 px-10 text-lg shadow-lg font-semibold text-primary">
                                    Build Your Profile
                                </Button>
                             </Link>
                         </div>
                         
                         {/* Decorative circles */}
                         <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-16 -mt-16"></div>
                         <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mb-16"></div>
                     </div>
                 </div>
            </section>
        </main>

        <footer className="py-12 border-t bg-muted/20">
            <div className="container px-4 md:px-8 mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground text-sm">
                 <div className="flex items-center gap-2 font-serif font-bold text-lg text-foreground">
                    <Compass className="w-5 h-5" />
                    TraveLuxe
                </div>
                <div className="flex gap-6">
                    <a href="#" className="hover:text-foreground">About</a>
                    <a href="#" className="hover:text-foreground">Features</a>
                    <a href="#" className="hover:text-foreground">Pricing</a>
                    <a href="#" className="hover:text-foreground">Contact</a>
                </div>
                <p>&copy; 2026 TraveLuxe Inc.</p>
            </div>
        </footer>
    </div>
  );
}

function Compass({ className }: { className?: string }) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    );
}
