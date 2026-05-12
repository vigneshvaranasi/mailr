"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  FileCode2,
  Mails,
  PanelLeft,
  Settings,
  Sliders,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

type AppSidebarProps = {
  projectId: string;
};

export function AppSidebar({ projectId }: AppSidebarProps) {
  const pathname = usePathname();
  const { toggleSidebar, state } = useSidebar();

  const base = `/editor/${projectId}`;

  const items = [
    {
      href: base,
      label: "Editor",
      tooltip: "Editor",
      icon: FileCode2,
      active: pathname === base,
    },
    {
      href: `${base}/config`,
      label: "Config",
      tooltip: "SMTP config",
      icon: Sliders,
      active: pathname.startsWith(`${base}/config`),
    },
    {
      href: `${base}/sender-recipients`,
      label: "Sender & recipients",
      tooltip: "Sender and recipients",
      icon: Mails,
      active: pathname.startsWith(`${base}/sender-recipients`),
    },
    {
      href: `${base}/settings`,
      label: "Settings",
      tooltip: "Project settings",
      icon: Settings,
      active: pathname.startsWith(`${base}/settings`),
    },
  ] as const;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-sidebar-border border-b">
        <SidebarMenu className="flex w-full min-w-0 flex-row items-center gap-1">
          <SidebarMenuItem className="min-w-0 flex-1">
            <SidebarMenuButton asChild tooltip="Back to projects">
              <Link href="/projects">
                <ChevronLeft className="size-4 shrink-0" />
                <span>Projects</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="shrink-0">
            <SidebarMenuButton
              onClick={toggleSidebar}
              tooltip={
                state === "expanded" ? "Collapse sidebar" : "Expand sidebar"
              }
            >
              <PanelLeft className="size-4" />
              <span className="sr-only">Toggle sidebar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={item.active}
                    asChild
                    tooltip={item.tooltip}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
