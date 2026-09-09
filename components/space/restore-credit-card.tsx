"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { restoreSpaceCreditCard } from "@/app/actions/credit-card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowReloadHorizontalIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "../ui/button";
import { SpaceCreditCard } from "@/lib/space/queries";

export function RestoreSpaceCreditCard({
  creditCard,
  className,
}: {
  creditCard: SpaceCreditCard;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const handleRestore = () =>
    startTransition(async () => {
      await restoreSpaceCreditCard(creditCard.id);
      router.refresh();
    });

  return (
    <Button
      size="sm"
      variant="outline"
      className={className}
      disabled={isPending}
      onClick={handleRestore}
    >
      {isPending ? (
        <div className="animate-spin">
          <HugeiconsIcon icon={Loading03Icon} />
        </div>
      ) : (
        <>
          <HugeiconsIcon icon={ArrowReloadHorizontalIcon} />
          Reativar
        </>
      )}
    </Button>
  );
}
