import { ONBOARDING_QUESTIONS } from "@/lib/onboarding-constants";
import { Check, ChevronLeft, Save, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useProfileStore } from "@/lib/store";

interface ProgressIndicatorProps {
  currentStep: number;
}

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const { setStep, addMessage, setAwaitingConfirmation } = useProfileStore();

  const handleStepClick = (index: number) => {
    // Allow clicking any previous step or the current step to replay/edit
    // We also allow clicking future steps for flexibility in this demo prototype
    if (index === currentStep) return;

    setStep(index);
    setAwaitingConfirmation(false);
    
    // Add a system-like message or just the prompt to indicate context switch
    addMessage({ 
        role: 'assistant', 
        content: ONBOARDING_QUESTIONS[index].prompt,
        type: 'text'
    });
  };

  return (
    <div className="w-full bg-background border-b border-border shadow-sm z-50">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/20">
        <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8 gap-1">
                <ChevronLeft className="w-4 h-4" />
                Save & Exit
            </Button>
        </Link>
        <div className="flex items-center gap-4 text-xs">
             <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary font-medium rounded-full border border-primary/20">
                <MousePointerClick className="w-3.5 h-3.5" />
                Click steps to update
             </span>
            <span className="flex items-center gap-1 text-muted-foreground opacity-70 animate-pulse">
                <Save className="w-3 h-3" />
                Auto-saving
            </span>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="py-4 px-6 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[600px] max-w-4xl mx-auto">
          {ONBOARDING_QUESTIONS.map((q, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            
            return (
              <div 
                key={q.id} 
                className={cn(
                    "flex flex-col items-center gap-2 relative z-10 group cursor-pointer transition-all hover:scale-105 active:scale-95",
                    isCurrent ? "scale-110" : "opacity-80 hover:opacity-100"
                )}
                onClick={() => handleStepClick(idx)}
              >
                <div 
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    isCompleted 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : isCurrent
                        ? "bg-background border-primary text-primary shadow-md ring-2 ring-primary/20"
                        : "bg-muted border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                </div>
                <span 
                  className={cn(
                    "text-xs font-medium whitespace-nowrap transition-colors",
                    isCurrent ? "text-primary font-bold" : "text-muted-foreground"
                  )}
                >
                  {q.label}
                </span>
                
                {/* Connector Line */}
                {idx < ONBOARDING_QUESTIONS.length - 1 && (
                  <div 
                    className={cn(
                      "absolute top-4 left-[50%] w-[calc(100%+2rem)] h-[2px] -z-10",
                      idx < currentStep ? "bg-primary" : "bg-muted"
                    )} 
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
