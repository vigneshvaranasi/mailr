"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  FileCode2,
  Mails,
  PanelLeft,
  Settings,
  Table2,
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
  const { toggleSidebar } = useSidebar();

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
      href: `${base}/sender-recipients`,
      label: "Sender & recipients",
      tooltip: "Sender and recipients",
      icon: Mails,
      active: pathname.startsWith(`${base}/sender-recipients`),
    },
    {
      href: `${base}/dynamic-data`,
      label: "Dynamic data",
      tooltip: "Dynamic data",
      icon: Table2,
      active: pathname.startsWith(`${base}/dynamic-data`),
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
      <SidebarHeader className="border-sidebar-border flex h-14 justify-center border-b p-2">
        <SidebarMenu className="flex w-full min-w-0 flex-row items-center gap-1">
          <SidebarMenuItem className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
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
              tooltip="Toggle sidebar"
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
