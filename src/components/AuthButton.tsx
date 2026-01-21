/**
 * AuthButton component
 *
 * Displays authentication state and provides login/logout functionality
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

export function AuthButton() {
  const { user, role, isLoading, signIn, signOut } = useAuth();

  if (isLoading) {
    return <div className="w-24 h-10 bg-slate-800 animate-pulse rounded" />;
  }

  if (!user) {
    return (
      <Button onClick={signIn} variant="default">
        Zaloguj się
      </Button>
    );
  }

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
        <DropdownMenuItem onClick={signOut} className="cursor-pointer">
          Wyloguj się
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
