import { AppLayout } from '@/components/layout/AppLayout';
import { ConversationPanel } from '@/components/onboarding/ConversationPanel';
import { ProfileDataPanel } from '@/components/onboarding/ProfileDataPanel';
import { ProgressIndicator } from '@/components/onboarding/ProgressIndicator';
import { useProfileStore } from '@/lib/store';

export default function Onboarding() {
  const { currentStep } = useProfileStore();

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
        {/* Top Navigation / Progress */}
        <ProgressIndicator currentStep={currentStep} />
        
        <div className="flex-1 flex overflow-hidden">
            {/* Left Panel: Conversation */}
            <div className="flex-1 flex flex-col min-w-0">
                <ConversationPanel />
            </div>

            {/* Right Panel: Extracted Data Sidebar */}
            <div className="w-[400px] border-l border-sidebar-border bg-sidebar hidden lg:block overflow-hidden">
                <ProfileDataPanel currentStep={currentStep} />
            </div>
        </div>
    </div>
  );
}
