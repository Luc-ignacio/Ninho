"use client";

import { addSpaceTransaction } from "@/app/actions/transaction";
import {
  CurrencyType,
  TransactionMethod,
  TransactionType,
} from "@/app/generated/prisma/enums";
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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActiveSpace } from "@/lib/space/get-active-space";
import {
  currencySymbol,
  formatCents,
  formatCurrency,
  parseCurrencyInput,
  splitInstallmentCents,
  todayYmd,
} from "@/lib/utils";
import {
  Add01Icon,
  ArrowDataTransferHorizontalIcon,
  CreditCardIcon,
  Loading03Icon,
  MoneyReceive01Icon,
  MoneySend01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { notFound, useRouter } from "next/navigation";
import { useState } from "react";
import SelectSpaceAccount from "./select-space-account";
import SelectSpaceCategory from "./select-space-category";
import SelectSpaceCreditCard from "./select-space-credit-card";
import SelectSpaceMember from "./select-space-member";
import SelectTransactionMethod from "./select-transaction-method";

const typeOptions = [
  {
    value: "INCOME",
    name: "Receita",
    icon: <HugeiconsIcon icon={MoneyReceive01Icon} />,
  },
  {
    value: "EXPENSE",
    name: "Despesa",
    icon: <HugeiconsIcon icon={MoneySend01Icon} />,
  },
  {
    value: "TRANSFER",
    name: "Transferência",
    icon: <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} />,
  },
  {
    value: "CREDIT_CARD_PAYMENT",
    name: "Fatura",
    icon: <HugeiconsIcon icon={CreditCardIcon} />,
  },
];

const installmentOptions = [
  { value: "1", label: "À vista" },
  ...Array.from({ length: 23 }, (_, index) => ({
    value: String(index + 2),
    label: `${index + 2}x`,
  })),
];

// Forma de pagamento padrão por tipo. `CREDIT_CARD` nunca é oferecido: ele é
// forçado pelo servidor quando a despesa é no cartão.
const defaultMethod: Record<TransactionType, TransactionMethod> = {
  INCOME: "PIX",
  EXPENSE: "PIX",
  TRANSFER: "PIX",
  CREDIT_CARD_PAYMENT: "BANK_TRANSFER",
};

export function AddSpaceTransaction({
  space,
  defaultAccountId,
  variant = "default",
  label = "Adicionar Transação",
}: {
  space: ActiveSpace;
  defaultAccountId?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  label?: string;
}) {
  const router = useRouter();
  const defaultProfileId =
    space?.Members.find((member) => member.role === "OWNER")?.Profile.id ??
    null;

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [payWithCard, setPayWithCard] = useState(false);
  const [method, setMethod] = useState<TransactionMethod>("PIX");
  const [dateYmd, setDateYmd] = useState(todayYmd());
  const [description, setDescription] = useState("");
  const [amountCents, setAmountCents] = useState(0);
  const [originAccountId, setOriginAccountId] = useState<string | null>(
    defaultAccountId ?? null,
  );
  const [destinationAccountId, setDestinationAccountId] = useState<
    string | null
  >(null);
  const [creditCardId, setCreditCardId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [installments, setInstallments] = useState("1");
  const [profileId, setProfileId] = useState<string | null>(defaultProfileId);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!space) {
    notFound();
  }

  const resetForm = () => {
    setType("EXPENSE");
    setPayWithCard(false);
    setMethod("PIX");
    setDateYmd(todayYmd());
    setDescription("");
    setAmountCents(0);
    setOriginAccountId(defaultAccountId ?? null);
    setDestinationAccountId(null);
    setCreditCardId(null);
    setCategoryId(null);
    setInstallments("1");
    setProfileId(defaultProfileId);
    setError(null);
  };

  // Trocar o tipo limpa as FKs que o novo tipo não aceita — senão uma conta de
  // destino escolhida em "Receita" sobreviveria até o submit de "Despesa" e o
  // servidor recusaria com uma mensagem confusa.
  const handleTypeChange = (next: TransactionType) => {
    setType(next);
    setMethod(defaultMethod[next]);
    setPayWithCard(false);
    setCreditCardId(null);
    setInstallments("1");
    setDestinationAccountId(
      next === "INCOME" ? (defaultAccountId ?? null) : null,
    );
    setOriginAccountId(next === "INCOME" ? null : (defaultAccountId ?? null));
    setProfileId(next === "INCOME" ? null : defaultProfileId);

    if (next === "TRANSFER" || next === "CREDIT_CARD_PAYMENT") {
      setCategoryId(null);
    }
  };

  const isCardExpense = type === "EXPENSE" && payWithCard;
  const showOrigin =
    type === "TRANSFER" ||
    type === "CREDIT_CARD_PAYMENT" ||
    (type === "EXPENSE" && !payWithCard);
  const showDestination = type === "INCOME" || type === "TRANSFER";
  const showCard = isCardExpense || type === "CREDIT_CARD_PAYMENT";
  const showCategory = type === "INCOME" || type === "EXPENSE";
  const showProfile = type !== "INCOME";

  // A moeda vem da conta envolvida. Numa despesa no cartão não há conta, então
  // vem da conta que paga a fatura daquele cartão.
  const selectedCard = space.CreditCards.find((c) => c.id === creditCardId);
  const account =
    space.Accounts.find((a) => a.id === originAccountId) ??
    space.Accounts.find((a) => a.id === destinationAccountId);
  const currency: CurrencyType =
    account?.currency ?? selectedCard?.Account?.currency ?? "BRL";

  const installmentCount = Number(installments);
  const availableCents = selectedCard?.availableCents ?? null;
  const exceedsLimit =
    isCardExpense && availableCents !== null && amountCents > availableCents;

  const hasRequiredFks =
    (!showOrigin || !!originAccountId) &&
    (!showDestination || !!destinationAccountId) &&
    (!showCard || !!creditCardId);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const transaction = await addSpaceTransaction({
        type,
        method,
        date: dateYmd,
        description,
        amountCents,
        originAccountId: showOrigin ? originAccountId : null,
        destinationAccountId: showDestination ? destinationAccountId : null,
        creditCardId: showCard ? creditCardId : null,
        categoryId: showCategory ? categoryId : null,
        profileId: showProfile ? profileId : null,
        installments: isCardExpense ? installmentCount : 1,
      });

      if (transaction) {
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
      <DialogTrigger className={buttonVariants({ variant })}>
        <HugeiconsIcon icon={Add01Icon} />
        {label}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            <DialogHeader>
              <DialogTitle>
                Adicionar transação ao espaço{" "}
                <span className="text-lime-600 font-medium">{space.name}</span>
              </DialogTitle>
              <DialogDescription className="flex flex-col gap-2">
                Registre uma movimentação para acompanhar saldos e gastos.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <Field className="flex flex-col gap-3">
                <Label>Tipo</Label>
                <RadioGroup
                  value={type}
                  onChange={(event) =>
                    handleTypeChange(
                      (event.target as HTMLInputElement)
                        .value as TransactionType,
                    )
                  }
                  className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2"
                >
                  {typeOptions.map((option) => (
                    <FieldLabel
                      key={option.value}
                      htmlFor={`tx-type-${option.value}`}
                      className={type === option.value ? "border-lime-500" : ""}
                    >
                      <Field orientation="vertical">
                        <FieldContent>
                          <FieldDescription className="w-full flex justify-center">
                            {option.icon}
                          </FieldDescription>

                          <FieldTitle className="flex items-center justify-between w-full">
                            <div className="w-full justify-center items-center flex text-center">
                              {option.name}
                            </div>
                            <RadioGroupItem
                              value={option.value}
                              id={`tx-type-${option.value}`}
                              className="hidden"
                            />
                          </FieldTitle>
                        </FieldContent>
                      </Field>
                    </FieldLabel>
                  ))}
                </RadioGroup>
              </Field>

              {type === "EXPENSE" && (
                <Field className="flex flex-col gap-3">
                  <Label>Pago com</Label>
                  <RadioGroup
                    value={payWithCard ? "card" : "account"}
                    onChange={(event) => {
                      const nextIsCard =
                        (event.target as HTMLInputElement).value === "card";

                      setPayWithCard(nextIsCard);
                      // Cada modo usa uma FK diferente; a outra precisa sair.
                      setOriginAccountId(
                        nextIsCard ? null : (defaultAccountId ?? null),
                      );
                      setCreditCardId(null);
                      setInstallments("1");
                      setMethod(nextIsCard ? "CREDIT_CARD" : "PIX");
                    }}
                    className="w-full grid grid-cols-2 gap-2"
                  >
                    {[
                      { value: "account", name: "Conta" },
                      { value: "card", name: "Cartão de crédito" },
                    ].map((option) => (
                      <FieldLabel
                        key={option.value}
                        htmlFor={`tx-paidwith-${option.value}`}
                        className={
                          (payWithCard ? "card" : "account") === option.value
                            ? "border-lime-500"
                            : ""
                        }
                      >
                        <Field orientation="vertical">
                          <FieldContent>
                            <FieldTitle className="flex items-center justify-between w-full">
                              <div className="w-full justify-center items-center flex">
                                {option.name}
                              </div>
                              <RadioGroupItem
                                value={option.value}
                                id={`tx-paidwith-${option.value}`}
                                className="hidden"
                              />
                            </FieldTitle>
                          </FieldContent>
                        </Field>
                      </FieldLabel>
                    ))}
                  </RadioGroup>
                </Field>
              )}

              {showOrigin && (
                <SelectSpaceAccount
                  accounts={space.Accounts}
                  inputLabel={
                    type === "CREDIT_CARD_PAYMENT"
                      ? "Conta que pagou"
                      : "Conta de origem"
                  }
                  value={originAccountId}
                  onValueChange={setOriginAccountId}
                  excludeAccountId={
                    type === "TRANSFER" ? destinationAccountId : null
                  }
                />
              )}

              {showDestination && (
                <SelectSpaceAccount
                  accounts={space.Accounts}
                  inputLabel="Conta de destino"
                  value={destinationAccountId}
                  onValueChange={setDestinationAccountId}
                  excludeAccountId={
                    type === "TRANSFER" ? originAccountId : null
                  }
                />
              )}

              {showCard && (
                <SelectSpaceCreditCard
                  creditCards={space.CreditCards}
                  inputLabel={
                    type === "CREDIT_CARD_PAYMENT"
                      ? "Cartão da fatura"
                      : "Cartão"
                  }
                  value={creditCardId}
                  onValueChange={setCreditCardId}
                />
              )}

              <Field>
                <Label htmlFor="tx-description">Descrição</Label>
                <Input
                  id="tx-description"
                  type="text"
                  placeholder="Ex: Mercado do mês"
                  required
                  maxLength={200}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field>

              <Field>
                <Label htmlFor="tx-amount">Valor</Label>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>{currencySymbol[currency]}</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="tx-amount"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={formatCents(0, currency)}
                    value={
                      amountCents === 0
                        ? ""
                        : formatCents(amountCents, currency)
                    }
                    onChange={(e) =>
                      setAmountCents(parseCurrencyInput(e.target.value))
                    }
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>{currency}</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </Field>

              {isCardExpense && (
                <Field>
                  <Label>Parcelamento</Label>
                  <Select
                    items={installmentOptions}
                    value={installments}
                    onValueChange={(value) => setInstallments(value ?? "1")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Parcelas</SelectLabel>
                        {installmentOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  {installmentCount > 1 && amountCents > 0 && (
                    <span className="text-sm text-olive-600">
                      {installmentCount}x de{" "}
                      {formatCurrency(
                        splitInstallmentCents(amountCents, installmentCount)[0],
                        currency,
                      )}
                      {" • total "}
                      {formatCurrency(amountCents, currency)}
                    </span>
                  )}
                </Field>
              )}

              {isCardExpense && availableCents !== null && (
                <span
                  className={
                    exceedsLimit
                      ? "text-sm font-medium text-red-600"
                      : "text-sm text-olive-600"
                  }
                >
                  {exceedsLimit
                    ? `Essa compra ultrapassa o limite disponível de ${formatCurrency(availableCents, currency)}`
                    : `Limite disponível: ${formatCurrency(availableCents, currency)}`}
                </span>
              )}

              <Field>
                <Label htmlFor="tx-date">Data</Label>
                <DatePicker
                  id="tx-date"
                  value={dateYmd}
                  onValueChange={setDateYmd}
                />
              </Field>

              {showCategory && (
                <SelectSpaceCategory
                  categories={space.Categories}
                  value={categoryId}
                  onValueChange={setCategoryId}
                />
              )}

              {!isCardExpense && (
                <SelectTransactionMethod
                  value={method}
                  onValueChange={setMethod}
                  exclude={["CREDIT_CARD"]}
                />
              )}

              {showProfile && (
                <SelectSpaceMember
                  members={space.Members}
                  inputLabel="Responsável"
                  value={profileId}
                  onValueChange={setProfileId}
                />
              )}
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
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  !description.trim() ||
                  amountCents <= 0 ||
                  !hasRequiredFks
                }
              >
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
