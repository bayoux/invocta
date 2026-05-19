"use client"

import * as React from "react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import {
  LayoutDashboardIcon,
  UsersIcon,
  BellIcon,
  Settings2Icon,
  CircleHelpIcon,
  ShieldCheckIcon,
  ActivityIcon,
  FileBarChartIcon,
  FileTextIcon,
} from "lucide-react"
import { useAuthStore } from "@/store/auth.store"

const navMain = [
  {
    title: "Дашборд",
    url: "/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Должники",
    url: "/debtors",
    icon: <UsersIcon />,
  },
  {
    title: "Уведомления",
    url: "/notifications",
    icon: <BellIcon />,
  },
  {
    title: "Пользователи",
    url: "/users",
    icon: <ShieldCheckIcon />,
  },
]

const navSecondary = [
  {
    title: "Настройки",
    url: "#",
    icon: <Settings2Icon />,
  },
  {
    title: "Помощь",
    url: "#",
    icon: <CircleHelpIcon />,
  },
]

const documents = [
  {
    name: "Отчёты",
    url: "#",
    icon: <FileBarChartIcon />,
  },
  {
    name: "Шаблоны",
    url: "#",
    icon: <FileTextIcon />,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore()

  const roleLabel: Record<string, string> = {
    admin: "Администратор",
    manager: "Менеджер",
    supervisor: "Супервайзер",
  }

  const navUser = {
    name: user ? `${user.firstName} ${user.lastName}` : "Загрузка...",
    email: user?.email ?? "",
    avatar: "",
    role: user ? roleLabel[user.role] : "",
  }

  // Filter users nav for non-admin/supervisor
  const filteredNavMain = navMain.filter((item) => {
    if (item.url === "/users") {
      return user?.role === "admin" || user?.role === "supervisor"
    }
    return true
  })

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/dashboard">
                <ActivityIcon className="size-5!" />
                <span className="text-base font-semibold">
                  Soft Collections
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
        <NavDocuments items={documents} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
