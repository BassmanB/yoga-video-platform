/**
 * VideoDescription Component
 *
 * Displays video description with expand/collapse functionality for long text
 */

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoDescriptionProps {
  description: string | null;
  className?: string;
}

const MAX_HEIGHT = 300; // pixels

export function VideoDescription({ description, className = "" }: VideoDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Check if content exceeds max height
  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      setShowExpandButton(height > MAX_HEIGHT);
    }
  }, [description]);

  if (!description || description.trim() === "") {
    return (
      <div className={`text-slate-400 ${className}`}>
        <p className="text-sm italic">Brak opisu dla tego nagrania.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Description content */}
      <div className="relative">
        <div
          ref={contentRef}
          className={`overflow-hidden text-base leading-relaxed text-slate-300 transition-all duration-300 ${
            isExpanded ? "" : "line-clamp-none"
          }`}
          style={{
            maxHeight: isExpanded ? "none" : `${MAX_HEIGHT}px`,
          }}
        >
          {description.split("\n").map((paragraph, index) => (
            <p key={index} className="mb-3 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Gradient fade-out when collapsed */}
        {!isExpanded && showExpandButton && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-900 to-transparent" />
        )}
      </div>

      {/* Expand/Collapse button */}
      {showExpandButton && (
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="ghost"
          size="sm"
          className="gap-1 text-slate-400 hover:text-white"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Zwiń
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Rozwiń
            </>
          )}
        </Button>
      )}
    </div>
  );
}
