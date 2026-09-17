"use client";

import { addSpaceCreditCard } from "@/app/actions/credit-card";
import { Button, buttonVariants } from "@/components/ui/button";
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
import {
  cn,
  currencySymbol,
  formatCents,
  parseCurrencyInput,
} from "@/lib/utils";
import { CurrencyType } from "@/app/generated/prisma/enums";
import { Add01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { notFound, useRouter } from "next/navigation";
import { useState } from "react";
import SelectSpaceAccount from "./select-space-account";
import SelectSpaceMember from "./select-space-member";

export function AddSpaceCreditCard({
  space,
  className,
}: {
  space: ActiveSpace;
  className?: string;
}) {
  const router = useRouter();
  const defaultProfileId =
    space?.Members.find((member) => member.role === "OWNER")?.Profile.id ??
    null;

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [creditLimitCents, setCreditLimitCents] = useState(0);
  const [dueDay, setDueDay] = useState("");
  const [holderId, setHolderId] = useState<string | null>(defaultProfileId);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!space) {
    notFound();
  }

  const account = space.Accounts.find((a) => a.id === accountId);
  const currency: CurrencyType = account?.currency ?? "BRL";

  const resetForm = () => {
    setName("");
    setLastFour("");
    setCreditLimitCents(0);
    setDueDay("");
    setHolderId(defaultProfileId);
    setAccountId(null);
    setError(null);
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const creditCard = await addSpaceCreditCard({
        name,
        lastFour: lastFour.trim() || null,
        creditLimitCents: creditLimitCents || null,
        dueDay: dueDay ? Number(dueDay) : null,
        holderId,
        accountId,
      });

      if (creditCard) {
        resetForm();
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
        className={cn(buttonVariants({ variant: "default" }), className)}
      >
        <HugeiconsIcon icon={Add01Icon} />
        <span className="truncate">Adicionar Cartão</span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto no-scrollbar">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            <DialogHeader>
              <DialogTitle>
                Adicionar cartão ao espaço{" "}
                <span className="text-lime-600 font-medium">{space.name}</span>
              </DialogTitle>
              <DialogDescription className="flex flex-col gap-2">
                Cadastre um cartão para lançar despesas e pagamentos de fatura.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <Field>
                <Label htmlFor="credit-card-name">Nome do cartão</Label>
                <Input
                  id="credit-card-name"
                  type="text"
                  placeholder="Ex: Nubank Ultravioleta"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>

              <Field>
                <Label htmlFor="credit-card-last-four">Últimos 4 dígitos</Label>
                <Input
                  id="credit-card-last-four"
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
                <Label htmlFor="credit-card-limit">Limite</Label>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>{currencySymbol[currency]}</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="credit-card-limit"
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
                <Label htmlFor="credit-card-due-day">Dia de vencimento</Label>
                <Input
                  id="credit-card-due-day"
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
                  "Adicionar"
                )}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
