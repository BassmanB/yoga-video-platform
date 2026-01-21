/**
 * FilterBar component
 *
 * Provides filtering controls for videos by category and level
 */

import { useFilters } from "../lib/hooks/useFilters";
import type { VideoCategory, VideoLevel } from "../types";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface FilterBarProps {
  initialCategory?: string | null;
  initialLevel?: string | null;
}

export function FilterBar({ initialCategory, initialLevel }: FilterBarProps) {
  const { filters, setCategory, setLevel, clearFilters, hasActiveFilters } = useFilters({
    initialCategory,
    initialLevel,
  });

  const categories: { value: VideoCategory | null; label: string }[] = [
    { value: null, label: "Wszystkie" },
    { value: "yoga", label: "Yoga" },
    { value: "mobility", label: "Mobilność" },
    { value: "calisthenics", label: "Kalistenika" },
  ];

  const levels: { value: VideoLevel | null; label: string }[] = [
    { value: null, label: "Wszystkie poziomy" },
    { value: "beginner", label: "Początkujący" },
    { value: "intermediate", label: "Średniozaawansowany" },
    { value: "advanced", label: "Zaawansowany" },
  ];

  return (
    <div className="mb-10 space-y-5" role="search" aria-label="Filtry wideo">
      {/* Category Pills */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" role="group" aria-label="Filtruj po kategorii">
        {categories.map(({ value, label }) => (
          <Button
            key={value || "all"}
            variant={filters.category === value ? "default" : "outline"}
            onClick={() => setCategory(value)}
            className="whitespace-nowrap font-heading"
            aria-pressed={filters.category === value}
            aria-label={`Filtruj po kategorii: ${label}`}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Level Select + Clear Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <Select
          value={filters.level || "all"}
          onValueChange={(val) => setLevel(val === "all" ? null : (val as VideoLevel))}
        >
          <SelectTrigger className="w-full sm:w-72 font-body" aria-label="Wybierz poziom trudności">
            <SelectValue placeholder="Wybierz poziom" />
          </SelectTrigger>
          <SelectContent>
            {levels.map(({ value, label }) => (
              <SelectItem key={value || "all"} value={value || "all"}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="w-full sm:w-auto font-heading"
            aria-label="Wyczyść wszystkie filtry"
          >
            Wyczyść filtry
          </Button>
        )}
      </div>
    </div>
  );
}
