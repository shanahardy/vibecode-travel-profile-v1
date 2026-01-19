import { useProfileStore, TravelProfile } from '@/lib/store';
import { ExtractedDataCard } from './ExtractedDataCard';
import { EditableField } from './EditableField';
import { User, Users, MapPin, Calendar, Map, DollarSign, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProfileDataPanelProps {
  currentStep: number;
}

export function ProfileDataPanel({ currentStep }: ProfileDataPanelProps) {
  const { profile, updateSection } = useProfileStore();

  const handleMemberUpdate = (idx: number, field: string, value: any) => {
    if (!profile.travelGroup) return;
    const newMembers = [...profile.travelGroup.members];
    newMembers[idx] = { ...newMembers[idx], [field]: value };
    updateSection('travelGroup', { ...profile.travelGroup, members: newMembers });
  };

  const handleTripUpdate = (idx: number, field: string, value: any) => {
    if (!profile.upcomingTrips) return;
    const newTrips = [...profile.upcomingTrips];
    newTrips[idx] = { ...newTrips[idx], [field]: value };
    updateSection('upcomingTrips', newTrips);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h2 className="text-lg font-bold font-serif">Your Profile</h2>
        <p className="text-xs text-muted-foreground">Extracted from conversation</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Step 1: Contact Info */}
        {(profile.contactInfo || currentStep === 0) && (
          <ExtractedDataCard 
            title="Contact Information" 
            icon={<User className="w-4 h-4" />}
            isActive={currentStep === 0}
          >
            <EditableField 
              label="Email" 
              value={profile.contactInfo?.email || ''} 
              onSave={(val) => updateSection('contactInfo', { ...profile.contactInfo, email: val })}
            />
            <EditableField 
              label="Phone" 
              value={profile.contactInfo?.phone || ''} 
              onSave={(val) => updateSection('contactInfo', { ...profile.contactInfo, phone: val })}
            />
            <EditableField 
              label="DOB" 
              value={profile.contactInfo?.dateOfBirth || ''} 
              onSave={(val) => updateSection('contactInfo', { ...profile.contactInfo, dateOfBirth: val })}
            />
          </ExtractedDataCard>
        )}

        {/* Step 2: Travel Group */}
        {(profile.travelGroup || currentStep === 1) && (
           <ExtractedDataCard 
             title="Travel Group" 
             icon={<Users className="w-4 h-4" />}
             isActive={currentStep === 1}
           >
             <div className="mb-2">
                <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">{profile.travelGroup?.type || 'Not Set'}</Badge>
             </div>
             {profile.travelGroup?.members.map((member, idx) => (
                <div key={idx} className="bg-muted/40 p-2 rounded-lg mb-2 text-sm border border-border/50">
                  <div className="flex gap-2">
                     <EditableField 
                        label="Name" 
                        value={member.name} 
                        inline 
                        onSave={(val) => handleMemberUpdate(idx, 'name', val)}
                      />
                      <EditableField 
                        label="Age" 
                        value={member.age} 
                        type="number" 
                        inline 
                        onSave={(val) => handleMemberUpdate(idx, 'age', parseInt(val))}
                      />
                  </div>
                  {member.isMinor && (
                     <div className="mt-2 border-t border-border/50 pt-2">
                        <EditableField 
                          label="School District" 
                          value={member.schoolInfo?.schoolName || ''} 
                          placeholder="Optional"
                          onSave={(val) => handleMemberUpdate(idx, 'schoolInfo', { schoolName: val })}
                        />
                     </div>
                  )}
                </div>
             ))}
           </ExtractedDataCard>
        )}

        {/* Step 3: Location */}
        {(profile.location || currentStep === 2) && (
          <ExtractedDataCard 
            title="Location & Terminals" 
            icon={<MapPin className="w-4 h-4" />}
            isActive={currentStep === 2}
          >
            <EditableField label="City" value={profile.location?.city || ''} onSave={(val) => updateSection('location', { ...profile.location, city: val })} />
            <EditableField label="State" value={profile.location?.state || ''} onSave={(val) => updateSection('location', { ...profile.location, state: val })} />
            <EditableField label="Zip" value={profile.location?.zipCode || ''} onSave={(val) => updateSection('location', { ...profile.location, zipCode: val })} />
            <div className="mt-2">
               <label className="text-xs text-muted-foreground font-medium">Preferred Airports</label>
               <div className="flex flex-wrap gap-1 mt-1">
                 {profile.location?.preferredAirports.map(code => (
                    <Badge key={code} variant="outline" className="font-mono">{code}</Badge>
                 ))}
                 {(!profile.location?.preferredAirports.length) && <span className="text-xs text-muted-foreground italic">None</span>}
               </div>
            </div>
          </ExtractedDataCard>
        )}

        {/* Step 4: Upcoming Trips */}
        {(profile.upcomingTrips || currentStep === 3) && (
           <ExtractedDataCard 
             title="Upcoming Trips" 
             icon={<Calendar className="w-4 h-4" />}
             isActive={currentStep === 3}
           >
              {profile.upcomingTrips?.map((trip, idx) => (
                <div key={idx} className="bg-muted/40 p-2 rounded-lg mb-2 text-sm">
                   <EditableField label="Dest." value={trip.destination} onSave={(val) => handleTripUpdate(idx, 'destination', val)} />
                   <EditableField label="When" value={trip.timeframe.description} onSave={(val) => handleTripUpdate(idx, 'timeframe', { ...trip.timeframe, description: val })} />
                   <div className="mt-2">
                      <Badge variant="outline">{trip.purpose}</Badge>
                   </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full border-dashed text-muted-foreground">
                <Plus className="w-3 h-3 mr-2" /> Add Trip
              </Button>
           </ExtractedDataCard>
        )}

        {/* Step 5: Past Trips (Last Trip) */}
        {(profile.pastTrips || currentStep === 4) && (
           <ExtractedDataCard 
             title="Last Trip Experience" 
             icon={<Map className="w-4 h-4" />}
             isActive={currentStep === 4}
           >
              {profile.pastTrips?.[0] ? (
                 <div className="text-sm space-y-2">
                    <p className="font-medium">{profile.pastTrips[0].summary}</p>
                    {profile.pastTrips[0].specialNeeds.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {profile.pastTrips[0].specialNeeds.map(need => <Badge key={need} variant="destructive" className="opacity-80">{need}</Badge>)}
                      </div>
                    )}
                 </div>
              ) : <span className="text-xs text-muted-foreground italic">No details yet</span>}
           </ExtractedDataCard>
        )}

        {/* Step 6: Budget */}
        {(profile.budgetPreferences || currentStep === 5) && (
           <ExtractedDataCard 
             title="Budget & Priorities" 
             icon={<DollarSign className="w-4 h-4" />}
             isActive={currentStep === 5}
           >
              {profile.budgetPreferences?.budgetRange && (
                <div className="flex items-center gap-2 mb-4 bg-primary/5 p-2 rounded text-primary font-bold justify-center">
                   <span>${profile.budgetPreferences.budgetRange.min}</span>
                   <span>-</span>
                   <span>${profile.budgetPreferences.budgetRange.max}</span>
                </div>
              )}
              
              <div className="space-y-2">
                 {Object.entries(profile.budgetPreferences?.priorityCategories || {}).map(([cat, priority]) => (
                    <div key={cat} className="flex items-center justify-between text-xs">
                       <span className="capitalize">{cat}</span>
                       <Badge variant={priority === 'high' ? 'default' : priority === 'medium' ? 'secondary' : 'outline'}>
                         {priority}
                       </Badge>
                    </div>
                 ))}
              </div>
           </ExtractedDataCard>
        )}
      </div>
    </div>
  );
}
