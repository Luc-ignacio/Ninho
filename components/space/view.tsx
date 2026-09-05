"use client";

import { Button } from "@/components/ui/button";
import { ViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function ViewSpace({ path }: { path: string }) {
  const pathname = usePathname();
  const url = `${pathname}/${path}`;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            nativeButton={false}
            size="icon"
            render={
              <Link href={url}>
                <HugeiconsIcon icon={ViewIcon} />
              </Link>
            }
          />
        }
      />

      <TooltipContent>
        <p>Ver Espaço</p>
      </TooltipContent>
    </Tooltip>
  );
}
