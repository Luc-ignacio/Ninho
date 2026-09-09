"use client";

import { useState } from "react";

import { DeleteSpaceCreditCard } from "@/components/space/delete-credit-card";
import { EditSpaceCreditCard } from "@/components/space/edit-credit-card";
import { RestoreSpaceCreditCard } from "@/components/space/restore-credit-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActiveSpace } from "@/lib/space/get-active-space";
import type { SpaceCreditCard } from "@/lib/space/queries";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowTurnBackwardIcon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const cardGradients = [
  "from-lime-600 via-lime-800 to-lime-950",
  "from-teal-600 via-teal-800 to-teal-950",
  "from-emerald-600 via-emerald-800 to-emerald-950",
  "from-cyan-700 via-cyan-800 to-cyan-950",
  "from-indigo-600 via-indigo-800 to-indigo-950",
  "from-green-600 via-green-800 to-green-950",
  "from-sky-700 via-sky-800 to-sky-950",
];

function DotGroup() {
  return (
    <span className="flex items-center gap-1.5" aria-hidden>
      {Array.from({ length: 4 }, (_, index) => (
        <span key={index} className="size-1.5 rounded-full bg-white/80" />
      ))}
    </span>
  );
}

function CreditCardBackDetails({
  space,
  creditCard,
}: {
  space: ActiveSpace;
  creditCard: SpaceCreditCard;
}) {
  const { creditLimitCents, usedCents, availableCents } = creditCard;
  const currency = creditCard.Account?.currency ?? "BRL";
  const isExceeded = (availableCents ?? 0) < 0;
  const usedPercent =
    creditLimitCents === null || creditLimitCents === 0
      ? 0
      : Math.min(
          100,
          Math.max(0, Math.round((usedCents / creditLimitCents) * 100)),
        );

  return (
    <>
      <div className="flex flex-col gap-2">
        {creditLimitCents === null ? (
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-semibold">
              {formatCurrency(usedCents, currency)} em aberto
            </span>
            <span className="text-xs text-white/60">Sem limite</span>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold">
                {formatCurrency(usedCents, currency)}
                <span className="font-normal text-white/60">
                  {" de "}
                  {formatCurrency(creditLimitCents, currency)}
                </span>
              </span>

              <span
                className={
                  isExceeded
                    ? "text-xs font-semibold text-red-300"
                    : "text-xs text-white/70"
                }
              >
                {isExceeded
                  ? "Limite excedido"
                  : `${formatCurrency(availableCents, currency)} livre`}
              </span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className={`h-full rounded-full ${isExceeded ? "bg-red-400" : "bg-white"}`}
                style={{ width: `${usedPercent}%` }}
              />
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        {creditCard.isActive ? (
          <span className="text-xs text-white/70">
            {creditCard._count.Transactions === 1
              ? "1 lançamento"
              : `${creditCard._count.Transactions} lançamentos`}
          </span>
        ) : (
          <Badge className="border-white/30 bg-white/15 text-white">
            Arquivado
          </Badge>
        )}

        <div className="flex items-center gap-1">
          {creditCard.isActive ? (
            <>
              <EditSpaceCreditCard
                space={space}
                creditCard={creditCard}
                className="text-white hover:bg-white/15 hover:text-white"
              />
              <DeleteSpaceCreditCard
                creditCard={creditCard}
                className="text-white hover:text-destructive hover:bg-red-100"
              />
            </>
          ) : (
            <RestoreSpaceCreditCard
              creditCard={creditCard}
              className="border-white/30 bg-transparent text-white hover:bg-white/15 hover:text-white"
            />
          )}
        </div>
      </div>
    </>
  );
}

export function CreditCardItem({
  space,
  creditCard,
  index,
}: {
  space: ActiveSpace;
  creditCard: SpaceCreditCard;
  index: number;
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  const surface = `absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl bg-linear-to-br ${
    cardGradients[index % cardGradients.length]
  } p-6 text-white shadow-md backface-hidden ${
    creditCard.isActive ? "" : "opacity-60 grayscale"
  }`;

  return (
    <div className="perspective-distant">
      <div
        className={`relative aspect-16/10 max-h-64 w-full transition-transform duration-500 ease-out transform-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        <div className={surface} aria-hidden={isFlipped}>
          <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 size-56 rounded-full bg-white/5" />

          <div className="relative flex items-start justify-between gap-3">
            <span className="text-sm font-semibold">{creditCard.name}</span>

            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Ver detalhes do cartão"
              className="-mr-2 -mt-2 text-white hover:bg-white/15 hover:text-white"
              onClick={() => setIsFlipped(true)}
            >
              <HugeiconsIcon icon={InformationCircleIcon} />
            </Button>
          </div>

          <div className="relative flex flex-col gap-4 mt-4">
            <div className="flex items-center gap-3 text-xl font-semibold">
              <DotGroup />
              <DotGroup />
              <DotGroup />
              <span className="tracking-[0.2em]">
                {creditCard.lastFour ?? "••••"}
              </span>
            </div>

            <span className="text-base font-medium text-white">
              {creditCard.Holder?.name ?? "Sem titular"}
            </span>
          </div>

          <div className="relative flex items-end justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-white/60">Vencimento</span>
              <span className="text-sm font-semibold">
                {creditCard.dueDay
                  ? `Dia ${creditCard.dueDay}`
                  : "Não informado"}
              </span>
            </div>

            {creditCard.Account?.name && (
              <div className="flex flex-col items-end">
                <span className="text-xs text-white/60">Instituição</span>
                <span className="text-sm font-semibold">
                  {creditCard.Account?.name}
                </span>
              </div>
            )}
          </div>
        </div>

        <div
          className={`${surface} rotate-y-180`}
          aria-hidden={!isFlipped}
          inert={!isFlipped}
        >
          <div className="pointer-events-none absolute -left-16 -top-20 size-56 rounded-full bg-white/10" />

          <div className="relative flex items-start justify-between gap-3">
            <span className="text-sm font-semibold">{creditCard.name}</span>

            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Voltar para a frente do cartão"
              className="-mr-2 -mt-2 text-white hover:bg-white/15 hover:text-white"
              onClick={() => setIsFlipped(false)}
            >
              <HugeiconsIcon icon={ArrowTurnBackwardIcon} />
            </Button>
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-16 h-8 bg-black/35" />

          <div className="relative flex flex-col gap-4 pt-6">
            <CreditCardBackDetails space={space} creditCard={creditCard} />
          </div>
        </div>
      </div>
    </div>
  );
}
