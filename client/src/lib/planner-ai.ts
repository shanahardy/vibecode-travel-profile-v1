import { Message } from './store';

interface PlannerResponse {
  text: string;
  type: 'text' | 'confirmation' | 'followup' | 'completion';
}

const PLANNING_INTENTS = [
  { keywords: ['flight', 'fly', 'airline', 'ticket'], topic: 'flights' },
  { keywords: ['hotel', 'stay', 'room', 'airbnb', 'resort'], topic: 'lodging' },
  { keywords: ['food', 'eat', 'restaurant', 'dinner', 'lunch', 'breakfast'], topic: 'dining' },
  { keywords: ['do', 'see', 'visit', 'activity', 'tour'], topic: 'activities' },
];

export async function handlePlannerMessage(
  userMessage: string, 
  tripDestination: string
): Promise<PlannerResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const lowerMsg = userMessage.toLowerCase();
  
  // 1. Detect Intent
  const matchedIntent = PLANNING_INTENTS.find(intent => 
    intent.keywords.some(k => lowerMsg.includes(k))
  );

  // 2. Generate Contextual Response
  if (matchedIntent) {
    switch (matchedIntent.topic) {
      case 'flights':
        return {
          text: `I can help you find flights to ${tripDestination}. Do you have preferred airlines or specific times you'd like to fly?`,
          type: 'text'
        };
      case 'lodging':
        return {
          text: `For ${tripDestination}, are you looking for a luxury hotel, a boutique stay, or something more budget-friendly?`,
          type: 'text'
        };
      case 'dining':
        return {
          text: `${tripDestination} has great food scenes! Are you interested in fine dining, local street food, or family-friendly spots?`,
          type: 'text'
        };
      case 'activities':
        return {
          text: `There's a lot to do in ${tripDestination}. I can suggest museums, outdoor adventures, or relaxing spots. what's your vibe?`,
          type: 'text'
        };
    }
  }

  // Default / General Conversation
  if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
    return {
      text: `Hello! I'm your dedicated planner for ${tripDestination}. What should we tackle first: flights, hotels, or activities?`,
      type: 'text'
    };
  }

  return {
    text: `I've noted that for your ${tripDestination} trip. I can help organize that into your itinerary. Anything else specific you want to add?`,
    type: 'text'
  };
}