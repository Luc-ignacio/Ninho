"use client";

import { updateSpaceCreditCard } from "@/app/actions/credit-card";
import { CurrencyType } from "@/app/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActiveSpace } from "@/lib/space/get-active-space";
import type { SpaceCreditCard } from "@/lib/space/queries";
import { currencySymbol, formatCents, parseCurrencyInput } from "@/lib/utils";
import { Edit02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { notFound, useRouter } from "next/navigation";
import { useState } from "react";
import SelectSpaceAccount from "./select-space-account";
import SelectSpaceMember from "./select-space-member";

export function EditSpaceCreditCard({
  space,
  creditCard,
  className,
}: {
  space: ActiveSpace;
  creditCard: SpaceCreditCard;
  className?: string;
}) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(creditCard.name);
  const [lastFour, setLastFour] = useState(creditCard.lastFour ?? "");
  const [creditLimitCents, setCreditLimitCents] = useState(
    creditCard.creditLimitCents ?? 0,
  );
  const [dueDay, setDueDay] = useState(
    creditCard.dueDay === null ? "" : String(creditCard.dueDay),
  );
  const [holderId, setHolderId] = useState<string | null>(
    creditCard.Holder?.id ?? null,
  );
  const [accountId, setAccountId] = useState<string | null>(
    creditCard.Account?.id ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!space) {
    notFound();
  }

  const account = space.Accounts.find((a) => a.id === accountId);
  const currency: CurrencyType = account?.currency ?? "BRL";

  const resetForm = () => {
    setName(creditCard.name);
    setLastFour(creditCard.lastFour ?? "");
    setCreditLimitCents(creditCard.creditLimitCents ?? 0);
    setDueDay(creditCard.dueDay === null ? "" : String(creditCard.dueDay));
    setHolderId(creditCard.Holder?.id ?? null);
    setAccountId(creditCard.Account?.id ?? null);
    setError(null);
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const updated = await updateSpaceCreditCard(creditCard.id, {
        name,
        lastFour: lastFour.trim() || null,
        creditLimitCents: creditLimitCents || null,
        dueDay: dueDay ? Number(dueDay) : null,
        holderId,
        accountId,
      });

      if (updated) {
        setOpen(false);
        router.refresh();
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Algo deu errado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" className={className}>
            <HugeiconsIcon icon={Edit02Icon} />
          </Button>
        }
      />

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            <DialogHeader>
              <DialogTitle>
                Editar cartão{" "}
                <span className="text-lime-600 font-medium">
                  {creditCard.name}
                </span>
              </DialogTitle>
              <DialogDescription className="flex flex-col gap-2">
                Atualize o limite, o vencimento e a conta que paga a fatura.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <Field>
                <Label htmlFor="edit-credit-card-name">Nome do cartão</Label>
                <Input
                  id="edit-credit-card-name"
                  type="text"
                  placeholder="Ex: Nubank Ultravioleta"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>

              <Field>
                <Label htmlFor="edit-credit-card-last-four">
                  Últimos 4 dígitos
                </Label>
                <Input
                  id="edit-credit-card-last-four"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={4}
                  placeholder="1234"
                  value={lastFour}
                  onChange={(e) =>
                    setLastFour(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                />
              </Field>

              <SelectSpaceAccount
                accounts={space.Accounts}
                inputLabel="Conta que paga a fatura"
                value={accountId}
                onValueChange={setAccountId}
              />

              <Field>
                <Label htmlFor="edit-credit-card-limit">Limite</Label>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>{currencySymbol[currency]}</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="edit-credit-card-limit"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={formatCents(0, currency)}
                    value={
                      creditLimitCents === 0
                        ? ""
                        : formatCents(creditLimitCents, currency)
                    }
                    onChange={(e) =>
                      setCreditLimitCents(parseCurrencyInput(e.target.value))
                    }
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>{currency}</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </Field>

              <Field>
                <Label htmlFor="edit-credit-card-due-day">
                  Dia de vencimento
                </Label>
                <Input
                  id="edit-credit-card-due-day"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="27"
                  value={dueDay}
                  onChange={(e) =>
                    setDueDay(e.target.value.replace(/\D/g, "").slice(0, 2))
                  }
                />
              </Field>

              <SelectSpaceMember
                members={space.Members}
                inputLabel="Titular"
                value={holderId}
                onValueChange={setHolderId}
              />
            </FieldGroup>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <DialogFooter>
              <DialogClose
                render={
                  <Button variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                }
              />
              <Button type="submit" disabled={!name.trim() || isLoading}>
                {isLoading ? (
                  <div className="animate-spin">
                    <HugeiconsIcon icon={Loading03Icon} />
                  </div>
                ) : (
                  "Salvar"
                )}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
