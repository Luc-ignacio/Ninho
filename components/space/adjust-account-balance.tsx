"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  deleteSpaceAccountBalance,
  setSpaceAccountBalance,
} from "@/app/actions/account";
import { Button, buttonVariants } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import type { SpaceAccountDetail } from "@/lib/space/queries";
import {
  currencySymbol,
  formatCents,
  formatYmd,
  parseCurrencyInput,
  todayYmd,
} from "@/lib/utils";
import { Loading03Icon, MoneyExchange01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function AdjustAccountBalance({
  account,
}: {
  account: SpaceAccountDetail;
}) {
  const router = useRouter();

  // A coluna é `@db.Date` à meia-noite UTC: os getters locais devolveriam o dia
  // anterior em fusos negativos.
  const snapshot = account.BalanceSnapshots[0] ?? null;
  const snapshotYmd = snapshot ? snapshot.date.toISOString().slice(0, 10) : null;

  const [open, setOpen] = React.useState(false);
  const [dateYmd, setDateYmd] = React.useState(snapshotYmd ?? todayYmd());
  const [balanceCents, setBalanceCents] = React.useState(
    snapshot?.balanceCents ?? 0,
  );
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const resetForm = () => {
    setDateYmd(snapshotYmd ?? todayYmd());
    setBalanceCents(snapshot?.balanceCents ?? 0);
    setError(null);
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await setSpaceAccountBalance({
        accountId: account.id,
        balanceCents,
        ymd: dateYmd,
      });

      setOpen(false);
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Algo deu errado");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!snapshot) return;

    setIsLoading(true);
    setError(null);

    try {
      await deleteSpaceAccountBalance(account.id, snapshot.id);

      setOpen(false);
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Algo deu errado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ variant: "outline" })}>
        <HugeiconsIcon icon={MoneyExchange01Icon} />
        Ajustar saldo
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto no-scrollbar">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            <DialogHeader>
              <DialogTitle>
                Ajustar saldo da conta{" "}
                <span className="text-lime-600 font-medium">
                  {account.name}
                </span>
              </DialogTitle>
              <DialogDescription>
                Registre o saldo que a conta tinha numa data. Ele vale como
                fechamento daquele dia: só os lançamentos posteriores somam em
                cima dele.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <Field>
                <Label htmlFor="balance-date">Data do saldo</Label>
                <DatePicker
                  id="balance-date"
                  value={dateYmd}
                  onValueChange={setDateYmd}
                  disabled={isLoading}
                />
              </Field>

              <Field>
                <Label htmlFor="balance-amount">Saldo</Label>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>
                      {currencySymbol[account.currency]}
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="balance-amount"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={formatCents(0, account.currency)}
                    value={
                      balanceCents === 0
                        ? ""
                        : formatCents(balanceCents, account.currency)
                    }
                    onChange={(e) =>
                      setBalanceCents(parseCurrencyInput(e.target.value))
                    }
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>{account.currency}</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
                <FieldDescription>
                  Importar um extrato mais recente que essa data substitui o
                  valor pelo saldo do próprio banco.
                </FieldDescription>
              </Field>
            </FieldGroup>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <DialogFooter className="sm:justify-between">
              {snapshotYmd ? (
                <Button
                  type="button"
                  variant="ghost-destructive"
                  disabled={isLoading}
                  onClick={handleRemove}
                >
                  Remover saldo de {formatYmd(snapshotYmd)}
                </Button>
              ) : (
                <span />
              )}

              <div className="flex gap-2">
                <DialogClose
                  render={
                    <Button variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                  }
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <div className="animate-spin">
                      <HugeiconsIcon icon={Loading03Icon} />
                    </div>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
