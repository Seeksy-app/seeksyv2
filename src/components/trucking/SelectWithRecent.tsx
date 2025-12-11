import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock, X, ChevronDown } from "lucide-react";

interface SelectWithRecentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  recentValues: string[];
  options?: string[];
  maxRecent?: number;
  className?: string;
  formatValue?: (value: string) => string;
}

export default function SelectWithRecent({
  value,
  onChange,
  placeholder = "Type or select...",
  recentValues = [],
  options = [],
  maxRecent = 10,
  className,
  formatValue,
}: SelectWithRecentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    if (formatValue) {
      newValue = formatValue(newValue);
    }
    setSearch(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleSelect = (selectedValue: string) => {
    setSearch(selectedValue);
    onChange(selectedValue);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearch("");
    onChange("");
    inputRef.current?.focus();
  };

  // Combine recent values with static options, filtering by search
  const displayedRecent = recentValues
    .filter((v) => v.toLowerCase().includes(search.toLowerCase()))
    .slice(0, maxRecent);

  const displayedOptions = options
    .filter((v) => v.toLowerCase().includes(search.toLowerCase()))
    .filter((v) => !recentValues.includes(v));

  const hasResults = displayedRecent.length > 0 || displayedOptions.length > 0;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={search}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pr-16"
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClear}
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsOpen(!isOpen)}
          >
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
          </Button>
        </div>
      </div>

      {isOpen && hasResults && (
        <div className="absolute z-50 mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {displayedRecent.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5 border-b bg-muted/50">
                <Clock className="h-3 w-3" />
                Recent
              </div>
              {displayedRecent.map((item, idx) => (
                <button
                  key={`recent-${idx}`}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-accent text-sm transition-colors"
                  onClick={() => handleSelect(item)}
                >
                  {item}
                </button>
              ))}
            </>
          )}

          {displayedOptions.length > 0 && (
            <>
              {displayedRecent.length > 0 && <div className="border-t" />}
              {options.length > 0 && displayedRecent.length > 0 && (
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground border-b bg-muted/50">
                  All Options
                </div>
              )}
              {displayedOptions.map((item, idx) => (
                <button
                  key={`option-${idx}`}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-accent text-sm transition-colors"
                  onClick={() => handleSelect(item)}
                >
                  {item}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
