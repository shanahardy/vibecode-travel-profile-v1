import { useProfileStore, TravelProfile, TravelGroup } from '@/lib/store';
import { ExtractedDataCard } from './ExtractedDataCard';
import { EditableField } from './EditableField';
import { User, Users, MapPin, Calendar, Map, DollarSign, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Helper to determine group type based on composition
const determineGroupType = (members: any[]): TravelGroup['type'] => {
  if (members.length === 1) return 'solo';
  
  const hasMinors = members.some(m => m.isMinor || m.age < 18);
  if (hasMinors) return 'family';
  
  const adults = members.filter(m => !m.isMinor && m.age >= 18);
  if (adults.length === 2 && members.length === 2) return 'partner';
  
  return 'group';
};

interface ProfileDataPanelProps {
  currentStep: number;
}

export function ProfileDataPanel({ currentStep }: ProfileDataPanelProps) {
  const { profile, updateSection } = useProfileStore();

  const handleMemberUpdate = (idx: number, field: string, value: any) => {
    if (!profile.travelGroup) return;
    const newMembers = [...profile.travelGroup.members];
    
    // Update the field
    newMembers[idx] = { ...newMembers[idx], [field]: value };
    
    // Recalculate isMinor if age changed
    if (field === 'age') {
        const age = parseInt(value);
        newMembers[idx].isMinor = age < 18;
        // If no longer minor, remove school info
        if (!newMembers[idx].isMinor) {
            newMembers[idx].schoolInfo = undefined;
        }
    }

    // Update group type based on new composition
    const newType = determineGroupType(newMembers);

    updateSection('travelGroup', { 
        ...profile.travelGroup, 
        members: newMembers,
        type: newType
    });
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
        {(currentStep >= 0) && (
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
        {(currentStep >= 1) && (
           <ExtractedDataCard 
             title="Travel Group" 
             icon={<Users className="w-4 h-4" />}
             isActive={currentStep === 1}
           >
             <div className="mb-2">
                <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">{profile.travelGroup?.type || 'Not Set'}</Badge>
             </div>
             {profile.travelGroup?.members.map((member, idx) => (
                <div key={idx} className="bg-muted/40 p-2 rounded-lg mb-2 text-sm border border-border/50 group relative">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                            const newMembers = profile.travelGroup?.members.filter((_, i) => i !== idx) || [];
                            const newType = determineGroupType(newMembers);
                            updateSection('travelGroup', { ...(profile.travelGroup || { type: 'group' }), members: newMembers, type: newType });
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                  </div>
                  <div className="flex gap-2 pr-6">
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
             {(!profile.travelGroup?.members.length) && (
                <div className="text-xs text-muted-foreground italic p-2">
                    No members added. 
                </div>
             )}
             <Button variant="outline" size="sm" className="w-full border-dashed text-muted-foreground mt-2" onClick={() => {
                const newMembers = [...(profile.travelGroup?.members || []), { name: 'New Member', age: 30, isMinor: false }];
                const newType = determineGroupType(newMembers);
                updateSection('travelGroup', { ...(profile.travelGroup || { type: 'group' }), members: newMembers, type: newType });
             }}>
                <Plus className="w-3 h-3 mr-2" /> Add Member
             </Button>
           </ExtractedDataCard>
        )}

        {/* Step 3: Location */}
        {(currentStep >= 2) && (
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
               <div className="flex flex-wrap gap-1 mt-1 mb-2">
                 {profile.location?.preferredAirports.map((code, idx) => (
                    <Badge key={idx} variant="outline" className="font-mono flex items-center gap-1">
                        {code}
                        <Trash2 className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => {
                            const newAirports = profile.location?.preferredAirports.filter((_, i) => i !== idx) || [];
                            updateSection('location', { ...profile.location, preferredAirports: newAirports });
                        }} />
                    </Badge>
                 ))}
                 {(!profile.location?.preferredAirports.length) && <span className="text-xs text-muted-foreground italic">None</span>}
               </div>
               <div className="flex gap-1">
                   <EditableField 
                     label="" 
                     value="" 
                     placeholder="Add Airport (e.g. SFO)" 
                     onSave={(val) => {
                        if (val && val.length >= 3) {
                            const newAirports = [...(profile.location?.preferredAirports || []), val.toUpperCase()];
                            updateSection('location', { ...profile.location, preferredAirports: newAirports });
                        }
                     }} 
                   />
               </div>
            </div>
          </ExtractedDataCard>
        )}

        {/* Step 4: Upcoming Trips */}
        {(currentStep >= 3) && (
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
              <Button variant="outline" size="sm" className="w-full border-dashed text-muted-foreground" onClick={() => {
                  const newTrips = [...(profile.upcomingTrips || []), { destination: 'New Trip', timeframe: { type: 'approximate', description: 'TBD' }, purpose: 'vacation', notes: '' }];
                  updateSection('upcomingTrips', newTrips);
              }}>
                <Plus className="w-3 h-3 mr-2" /> Add Trip
              </Button>
           </ExtractedDataCard>
        )}

        {/* Step 5: Past Trips (Last Trip) */}
        {(currentStep >= 4) && (
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
        {(currentStep >= 5) && (
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
                 {!profile.budgetPreferences && <span className="text-xs text-muted-foreground italic">No budget set</span>}
              </div>
           </ExtractedDataCard>
        )}
      </div>
    </div>
  );
}
