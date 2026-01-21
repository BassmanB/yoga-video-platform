/**
 * BackButton Component
 *
 * Navigation button that returns to the previous page or home
 */

import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  className?: string;
}

export function BackButton({ className = "" }: BackButtonProps) {
  const handleClick = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // No history, redirect to home
      window.location.href = "/";
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`group mb-6 flex items-center gap-2 text-slate-300 transition-colors hover:text-white ${className}`}
      aria-label="Powrót do poprzedniej strony"
    >
      <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
      <span className="text-sm font-medium">Powrót</span>
    </button>
  );
}
