import { AppLayout } from '@/components/layout/AppLayout';
import { ConversationInterface } from '@/components/onboarding/ConversationInterface';

export default function Onboarding() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-6 h-full">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-serif font-bold text-foreground">Let's get to know you</h1>
          <p className="text-muted-foreground max-w-xl">
            Chat with our AI assistant to build your personalized travel profile. 
            The more you share, the better your trip recommendations will be.
          </p>
        </div>
        
        <ConversationInterface />
      </div>
    </AppLayout>
  );
}
