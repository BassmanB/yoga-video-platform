/**
 * UserMenu component
 *
 * Displays user authentication state in the layout header.
 * For authenticated users, shows avatar dropdown with logout option.
 * For non-authenticated users, shows login button.
 *
 * This component uses client-side auth state management via useAuth hook
 * and communicates with the server-side logout endpoint.
 */

import { useAuth } from "../lib/hooks/useAuth";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { useState } from "react";

export function UserMenu() {
  const { user, role, isLoading, signIn, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // Call server-side logout endpoint to clear session cookies
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Wystąpił błąd podczas wylogowania");
      }

      // Call client-side signOut to clear local auth state
      await signOut();

      toast.success("Wylogowano pomyślnie");

      // Redirect to home page after successful logout
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(error instanceof Error ? error.message : "Nie udało się wylogować");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Loading state
  if (isLoading) {
    return <div className="w-24 h-10 bg-slate-800 animate-pulse rounded" />;
  }

  // Not authenticated - show login button
  if (!user) {
    return (
      <Button onClick={signIn} variant="default">
        Zaloguj się
      </Button>
    );
  }

  // Helper functions for role display
  const getRoleBadgeVariant = (userRole: string | null) => {
    switch (userRole) {
      case "admin":
        return "default";
      case "premium":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (userRole: string | null) => {
    switch (userRole) {
      case "admin":
        return "Admin";
      case "premium":
        return "Premium";
      default:
        return "Free";
    }
  };

  // Authenticated - show user menu dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          aria-label="Menu użytkownika"
        >
          <Avatar>
            <AvatarFallback className="bg-indigo-600 text-white">
              {user.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.email}</p>
            <Badge variant={getRoleBadgeVariant(role)} className="w-fit mt-1 text-xs">
              {getRoleLabel(role)}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="cursor-pointer">
          {isLoggingOut ? "Wylogowywanie..." : "Wyloguj się"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
