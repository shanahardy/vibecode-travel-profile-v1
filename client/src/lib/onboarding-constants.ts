export const ONBOARDING_QUESTIONS = [
  {
    id: 'contactInfo',
    step: 1,
    label: 'Contact',
    prompt: "Welcome! Let's start building your travel profile. First, I need to confirm your primary contact details. Please share your first and last name, phone number, email address, and date of birth. This information will be used to populate your bookings."
  },
  {
    id: 'travelGroup',
    step: 2,
    label: 'Travel Group',
    prompt: "Tell me about your primary travel group. Is it just yourself, with a partner, or family? Please let me know the name and age of each person, including children. Don't worry, we'll build out details as we go. Let me know when you're done with your description by simply saying something like 'I'm done', 'Finished', or 'That's it'.",
    isOpenEnded: true
  },
  {
    id: 'location',
    step: 3,
    label: 'Location',
    prompt: "Tell me about where you live by sharing your City, State, and Zip Code. You can also give me your full address if you'd like. What airports or travel terminals do you usually travel from?"
  },
  {
    id: 'upcomingTrips',
    step: 4,
    label: 'Upcoming Trips',
    prompt: "Do you have any trips you'll be planning in the next year, or would like to plan? If yes, let me know when and where and the nature of the trip (business, family vacation, etc.), or give me an idea of what you had in mind if you're not sure."
  },
  {
    id: 'pastTrips',
    step: 5,
    label: 'Last Trip',
    prompt: "Tell me a little about your last trip or vacation. Where did you go, what did you like and not like about it? Did you have any special needs based on yourself or others you were traveling with?"
  },
  {
    id: 'budgetPreferences',
    step: 6,
    label: 'Budget',
    prompt: "Tell me about your budget requirements and spending preferences. Do you prefer cheaper airline seats but more budget for lodging and food? What are your priorities spending-wise? If you have a specific budget number range, please share."
  }
];
