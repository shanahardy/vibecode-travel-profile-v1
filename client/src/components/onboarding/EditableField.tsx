import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Pencil, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableFieldProps {
  label: string;
  value: string | number;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date';
  inline?: boolean;
  prefix?: string;
  placeholder?: string;
  onSave: (value: any) => void;
}

export function EditableField({ 
  label, 
  value, 
  type = 'text', 
  inline = false, 
  prefix,
  placeholder,
  onSave 
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  // Update temp value when external value changes (e.g. from AI extraction)
  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleSave = () => {
    onSave(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={cn("flex flex-col gap-1", inline ? "flex-1" : "w-full")}>
        <label className="text-xs text-muted-foreground font-medium ml-1">{label}</label>
        <div className="flex items-center gap-1">
          {prefix && <span className="text-sm font-medium text-muted-foreground">{prefix}</span>}
          <Input
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            type={type}
            className="h-8 text-sm"
            autoFocus
            placeholder={placeholder}
          />
          <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" onClick={handleSave}>
            <Check className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("group flex flex-col gap-1", inline ? "flex-1" : "w-full")}>
      <label className="text-xs text-muted-foreground font-medium ml-1">{label}</label>
      <div 
        className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer border border-transparent hover:border-border transition-all"
        onClick={() => setIsEditing(true)}
      >
        <div className="flex items-center gap-1 text-sm font-medium truncate">
          {prefix && <span className="text-muted-foreground">{prefix}</span>}
          {value || <span className="text-muted-foreground italic text-xs">{placeholder || 'Empty'}</span>}
        </div>
        <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
