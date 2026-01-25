import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProfileStore, TravelMember, TravelGroup, LocationInfo, BudgetPreferences, ContactInfo } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plane, Wallet, Users, Heart, MapPin, Calendar, Mail, Phone, Map, Pencil, Check, X, Plus, Trash2, Mic } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

export default function Profile() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { profile, updateSection, updateProfile } = useProfileStore();
  const [editingSection, setEditingSection] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading || !isAuthenticated) {
    return null;
  }
  
  // Temporary state for edits
  const [tempContact, setTempContact] = useState<Partial<ContactInfo> & { name: string }>({ 
      name: profile.name, 
      ...profile.contactInfo 
  });
  const [tempGroup, setTempGroup] = useState<TravelGroup>(profile.travelGroup || { type: 'solo', members: [] });
  const [tempLocation, setTempLocation] = useState<LocationInfo>(profile.location || { city: '', state: '', zipCode: '', preferredAirports: [], preferredTerminals: [] });
  const [tempBudget, setTempBudget] = useState<BudgetPreferences>(profile.budgetPreferences || { 
      priorityCategories: { flights: 'medium', lodging: 'medium', food: 'medium', activities: 'medium' }, 
      notes: '' 
  });

  const handleEdit = (section: string) => {
    setEditingSection(section);
    // Reset temp state to current store value when starting edit
    if (section === 'identity') {
        setTempContact({ name: profile.name, ...profile.contactInfo });
    } else if (section === 'group') {
        setTempGroup(JSON.parse(JSON.stringify(profile.travelGroup || { type: 'solo', members: [] })));
    } else if (section === 'location') {
        setTempLocation(JSON.parse(JSON.stringify(profile.location || { city: '', state: '', zipCode: '', preferredAirports: [] })));
    } else if (section === 'budget') {
        setTempBudget(JSON.parse(JSON.stringify(profile.budgetPreferences || { priorityCategories: { flights: 'medium' } })));
    }
  };

  const handleSave = (section: string) => {
    if (section === 'identity') {
        updateProfile({ 
            name: tempContact.name, 
            contactInfo: { 
                email: tempContact.email || '', 
                phone: tempContact.phone || '', 
                firstName: tempContact.firstName || '', 
                lastName: tempContact.lastName || '',
                dateOfBirth: tempContact.dateOfBirth || ''
            } 
        });
    } else if (section === 'group') {
        updateSection('travelGroup', tempGroup);
    } else if (section === 'location') {
        updateSection('location', tempLocation);
    } else if (section === 'budget') {
        updateSection('budgetPreferences', tempBudget);
    }
    setEditingSection(null);
  };

  const updateMember = (index: number, field: keyof TravelMember, value: any) => {
    const newMembers = [...tempGroup.members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    
    // Auto-update minor status based on age
    if (field === 'age') {
        const age = parseInt(value);
        newMembers[index].isMinor = !isNaN(age) && age < 18;
    }
    
    setTempGroup({ ...tempGroup, members: newMembers });
  };

  const updateSchoolInfo = (index: number, value: string) => {
    const newMembers = [...tempGroup.members];
    newMembers[index] = { 
        ...newMembers[index], 
        schoolInfo: { schoolName: value } 
    };
    setTempGroup({ ...tempGroup, members: newMembers });
  };

  const addMember = () => {
    setTempGroup({
        ...tempGroup,
        members: [...tempGroup.members, { name: 'New Traveler', age: 30, isMinor: false }]
    });
  };

  const removeMember = (index: number) => {
    const newMembers = tempGroup.members.filter((_, i) => i !== index);
    setTempGroup({ ...tempGroup, members: newMembers });
  };

  return (
    <AppLayout>
      <div className="space-y-8 pb-10 max-w-5xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-serif font-bold">Your Travel Profile</h1>
          <div className="flex justify-between items-start">
            <p className="text-muted-foreground">Manage your preferences and travel settings.</p>
            <Link href="/onboarding">
                <Button variant="outline" size="sm" className="hidden md:flex">
                    <Mic className="w-4 h-4 mr-2" />
                    Open Voice Builder
                </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identity Card */}
          <Card className="col-span-1 md:col-span-2 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between">
               <div className="flex flex-row items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                        {profile.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                        <CardTitle className="text-2xl">Identity & Contact</CardTitle>
                        <CardDescription>Personal details and contact information</CardDescription>
                    </div>
               </div>
               {editingSection !== 'identity' && (
                   <Button variant="ghost" size="icon" onClick={() => handleEdit('identity')}>
                       <Pencil className="w-4 h-4" />
                   </Button>
               )}
            </CardHeader>
            <CardContent>
                {editingSection === 'identity' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input 
                                value={tempContact.name} 
                                onChange={(e) => setTempContact({...tempContact, name: e.target.value})} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input 
                                value={tempContact.email || ''} 
                                onChange={(e) => setTempContact({...tempContact, email: e.target.value})} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input 
                                value={tempContact.phone || ''} 
                                onChange={(e) => setTempContact({...tempContact, phone: e.target.value})} 
                            />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Name</p>
                            <p className="text-lg font-semibold">{profile.name || 'Not set'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Email</p>
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span>{profile.contactInfo?.email || 'Not set'}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Phone</p>
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <span>{profile.contactInfo?.phone || 'Not set'}</span>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
            {editingSection === 'identity' && (
                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                    <Button variant="ghost" onClick={() => setEditingSection(null)}>Cancel</Button>
                    <Button onClick={() => handleSave('identity')}>Save Changes</Button>
                </CardFooter>
            )}
          </Card>

          {/* Travel Group */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-primary" /> Travel Group
              </CardTitle>
              {editingSection !== 'group' && (
                   <Button variant="ghost" size="icon" onClick={() => handleEdit('group')}>
                       <Pencil className="w-4 h-4" />
                   </Button>
               )}
            </CardHeader>
            <CardContent>
              {editingSection === 'group' ? (
                  <div className="space-y-4">
                      <div className="space-y-2">
                          <Label>Group Type</Label>
                          <Select 
                            value={tempGroup.type} 
                            onValueChange={(val: any) => setTempGroup({...tempGroup, type: val})}
                          >
                              <SelectTrigger>
                                  <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="solo">Solo</SelectItem>
                                  <SelectItem value="partner">Partner</SelectItem>
                                  <SelectItem value="family">Family</SelectItem>
                                  <SelectItem value="group">Group</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>

                      <div className="space-y-3">
                          <Label>Members</Label>
                          {tempGroup.members.map((member, idx) => (
                              <div key={idx} className="p-3 border rounded-lg space-y-3 bg-muted/30 relative">
                                  <div className="absolute right-2 top-2">
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeMember(idx)}>
                                          <Trash2 className="w-3 h-3" />
                                      </Button>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                      <div className="col-span-2 space-y-1">
                                          <Label className="text-xs">Name</Label>
                                          <Input 
                                            value={member.name} 
                                            onChange={(e) => updateMember(idx, 'name', e.target.value)}
                                            className="h-8"
                                          />
                                      </div>
                                      <div className="space-y-1">
                                          <Label className="text-xs">Age</Label>
                                          <Input 
                                            type="number"
                                            value={member.age} 
                                            onChange={(e) => updateMember(idx, 'age', e.target.value)}
                                            className="h-8"
                                          />
                                      </div>
                                  </div>
                                  
                                  {/* School Field - Visible for Minors */}
                                  {member.age < 18 && (
                                      <div className="space-y-1 bg-amber-50 p-2 rounded border border-amber-100">
                                          <Label className="text-xs text-amber-800 flex items-center gap-1">
                                              School Name <span className="text-[10px] uppercase bg-amber-200 text-amber-900 px-1 rounded">Minor</span>
                                          </Label>
                                          <Input 
                                            value={member.schoolInfo?.schoolName || ''}
                                            onChange={(e) => updateSchoolInfo(idx, e.target.value)}
                                            placeholder="Enter school name"
                                            className="h-8 bg-white"
                                          />
                                      </div>
                                  )}
                              </div>
                          ))}
                          <Button variant="outline" size="sm" className="w-full" onClick={addMember}>
                              <Plus className="w-3 h-3 mr-2" /> Add Traveler
                          </Button>
                      </div>
                  </div>
              ) : (
                profile.travelGroup ? (
                    <div className="space-y-3">
                       <Badge variant="secondary" className="uppercase">{profile.travelGroup.type}</Badge>
                       <div className="space-y-2">
                          {profile.travelGroup.members.map((m, i) => (
                            <div key={i} className="flex flex-col text-sm border-b border-border/50 pb-2 last:border-0">
                               <div className="flex justify-between items-center">
                                   <span className="font-medium">{m.name}</span>
                                   <span className="text-muted-foreground">{m.age} yrs</span>
                               </div>
                               {m.isMinor && m.schoolInfo?.schoolName && (
                                   <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                       <span className="font-semibold">School:</span> {m.schoolInfo.schoolName}
                                   </div>
                               )}
                            </div>
                          ))}
                       </div>
                    </div>
                  ) : <span className="text-muted-foreground italic">Not specified</span>
              )}
            </CardContent>
            {editingSection === 'group' && (
                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                    <Button variant="ghost" onClick={() => setEditingSection(null)}>Cancel</Button>
                    <Button onClick={() => handleSave('group')}>Save</Button>
                </CardFooter>
            )}
          </Card>

          {/* Location & Terminals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-primary" /> Location & Hubs
              </CardTitle>
              {editingSection !== 'location' && (
                   <Button variant="ghost" size="icon" onClick={() => handleEdit('location')}>
                       <Pencil className="w-4 h-4" />
                   </Button>
               )}
            </CardHeader>
            <CardContent>
               {editingSection === 'location' ? (
                   <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                               <Label>City</Label>
                               <Input value={tempLocation.city} onChange={(e) => setTempLocation({...tempLocation, city: e.target.value})} />
                           </div>
                           <div className="space-y-2">
                               <Label>State</Label>
                               <Input value={tempLocation.state} onChange={(e) => setTempLocation({...tempLocation, state: e.target.value})} />
                           </div>
                       </div>
                       <div className="space-y-2">
                           <Label>Zip Code</Label>
                           <Input value={tempLocation.zipCode} onChange={(e) => setTempLocation({...tempLocation, zipCode: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                           <Label>Preferred Airports (comma separated)</Label>
                           <Input 
                                value={tempLocation.preferredAirports.join(', ')} 
                                onChange={(e) => setTempLocation({...tempLocation, preferredAirports: e.target.value.split(',').map(s => s.trim())})} 
                            />
                       </div>
                   </div>
               ) : (
                   profile.location ? (
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
                   ) : <span className="text-muted-foreground italic">Not specified</span>
               )}
            </CardContent>
            {editingSection === 'location' && (
                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                    <Button variant="ghost" onClick={() => setEditingSection(null)}>Cancel</Button>
                    <Button onClick={() => handleSave('location')}>Save</Button>
                </CardFooter>
            )}
          </Card>

          {/* Budget Preferences */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="w-5 h-5 text-primary" /> Budget Priorities
              </CardTitle>
              {editingSection !== 'budget' && (
                   <Button variant="ghost" size="icon" onClick={() => handleEdit('budget')}>
                       <Pencil className="w-4 h-4" />
                   </Button>
               )}
            </CardHeader>
            <CardContent>
               {editingSection === 'budget' ? (
                   <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                               <Label>Min Budget</Label>
                               <Input 
                                type="number" 
                                value={tempBudget.budgetRange?.min || 0} 
                                onChange={(e) => setTempBudget({
                                    ...tempBudget, 
                                    budgetRange: { 
                                        min: parseInt(e.target.value), 
                                        max: tempBudget.budgetRange?.max || 0,
                                        currency: 'USD'
                                    }
                                })} 
                               />
                           </div>
                           <div className="space-y-2">
                               <Label>Max Budget</Label>
                               <Input 
                                type="number" 
                                value={tempBudget.budgetRange?.max || 0} 
                                onChange={(e) => setTempBudget({
                                    ...tempBudget, 
                                    budgetRange: { 
                                        min: tempBudget.budgetRange?.min || 0, 
                                        max: parseInt(e.target.value),
                                        currency: 'USD'
                                    }
                                })} 
                               />
                           </div>
                       </div>
                       
                       <div className="space-y-2">
                            <Label>Priorities</Label>
                            {Object.keys(tempBudget.priorityCategories).map((cat) => (
                                <div key={cat} className="flex items-center justify-between">
                                    <span className="capitalize text-sm">{cat}</span>
                                    <Select 
                                        value={tempBudget.priorityCategories[cat as keyof typeof tempBudget.priorityCategories]}
                                        onValueChange={(val: any) => setTempBudget({
                                            ...tempBudget,
                                            priorityCategories: {
                                                ...tempBudget.priorityCategories,
                                                [cat]: val
                                            }
                                        })}
                                    >
                                        <SelectTrigger className="w-[120px] h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                       </div>
                   </div>
               ) : (
                   profile.budgetPreferences ? (
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
                   ) : <span className="text-muted-foreground italic">Not specified</span>
               )}
            </CardContent>
            {editingSection === 'budget' && (
                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                    <Button variant="ghost" onClick={() => setEditingSection(null)}>Cancel</Button>
                    <Button onClick={() => handleSave('budget')}>Save</Button>
                </CardFooter>
            )}
          </Card>

          {/* Upcoming Trips (Read Only / Links) */}
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
                       <Link key={i} href={`/trip/${i}`}>
                           <div className="p-4 rounded-lg border border-border bg-card shadow-sm flex flex-col gap-2 hover:border-primary/50 transition-colors cursor-pointer group">
                              <div className="flex justify-between items-start">
                                 <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{trip.destination}</h4>
                                 <Badge>{trip.purpose}</Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                 <Calendar className="w-4 h-4" />
                                 {trip.timeframe.description}
                              </div>
                           </div>
                       </Link>
                    ))}
                 </div>
               ) : <span className="text-muted-foreground italic">No upcoming trips planned</span>}
            </CardContent>
          </Card>

           {/* Past Trip Summary (Read Only) */}
           <Card className="col-span-1 md:col-span-2">
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
