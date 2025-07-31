"use client"

import * as React from "react"
import {
  CircleDollarSign,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  Users,
  FlaskConical,
  TestTube2,
} from "lucide-react"


import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { TeamSwitcher } from "./team-switcher"
import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { NavUser } from "./nav-user"
import { SidebarThemeToggle } from "./sidebar-theme-toggle"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Agrocheck",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    }
  ],
  navMain: [
    {
      title: "Sample Collection",
      url: "",
      icon: TestTube2,
      isActive: true,
      items: [
        {
          title: "All Samples Info",
          url: "/dashboard/samples",
        },
        {
          title: "All Reports Info",
          url: "/dashboard/reports",
        },
      ],
    },
    {
      title: "Tests Info",
      url: "",
      icon: FlaskConical,
      isActive: true,
      items: [
  
        {
          title: "All Tests Info",
          url: "/dashboard/all-test-info",
        },
      ],
    },
    {
      title: "Clients",
      url: "#",
      icon: Users,
      items: [
        {
          title: "Client Information",
          url: "/dashboard/clients",
        }
      ],
    },
    {
      title: "Orders",
      url: "/dashboard/pricing",
      icon: CircleDollarSign,
      items: [
        {
          title: "Test Orders Info",
          url: "/dashboard/orders",
        }
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      items: [
        {
          title: "Institute",
          url: "/dashboard/institute",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Water Testing",
      url: "/water-test",
      icon: Frame,
    },
    {
      name: "Soil Testing",
      url: "/soil-test",
      icon: PieChart,
    },
    {
      name: "Fertilizer Testing",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavSettings/> */}
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarThemeToggle />
        <NavUser  />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
