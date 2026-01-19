import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ExtractedDataCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  isActive?: boolean;
}

export function ExtractedDataCard({ title, icon, children, isActive }: ExtractedDataCardProps) {
  return (
    <motion.div
      initial={false}
      animate={{ 
        opacity: isActive ? 1 : 0.7, 
        scale: isActive ? 1.02 : 1,
        borderColor: isActive ? 'var(--primary)' : 'transparent'
      }}
      transition={{ duration: 0.3 }}
      className="mb-4"
    >
      <Card className={cn(
        "border overflow-hidden transition-colors duration-300",
        isActive ? "border-primary shadow-md bg-card" : "border-border/40 bg-card/50"
      )}>
        <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/40 flex flex-row items-center gap-2">
          <div className={cn("p-1.5 rounded-md", isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
            {icon}
          </div>
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}
