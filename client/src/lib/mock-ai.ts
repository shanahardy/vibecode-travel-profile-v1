import { TravelProfile, ContactInfo, TravelGroup, LocationInfo, Trip, PastTrip, BudgetPreferences } from './store';
import { ONBOARDING_QUESTIONS } from './onboarding-constants';

interface AIResponse {
  text: string;
  extractedData?: Partial<TravelProfile>;
  type?: 'text' | 'confirmation' | 'followup' | 'completion';
  requiresConfirmation?: boolean;
}

// Helper to detect done signals
export const detectDoneSignal = (input: string): boolean => {
  const doneSignals = [
    /i'?m done/i,
    /that'?s it/i,
    /finished/i,
    /that'?s all/i,
    /nothing else/i,
    /that'?s everything/i
  ];
  return doneSignals.some(pattern => pattern.test(input));
};

// Extraction Logic
const extractContactInfo = (input: string): ContactInfo => {
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
  const phoneRegex = /(\d{3}[-.\s]??\d{3}[-.\s]??\d{4}|\(\d{3}\)\s*\d{3}[-.\s]??\d{4})/;
  // Supports: Jan 15 1985, 15 Jan 1985, 01/15/1985
  const dateRegex = /(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[a-z]*\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}/i;
  
  return {
    email: input.match(emailRegex)?.[0] || '',
    phone: input.match(phoneRegex)?.[0] || '',
    dateOfBirth: input.match(dateRegex)?.[0] || ''
  };
};

const extractTravelGroup = (input: string): TravelGroup => {
  const members: any[] = [];
  const agePattern = /(\w+)\s+(?:is|who is)\s+(\d+)/gi;
  let match;
  
  while ((match = agePattern.exec(input)) !== null) {
    members.push({
      name: match[1],
      age: parseInt(match[2]),
      isMinor: parseInt(match[2]) < 18
    });
  }

  // Determine type
  let type: TravelGroup['type'] = 'group';
  if (input.match(/just me|myself|solo/i)) type = 'solo';
  else if (input.match(/wife|husband|partner/i) && members.length <= 2) type = 'partner';
  else if (input.match(/family|kids|children/i)) type = 'family';

  return { type, members };
};

const extractLocation = (input: string): LocationInfo => {
  // Supports: Portland, OR; Portland OR; Portland, Oregon
  const cityStatePattern = /([A-Z][a-zA-Z\s]+)(?:,\s*|\s+)([A-Z]{2}|[A-Z][a-z]+)/;
  const zipPattern = /\b\d{5}\b/;
  const airportCodes = input.match(/\b[A-Z]{3}\b/g) || [];
  
  const cityStateMatch = input.match(cityStatePattern);

  const terminals = [];
  if (input.match(/train|station|amtrak/i)) terminals.push({ type: 'train', name: 'Train Station' });
  if (input.match(/bus|greyhound/i)) terminals.push({ type: 'bus', name: 'Bus Terminal' });

  return {
    city: cityStateMatch?.[1]?.trim() || '',
    state: cityStateMatch?.[2] || '',
    zipCode: input.match(zipPattern)?.[0] || '',
    preferredAirports: airportCodes,
    preferredTerminals: terminals
  };
};

const extractUpcomingTrips = (input: string): Trip[] => {
  const trips: Trip[] = [];
  const locationPattern = /(?:to|in|visiting)\s+([A-Z][a-zA-Z\s]+?)(?:\s+(?:for|in|during|sometime))/gi;
  
  let match;
  while ((match = locationPattern.exec(input)) !== null) {
    let purpose: Trip['purpose'] = 'vacation';
    if (input.match(/business/i)) purpose = 'business';
    if (input.match(/family/i)) purpose = 'family';

    let timeframe = 'Next year';
    if (input.match(/summer/i)) timeframe = 'Summer';
    if (input.match(/winter/i)) timeframe = 'Winter';
    const monthMatch = input.match(/(?:january|february|march|april|may|june|july|august|september|october|november|december)/i);
    if (monthMatch) timeframe = monthMatch[0];

    trips.push({
      destination: match[1].trim(),
      timeframe: { type: 'approximate', description: timeframe },
      purpose,
      notes: ''
    });
  }
  return trips;
};

const extractPastTrip = (input: string): PastTrip => {
  const likes = [];
  if (input.match(/loved|liked|enjoyed|great/i)) likes.push('The experience'); // Simplified
  
  const dislikes = [];
  if (input.match(/didn't like|hated|bad|crowded/i)) dislikes.push('Crowds/Wait times'); // Simplified

  const specialNeeds = [];
  if (input.match(/stroller|wheelchair/i)) specialNeeds.push('Mobility assistance');
  if (input.match(/allergy|dietary|vegan/i)) specialNeeds.push('Dietary restrictions');

  return {
    destination: 'Last Trip', // Simplified extraction
    date: 'Recently',
    likes,
    dislikes,
    specialNeeds,
    summary: input
  };
};

const extractBudgetPreferences = (input: string): BudgetPreferences => {
  const priorities: BudgetPreferences['priorityCategories'] = {
    flights: 'medium',
    lodging: 'medium',
    food: 'medium',
    activities: 'medium'
  };

  if (input.match(/economy|cheap flight|basic/i)) priorities.flights = 'low';
  if (input.match(/nice hotel|luxury|resort/i)) priorities.lodging = 'high';
  if (input.match(/splurge on food|fine dining/i)) priorities.food = 'high';

  const rangePattern = /\$?([\d,]+)\s*(?:to|-)\s*\$?([\d,]+)/;
  const rangeMatch = input.match(rangePattern);
  
  let budgetRange;
  if (rangeMatch) {
    budgetRange = {
      min: parseInt(rangeMatch[1].replace(/,/g, '')),
      max: parseInt(rangeMatch[2].replace(/,/g, '')),
      currency: 'USD'
    };
  }

  return {
    priorityCategories: priorities,
    budgetRange,
    notes: input
  };
};

// Main Handler
export async function handleOnboardingStep(
  userMessage: string,
  currentStep: number,
  isAwaitingConfirmation: boolean,
  profile: TravelProfile
): Promise<AIResponse> {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const question = ONBOARDING_QUESTIONS[currentStep];

  // 1. Handle Confirmation Response
  if (isAwaitingConfirmation) {
    if (userMessage.match(/yes|correct|right|yep|sure/i)) {
      const nextStep = currentStep + 1;
      if (nextStep < ONBOARDING_QUESTIONS.length) {
        return {
          text: ONBOARDING_QUESTIONS[nextStep].prompt,
          type: 'text'
        };
      } else {
        return {
          text: "Excellent! Your travel profile is complete. Ready to start planning your next adventure?",
          type: 'completion'
        };
      }
    }
    // If it's not a confirmation (e.g. "No", "Actually...", or corrections), 
    // we fall through to the extraction logic to re-process the input as a correction.
  }

  // 2. Extract Data based on Step
  let extractedData: Partial<TravelProfile> = {};
  let confirmationText = "";

  switch (question.id) {
    case 'contactInfo': {
      const info = extractContactInfo(userMessage);
      // Merge with existing profile data to allow partial corrections
      const mergedInfo = {
        email: info.email || profile.contactInfo?.email || '',
        phone: info.phone || profile.contactInfo?.phone || '',
        dateOfBirth: info.dateOfBirth || profile.contactInfo?.dateOfBirth || ''
      };
      
      extractedData = { contactInfo: mergedInfo, name: profile.name || mergedInfo.email.split('@')[0] }; 
      confirmationText = `I've got the following:\n- Email: ${mergedInfo.email || '(missing)'}\n- Phone: ${mergedInfo.phone || '(missing)'}\n- DOB: ${mergedInfo.dateOfBirth || '(missing)'}\n\nIs that correct?`;
      break;
    }
    case 'travelGroup': {
      const group = extractTravelGroup(userMessage);
      // For groups, we typically replace unless we implement complex merging. 
      // For now, if the extraction found members, we use them.
      // If the user says "I'm done", we might not extract members but we shouldn't overwrite with empty if we already have data.
      
      const hasNewMembers = group.members.length > 0;
      const isDone = detectDoneSignal(userMessage);
      
      let finalGroup = group;
      if (!hasNewMembers && profile.travelGroup && isDone) {
          finalGroup = profile.travelGroup;
      }
      
      extractedData = { travelGroup: finalGroup };
      const memberNames = finalGroup.members.map(m => `${m.name} (${m.age})`).join(', ');
      confirmationText = `I have the following group members: ${memberNames || 'Just you'}. Is that correct?`;
      
      // Check for minors followup
      if (finalGroup.members.some(m => m.isMinor)) {
        confirmationText += "\n\nAlso, for the children, can you let me know about their school district? Or say 'Disregard'.";
      }
      break;
    }
    case 'location': {
      const loc = extractLocation(userMessage);
      const mergedLoc = {
          city: loc.city || profile.location?.city || '',
          state: loc.state || profile.location?.state || '',
          zipCode: loc.zipCode || profile.location?.zipCode || '',
          preferredAirports: loc.preferredAirports.length > 0 ? loc.preferredAirports : (profile.location?.preferredAirports || []),
          preferredTerminals: loc.preferredTerminals.length > 0 ? loc.preferredTerminals : (profile.location?.preferredTerminals || [])
      };

      extractedData = { location: mergedLoc, homeAirport: mergedLoc.preferredAirports[0] || profile.homeAirport };
      confirmationText = `I've got your location as ${mergedLoc.city}, ${mergedLoc.state} (${mergedLoc.zipCode}) with preferred airport ${mergedLoc.preferredAirports.join(', ') || 'None'}. Is that right?`;
      break;
    }
    case 'upcomingTrips': {
      const trips = extractUpcomingTrips(userMessage);
      extractedData = { upcomingTrips: trips };
      confirmationText = `I've noted ${trips.length} upcoming trips. Is that everything?`;
      break;
    }
    case 'pastTrips': {
      const past = extractPastTrip(userMessage);
      extractedData = { pastTrips: [past] };
      confirmationText = `So your last trip had some ups and downs. I've noted your preferences. Is that accurate?`;
      break;
    }
    case 'budgetPreferences': {
      const budget = extractBudgetPreferences(userMessage);
      extractedData = { budgetPreferences: budget };
      confirmationText = `Based on what you shared, I've updated your budget priorities. Does that look right?`;
      break;
    }
  }

  return {
    text: confirmationText,
    extractedData,
    requiresConfirmation: true,
    type: 'confirmation'
  };
}
