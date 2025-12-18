import { Link, useLocation } from "wouter";
import type { ComponentType } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

import {
  HiAcademicCap,
  HiArrowRightOnRectangle,
  HiBookOpen,
  HiCalendarDays,
  HiChatBubbleLeftRight,
  HiHome,
  HiMap,
} from "react-icons/hi2";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { href: "/", label: "Inicio", icon: HiHome },
  { href: "/consultorio", label: "Consultorio", icon: HiChatBubbleLeftRight },
  { href: "/agenda", label: "Agenda", icon: HiCalendarDays },
  { href: "/diario", label: "Diario", icon: HiBookOpen },
  { href: "/mapa", label: "Mapa", icon: HiMap },
  { href: "/trilhas", label: "Conteudo", icon: HiAcademicCap },
];

function getInitials(fullName: string | null | undefined) {
  const safe = (fullName ?? "").trim();
  if (!safe) return "?";
  const parts = safe.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="px-6 py-5">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-2xl px-3 py-2 bg-sidebar-accent/35 border border-sidebar-border/60 shadow-sm"
        >
          <Logo className="h-8 w-auto max-w-[160px]" />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = location === item.href;
                const IconComponent = item.icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200",
                        isActive
                          ? "bg-sidebar-accent/80 text-sidebar-accent-foreground shadow-sm ring-1 ring-sidebar-border/60"
                          : "hover:bg-sidebar-accent/55"
                      )}
                    >
                      <Link href={item.href}>
                        <span
                          className={cn(
                            "grid h-9 w-9 place-items-center rounded-xl border border-sidebar-border/40 bg-sidebar-accent/40 text-sidebar-foreground/80 transition-all duration-200",
                            isActive
                              ? "bg-cicluz-gradient text-white border-transparent shadow-[0_10px_24px_hsl(var(--cicluz-purple)_/_0.25)]"
                              : "group-hover:bg-sidebar-accent/60 group-hover:text-sidebar-foreground"
                          )}
                          aria-hidden="true"
                        >
                          <IconComponent className="h-5 w-5" />
                        </span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="hidden md:block px-3 pb-3 pt-2">
          <div className="rounded-2xl bg-sidebar-accent/35 border border-sidebar-border/60 shadow-sm backdrop-blur-md p-2">
            <Calendar
              mode="single"
              selected={new Date()}
              className="p-0 text-sidebar-foreground"
              classNames={{
                months: "flex flex-col space-y-2",
                month: "space-y-2",
                caption: "flex justify-center pt-1 relative items-center mb-2",
                caption_label:
                  "text-xs font-semibold tracking-tight text-sidebar-foreground/90",
                nav: "space-x-1 flex items-center",
                nav_button:
                  "h-7 w-7 inline-flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-md transition-colors",
                head_row: "flex",
                head_cell:
                  "text-sidebar-foreground/55 font-normal text-[0.72rem] w-7 text-center",
                row: "flex w-full mt-1",
                cell: "h-7 w-7 text-center text-xs p-0 relative",
                day: "h-7 w-7 text-xs text-sidebar-foreground/80 hover:bg-sidebar-accent/55 rounded-md transition-colors p-0 font-medium aria-selected:opacity-100",
                day_selected:
                  "bg-cicluz-gradient text-white font-bold shadow-[0_0_18px_hsl(var(--cicluz-purple)_/_0.35)]",
                day_today:
                  "bg-sidebar-accent/80 text-sidebar-foreground font-bold ring-1 ring-sidebar-ring/40",
                day_outside:
                  "text-sidebar-foreground/30 opacity-70 aria-selected:bg-sidebar-accent/40 aria-selected:text-sidebar-foreground/45",
                day_disabled: "text-sidebar-foreground/25 opacity-60",
              }}
            />
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="px-4 py-4 border-t border-sidebar-border">
        {user ? (
          <div className="mb-4 rounded-2xl px-3 py-3 bg-sidebar-accent/35 border border-sidebar-border/60 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-cicluz-gradient text-white grid place-items-center font-semibold shadow-[0_10px_20px_hsl(var(--cicluz-purple)_/_0.2)]">
                {getInitials(user.name)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={logout}
        >
          <HiArrowRightOnRectangle className="h-4 w-4" />
          <span>Sair da conta</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
