"use client";

import * as React from "react";

import { TransactionType } from "@/app/generated/prisma/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type {
  SpaceAccount,
  SpaceCategory,
  SpaceCreditCard,
  SpaceMember,
} from "@/lib/space/queries";
import {
  ALL,
  countActiveFilters,
  emptyTransactionFilters,
  formatMonthLabel,
  transactionFiltersToQuery,
  UNCATEGORIZED,
  type TransactionFilterValues,
} from "@/lib/space/transaction-filters";
import { accountTypeLabel, transactionTypeLabel } from "@/lib/utils";
import { FilterIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { usePathname, useRouter } from "next/navigation";

interface FilterOption {
  value: string;
  label: string;
}

function FilterField({
  label,
  options,
  value,
  onValueChange,
}: {
  label: string;
  options: FilterOption[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <Field>
      <Label>{label}</Label>
      <Select
        items={options}
        value={value}
        onValueChange={(next) => onValueChange(next as string)}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}

export function TransactionFilters({
  accounts,
  creditCards,
  categories,
  members,
  months,
  values,
}: {
  accounts: SpaceAccount[];
  creditCards: SpaceCreditCard[];
  categories: SpaceCategory[];
  members: SpaceMember[];
  months: string[];
  values: TransactionFilterValues;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = React.useTransition();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(values);

  const activeCount = countActiveFilters(values);

  function onOpenChange(next: boolean) {
    if (next) setDraft(values);
    setOpen(next);
  }

  function apply(next: TransactionFilterValues) {
    const query = transactionFiltersToQuery(next).toString();

    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });

    setOpen(false);
  }

  function update(patch: Partial<TransactionFilterValues>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  const monthOptions: FilterOption[] = [
    { value: ALL, label: "Todos os meses" },
    ...months.map((month) => ({
      value: month,
      label: formatMonthLabel(month),
    })),
  ];

  const accountOptions: FilterOption[] = [
    { value: ALL, label: "Todas as contas" },
    ...accounts.map((account) => ({
      value: account.id,
      label: `${account.name} · ${accountTypeLabel[account.type]}`,
    })),
  ];

  const creditCardOptions: FilterOption[] = [
    { value: ALL, label: "Todos os cartões" },
    ...creditCards.map((card) => ({
      value: card.id,
      label: card.lastFour ? `${card.name} •••• ${card.lastFour}` : card.name,
    })),
  ];

  const categoryOptions: FilterOption[] = [
    { value: ALL, label: "Todas as categorias" },
    { value: UNCATEGORIZED, label: "Sem categoria" },
    ...categories.map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ];

  const memberOptions: FilterOption[] = [
    { value: ALL, label: "Todos os titulares" },
    ...members.map((member) => ({
      value: member.Profile.id,
      label: member.Profile.name,
    })),
  ];

  const typeOptions: FilterOption[] = [
    { value: ALL, label: "Todos os tipos" },
    ...Object.values(TransactionType).map((type) => ({
      value: type,
      label: transactionTypeLabel[type],
    })),
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger
        render={<Button variant="outline" disabled={isPending} />}
      >
        <HugeiconsIcon icon={FilterIcon} />
        Filtros
        {activeCount > 0 && (
          <Badge variant="secondary" className="ml-0.5">
            {activeCount}
          </Badge>
        )}
      </SheetTrigger>

      <SheetContent className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Filtrar transações</SheetTitle>
          <SheetDescription>
            Combine os filtros e aplique para atualizar a lista.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-6">
          <Field>
            <Label>Descrição</Label>
            <Input
              value={draft.search ?? ""}
              onChange={(event) =>
                update({ search: event.target.value || null })
              }
              placeholder="Buscar descrição"
            />
          </Field>

          <FilterField
            label="Mês"
            options={monthOptions}
            value={draft.month ?? ALL}
            onValueChange={(next) =>
              update({ month: next === ALL ? null : next })
            }
          />

          <FilterField
            label="Conta"
            options={accountOptions}
            value={draft.accountId ?? ALL}
            onValueChange={(next) =>
              update({ accountId: next === ALL ? null : next })
            }
          />

          <FilterField
            label="Cartão"
            options={creditCardOptions}
            value={draft.creditCardId ?? ALL}
            onValueChange={(next) =>
              update({ creditCardId: next === ALL ? null : next })
            }
          />

          <FilterField
            label="Categoria"
            options={categoryOptions}
            value={draft.categoryId ?? ALL}
            onValueChange={(next) =>
              update({ categoryId: next === ALL ? null : next })
            }
          />

          <FilterField
            label="Titular"
            options={memberOptions}
            value={draft.profileId ?? ALL}
            onValueChange={(next) =>
              update({ profileId: next === ALL ? null : next })
            }
          />

          <FilterField
            label="Tipo"
            options={typeOptions}
            value={draft.type ?? ALL}
            onValueChange={(next) =>
              update({ type: next === ALL ? null : (next as TransactionType) })
            }
          />
        </div>

        <SheetFooter>
          <Button onClick={() => apply(draft)}>Aplicar filtros</Button>

          <Button
            variant="ghost"
            onClick={() => apply(emptyTransactionFilters)}
            disabled={activeCount === 0}
          >
            Limpar filtros
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
