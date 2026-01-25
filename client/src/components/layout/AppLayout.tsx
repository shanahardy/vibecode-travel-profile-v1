import { Link, useLocation } from "wouter";
import { Compass, User, Map, Settings, PlusCircle, Bell, ChevronDown, LogOut, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfileStore } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { profile } = useProfileStore();
  const { user } = useAuth();

  const userName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : profile.name || "User";
  const userInitials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const userEmail = user?.email || profile.contactInfo?.email || "user@example.com";

  const navItems = [
    { icon: Map, label: "Dashboard", href: "/" },
    { icon: PlusCircle, label: "Plan a Trip", href: "/plan" },
    { icon: User, label: "Travel Profile", href: "/profile" },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-serif font-bold tracking-tight text-primary flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
              <Compass className="w-5 h-5" />
            </span>
            TraveLuxe
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 block",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-muted-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Account Section (Bottom of Sidebar) */}
        <div className="p-4 border-t border-sidebar-border">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-left group" data-testid="button-user-menu">
                        <Avatar className="h-9 w-9 border border-border">
                            <AvatarImage src={user?.profileImageUrl || "https://github.com/shadcn.png"} alt={userName} />
                            <AvatarFallback>{userInitials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-foreground">{userName}</p>
                            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground opacity-50" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{userName}</p>
                            <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/account" className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            <span>Account Settings</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Billing</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Bell className="mr-2 h-4 w-4" />
                        <span>Notifications</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive" asChild>
                        <a href="/api/logout" className="cursor-pointer" data-testid="button-logout">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </a>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background relative">
        <header className="flex h-16 items-center gap-4 border-b bg-background px-6 md:hidden">
            <span className="font-bold text-lg">TraveLuxe</span>
            {/* Mobile Header elements would go here */}
        </header>

        <div className="h-full w-full max-w-6xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
