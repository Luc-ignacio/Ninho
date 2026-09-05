"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BankIcon,
  CreditCardIcon,
  DashboardSquare03Icon,
  Settings02Icon,
  Sun01Icon,
  SunDim,
  Tag01Icon,
  TransactionIcon,
  Upload01Icon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavUser } from "./nav-user";
import { SpaceSwitcher } from "./space/space-switcher";
import type { ProfileSpace } from "@/lib/space/queries";
import { Separator } from "./ui/separator";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  spaces: ProfileSpace[];
  activeSpaceId?: string;
};

export function AppSidebar({
  spaces,
  activeSpaceId,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname();

  const checkIsActive = (url: string) => {
    return pathname === url;
  };

  const data = {
    user: {
      name: "Lucas Ignacio",
      email: "lucas@ninho.com",
      avatar: "/avatars/shadcn.jpg",
    },

    navMain: [
      {
        title: "",
        url: "#",
        items: [
          {
            title: "Dashboard",
            url: "/",
            icon: <HugeiconsIcon icon={DashboardSquare03Icon} />,
            isActive: checkIsActive("/"),
            items: [],
          },
          {
            title: "Transações",
            url: "/transactions",
            icon: <HugeiconsIcon icon={TransactionIcon} />,
            isActive: checkIsActive("/transactions"),
            items: [],
          },
          {
            title: "Contas",
            url: "/accounts",
            icon: <HugeiconsIcon icon={BankIcon} />,
            isActive: checkIsActive("/accounts"),
            items: [],
          },
          {
            title: "Cartões",
            url: "/cards",
            icon: <HugeiconsIcon icon={CreditCardIcon} />,
            isActive: checkIsActive("/cards"),
            items: [],
          },
          {
            title: "Categorias",
            url: "/categories",
            icon: <HugeiconsIcon icon={Tag01Icon} />,
            isActive: checkIsActive("/categories"),
            items: [],
          },
          {
            title: "Importações",
            url: "/imports",
            icon: <HugeiconsIcon icon={Upload01Icon} />,
            isActive: checkIsActive("/imports"),
            items: [],
          },
          {
            title: "Membros",
            url: "/members",
            icon: <HugeiconsIcon icon={UserMultiple02Icon} />,
            isActive: checkIsActive("/members"),
            items: [],
          },
          {
            title: "Configurações",
            url: "/settings",
            icon: <HugeiconsIcon icon={Settings02Icon} />,
            isActive: checkIsActive("/settings"),
            items: [],
          },
        ],
      },
    ],
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SpaceSwitcher spaces={spaces} activeSpaceId={activeSpaceId} />
      </SidebarHeader>

      <Separator />

      <SidebarContent>
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      isActive={item.isActive}
                      tooltip={item.title}
                    >
                      {item.icon}
                      {item.title}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <Separator />
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
