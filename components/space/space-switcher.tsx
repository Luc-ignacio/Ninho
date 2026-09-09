"use client";

import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { setActiveSpace } from "@/app/actions/space";
import type { ProfileSpace } from "@/lib/space/queries";
import {
  Add01Icon,
  BirdhouseIcon,
  Tick02Icon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CreateSpace } from "./create-space";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

interface Props {
  spaces: ProfileSpace[];
  activeSpaceId?: string;
}

export function SpaceSwitcher({ spaces, activeSpaceId }: Props) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);

  const activeSpace = spaces.find((s) => s.id === activeSpaceId) ?? spaces[0];

  const handleSelect = (spaceId: string) => {
    if (spaceId === activeSpace?.id) return;

    startTransition(async () => {
      setError(null);
      try {
        await setActiveSpace(spaceId);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível trocar de espaço",
        );
      }
    });
  };

  if (!activeSpace) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={isPending}
            render={
              <SidebarMenuButton
                size="lg"
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground data-disabled:opacity-60"
                tooltip="Trocar espaço"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <HugeiconsIcon icon={BirdhouseIcon} />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{activeSpace.name}</span>
            </div>
            <HugeiconsIcon icon={UnfoldMoreIcon} className="ml-auto" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "bottom"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Meus espaços
              </DropdownMenuLabel>

              {spaces.map((space) => (
                <DropdownMenuItem
                  key={space.id}
                  onClick={() => handleSelect(space.id)}
                  className="gap-2 p-2 cursor-pointer"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <HugeiconsIcon icon={BirdhouseIcon} />
                  </div>
                  {space.name}
                  {space.id === activeSpace.id && (
                    <HugeiconsIcon icon={Tick02Icon} className="ml-auto" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>

            {error && <p className="px-2 py-1 text-xs text-red-500">{error}</p>}

            <DropdownMenuSeparator />

            <Button onClick={() => setCreateOpen(true)} className="w-full">
              <HugeiconsIcon icon={Add01Icon} /> Criar Espaço
            </Button>
          </DropdownMenuContent>
        </DropdownMenu>

        <CreateSpace open={createOpen} onOpenChange={setCreateOpen} />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
