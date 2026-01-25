import { useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Shield, Bell, CreditCard, LogOut, CheckCircle } from 'lucide-react';
import { useProfileStore } from '@/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';

export default function Account() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { profile } = useProfileStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading || !isAuthenticated) {
    return null;
  }
  
  // Use profile name if available, otherwise mock default
  const userName = profile.name || "Alex Johnson";
  const userInitials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const userEmail = profile.contactInfo?.email || "alex.johnson@example.com";

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold">Account Settings</h1>
            <p className="text-muted-foreground">Manage your personal information and security.</p>
          </div>
          <Badge variant="secondary" className="px-3 py-1 bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 border-yellow-500/20 font-semibold shadow-sm">
             ⭐ Premium Member
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Sidebar Navigation (Visual Only for Mockup) */}
            <div className="md:col-span-1 space-y-4">
                <Card className="border-border/50 shadow-sm">
                    <CardContent className="p-4 space-y-1">
                        <Button variant="ghost" className="w-full justify-start font-semibold bg-accent/50 text-accent-foreground">
                            <User className="mr-2 h-4 w-4" /> Personal Info
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-muted-foreground">
                            <Shield className="mr-2 h-4 w-4" /> Security
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-muted-foreground">
                            <Bell className="mr-2 h-4 w-4" /> Notifications
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-muted-foreground">
                            <CreditCard className="mr-2 h-4 w-4" /> Billing & Plans
                        </Button>
                        <Separator className="my-2" />
                        <a href="/api/logout" className="w-full">
                            <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" data-testid="button-sign-out">
                                <LogOut className="mr-2 h-4 w-4" /> Sign Out
                            </Button>
                        </a>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-red-200 bg-red-50 mt-4">
                    <CardContent className="p-4">
                        <h4 className="font-bold text-red-800 text-sm mb-2">Danger Zone</h4>
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            className="w-full justify-start"
                            onClick={() => {
                                if (window.confirm("Are you sure you want to delete your profile? This action cannot be undone.")) {
                                    useProfileStore.getState().resetConversation();
                                    window.location.href = "/";
                                }
                            }}
                        >
                            <LogOut className="mr-2 h-4 w-4" /> Reset Profile Data
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Main Settings Content */}
            <div className="md:col-span-2 space-y-6">
                
                {/* Profile Header */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle>Profile Details</CardTitle>
                        <CardDescription>Update your photo and personal details here.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-6">
                             <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                                <AvatarFallback className="text-xl bg-primary/10 text-primary">{userInitials}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-2">
                                <Button variant="outline" size="sm">Change Photo</Button>
                                <p className="text-xs text-muted-foreground">JPG, GIF or PNG. 1MB max.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" defaultValue={userName.split(' ')[0]} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" defaultValue={userName.split(' ').slice(1).join(' ')} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="email" defaultValue={userEmail} className="pl-9" />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/20 border-t flex justify-end py-4">
                        <Button>Save Changes</Button>
                    </CardFooter>
                </Card>

                 {/* Connected Accounts / Login Methods */}
                 <Card>
                    <CardHeader>
                        <CardTitle>Sign-in Method</CardTitle>
                        <CardDescription>Manage how you log into your account.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <Shield className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">Google Account</p>
                                    <p className="text-xs text-muted-foreground">Connected as {userEmail}</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                <CheckCircle className="w-3 h-3 mr-1" /> Connected
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-card opacity-60">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                    <Shield className="h-4 w-4 text-gray-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">Password</p>
                                    <p className="text-xs text-muted-foreground">Last changed 3 months ago</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm">Update</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </AppLayout>
  );
}
