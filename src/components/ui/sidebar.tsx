"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  Settings,
  UserCircle,
  Gavel,
  Hash,
  ClipboardList,
  GraduationCap,
  BarChart3,
  Users,
  Mail,
  Home,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useUser, useClerk } from "@clerk/nextjs";

const sidebarVariants: any = {
  open: {
    width: "16rem",
  },
  closed: {
    width: "4rem",
  },
};

const contentVariants: any = {
  open: { display: "block", opacity: 1 },
  closed: { display: "block", opacity: 1 },
};

const variants: any = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      x: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    x: -20,
    opacity: 0,
    transition: {
      x: { stiffness: 100 },
    },
  },
};

const transitionProps: any = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2,
  staggerChildren: 0.1,
};

const staggerVariants: any = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
};

export function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "content";
  const { user } = useUser();
  const { signOut } = useClerk();

  const navItems = [
    { label: "Moderation", tab: "content", icon: Gavel },
    { label: "Tags", tab: "tags", icon: Hash },
    { label: "Forms", tab: "submit-forms", icon: ClipboardList },
    { label: "Judging", tab: "judging", icon: GraduationCap },
    { label: "Performance", tab: "numbers", icon: BarChart3 },
    { label: "User Governance", tab: "users", icon: Users },
    { label: "Email Tools", tab: "emails", icon: Mail },
    { label: "Settings", tab: "settings", icon: Settings },
  ];

  return (
    <motion.div
      className={cn(
        "sidebar fixed left-0 top-0 z-40 h-full border-r bg-white dark:bg-black overflow-hidden",
      )}
      initial={isCollapsed ? "closed" : "open"}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <motion.div
        className="flex h-full flex-col text-muted-foreground"
        variants={contentVariants}
      >
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          {/* Header / Org Select */}
          <div className="flex h-[64px] items-center border-b px-4">
             <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded bg-primary text-primary-foreground font-bold">
                  S
                </div>
                {!isCollapsed && (
                  <motion.div variants={variants} className="flex items-center gap-1">
                    <span className="font-semibold text-foreground">Shipgrid</span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1">ADMIN</Badge>
                  </motion.div>
                )}
             </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
            <div className="flex flex-col gap-1 px-3">
              {navItems.map((item) => (
                <Link
                  key={item.tab}
                  href={`/admin?tab=${item.tab}`}
                  className={cn(
                    "flex h-10 items-center rounded-md px-3 py-2 transition-all hover:bg-muted hover:text-foreground",
                    activeTab === item.tab && "bg-muted text-primary font-medium"
                  )}
                >
                  <item.icon className={cn("size-5 shrink-0", activeTab === item.tab && "text-primary")} />
                  {!isCollapsed && (
                    <motion.span variants={variants} className="ml-3 text-sm whitespace-nowrap">
                      {item.label}
                    </motion.span>
                  )}
                </Link>
              ))}
            </div>

            <div className="mt-8 px-5 mb-2 h-px bg-border mx-auto w-full opacity-50" />
            
            <div className="px-3">
              <Link
                href="/"
                className="flex h-10 items-center rounded-md px-3 py-2 transition-all hover:bg-muted hover:text-foreground"
              >
                <Home className="size-5 shrink-0" />
                {!isCollapsed && (
                  <motion.span variants={variants} className="ml-3 text-sm whitespace-nowrap">
                    Back to Apps Home
                  </motion.span>
                )}
              </Link>
            </div>
          </div>

          {/* Footer / Account */}
          <div className="border-t p-3">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 p-2 hover:bg-muted",
                    isCollapsed ? "px-1.5" : "px-2"
                  )}
                >
                  <Avatar className="size-6 shrink-0">
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback className="text-[10px]">
                      {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <motion.div variants={variants} className="flex flex-1 items-center justify-between text-left">
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium text-foreground truncate">
                          {user?.firstName || "Admin"}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {user?.primaryEmailAddress?.emailAddress}
                        </span>
                      </div>
                      <ChevronsUpDown className="size-4 opacity-50" />
                    </motion.div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" sideOffset={10} className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/settings/profile" className="cursor-pointer">
                    <UserCircle className="mr-2 size-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin?tab=settings" className="cursor-pointer">
                    <Settings className="mr-2 size-4" />
                    Dashboard Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                  onClick={() => signOut()}
                >
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.ul>
      </motion.div>
    </motion.div>
  );
}
