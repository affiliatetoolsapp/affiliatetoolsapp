
import * as React from "react";
import { X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface TagInputProps {
  placeholder?: string;
  tags: string[];
  suggestions: string[];
  onTagsChange: (tags: string[]) => void;
  variant?: "default" | "negative";
  className?: string;
  disabled?: boolean;
  maxItems?: number;
}

export function TagInput({
  placeholder = "Add item...",
  tags,
  suggestions,
  onTagsChange,
  variant = "default",
  className,
  disabled = false,
  maxItems,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleRemoveTag = (tag: string) => {
    onTagsChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue) {
      e.preventDefault();
      if (!tags.includes(inputValue) && (!maxItems || tags.length < maxItems)) {
        onTagsChange([...tags, inputValue]);
        setInputValue("");
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      onTagsChange(tags.slice(0, -1));
    }
  };

  const filteredSuggestions = suggestions.filter(
    (suggestion) => 
      !tags.includes(suggestion) && 
      suggestion.toLowerCase().includes(inputValue.toLowerCase())
  );

  const selectSuggestion = (suggestion: string) => {
    if (!tags.includes(suggestion) && (!maxItems || tags.length < maxItems)) {
      onTagsChange([...tags, suggestion]);
      setInputValue("");
      setOpen(false);
      inputRef.current?.focus();
    }
  };

  const badgeVariant = variant === "negative" ? "destructive" : "secondary";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Tags displayed above the input */}
      <div className="flex flex-wrap gap-2 w-full">
        {tags.map((tag) => (
          <Badge 
            key={tag} 
            variant={badgeVariant}
            className="flex items-center gap-1 px-3 py-1"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-offset-1"
                onClick={() => handleRemoveTag(tag)}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>
      
      {/* Input box below the tags */}
      {(!maxItems || tags.length < maxItems) && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="w-full">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                placeholder={placeholder}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setOpen(true)}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput
                placeholder={`Search ${placeholder.toLowerCase()}...`}
                value={inputValue}
                onValueChange={setInputValue}
              />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {filteredSuggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion}
                      value={suggestion}
                      onSelect={() => selectSuggestion(suggestion)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          tags.includes(suggestion) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {suggestion}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
