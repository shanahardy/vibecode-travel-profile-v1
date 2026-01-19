import { TravelProfile } from './store';

interface AIResponse {
  text: string;
  extractedData?: Partial<TravelProfile>;
}

// Simple heuristic-based mock AI
export async function generateAIResponse(
  userMessage: string,
  currentProfile: TravelProfile
): Promise<AIResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const lowerMsg = userMessage.toLowerCase();
  const extractedData: Partial<TravelProfile> = {};

  // Simple state machine simulation based on what's missing in the profile
  
  // 1. Name
  if (!currentProfile.name) {
    // Very naive name extraction - assumes the user just types their name or "I am X"
    const nameMatch = userMessage.match(/i am ([a-z\s]+)/i) || userMessage.match(/my name is ([a-z\s]+)/i);
    const name = nameMatch ? nameMatch[1] : userMessage;
    
    extractedData.name = name;
    return {
      text: `Nice to meet you, ${name}! Where do you usually fly out of? (Your home airport)`,
      extractedData,
    };
  }

  // 2. Home Airport
  if (!currentProfile.homeAirport) {
    extractedData.homeAirport = userMessage.toUpperCase(); // Assume airport code or city
    return {
      text: "Got it. Now, how would you describe your travel style? (e.g., Adventure, Relaxing, Cultural, Foodie)",
      extractedData,
    };
  }

  // 3. Travel Style
  if (currentProfile.travelStyle.length === 0) {
    const styles = [];
    if (lowerMsg.includes('adventure')) styles.push('Adventure');
    if (lowerMsg.includes('relax')) styles.push('Relaxing');
    if (lowerMsg.includes('culture') || lowerMsg.includes('cultural')) styles.push('Cultural');
    if (lowerMsg.includes('food')) styles.push('Foodie');
    if (lowerMsg.includes('luxury')) styles.push('Luxury');
    if (lowerMsg.includes('budget') || lowerMsg.includes('cheap')) styles.push('Budget-Friendly');
    
    // If we couldn't parse specific keywords, just take the whole input as a tag for now
    if (styles.length === 0) styles.push(userMessage);

    extractedData.travelStyle = styles;
    return {
      text: "That sounds fun! Speaking of budget, would you say you prefer Budget, Moderate, or Luxury trips?",
      extractedData,
    };
  }

  // 4. Budget
  if (!currentProfile.budget) {
    if (lowerMsg.includes('luxury')) extractedData.budget = 'luxury';
    else if (lowerMsg.includes('moderate')) extractedData.budget = 'moderate';
    else extractedData.budget = 'budget';

    return {
      text: "Noted. Who do you usually travel with? (Solo, Partner, Family, Friends)",
      extractedData,
    };
  }

  // 5. Companions
  if (!currentProfile.travelCompanions) {
    extractedData.travelCompanions = userMessage;
    return {
      text: "Almost done! Do you have any dietary restrictions or specific interests I should know about?",
      extractedData,
    };
  }

  // 6. Catch-all / Interests
  if (lowerMsg.includes('vegetarian') || lowerMsg.includes('vegan') || lowerMsg.includes('gluten')) {
     const diet = [];
     if (lowerMsg.includes('vegetarian')) diet.push('Vegetarian');
     if (lowerMsg.includes('vegan')) diet.push('Vegan');
     if (lowerMsg.includes('gluten')) diet.push('Gluten-Free');
     extractedData.dietaryRestrictions = [...currentProfile.dietaryRestrictions, ...diet];
  } else {
     extractedData.interests = [...currentProfile.interests, userMessage];
  }

  return {
    text: "Thanks for sharing! I've updated your profile. You can check the 'Profile' tab to see what I've gathered, or keep chatting to add more details.",
    extractedData,
  };
}
