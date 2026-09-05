"use client";

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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Add01Icon,
  BankIcon,
  BitcoinBagIcon,
  Loading03Icon,
  PiggyBankIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

import { AccountType, CurrencyType } from "@/app/generated/prisma/client";
import { notFound, useRouter } from "next/navigation";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "../ui/input-group";
import { addSpaceAccount } from "@/app/actions/account";
import { ActiveSpace } from "@/lib/space/get-active-space";

const accountOptions = [
  {
    id: "CHECKING",
    name: "Corrente",
    value: "CHECKING",
    icon: <HugeiconsIcon icon={BankIcon} />,
  },
  {
    id: "SAVINGS",
    name: "Caixinha",
    value: "SAVINGS",
    icon: <HugeiconsIcon icon={PiggyBankIcon} />,
  },
  {
    id: "INVESTMENT",
    name: "Investimento",
    value: "INVESTMENT",
    icon: <HugeiconsIcon icon={BitcoinBagIcon} />,
  },
];

const currencyOptions = [
  {
    id: "BRL",
    name: "Real Brasileiro",
    symbol: "R$",
    value: "BRL",
  },
  {
    id: "USD",
    name: "Dólar Americano",
    symbol: "U$",
    value: "USD",
  },
  {
    id: "AUD",
    name: "Dólar Australiano",
    symbol: "A$",
    value: "AUD",
  },
];

export function AddSpaceAccount({ space }: { space: ActiveSpace }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accountName, setAccountName] = useState<string>("");
  const [accountType, setAccountType] = useState<AccountType>("CHECKING");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [currency, setCurrency] = useState<CurrencyType>("BRL");
  const [balance, setBalance] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!space) {
    notFound();
  }

  const resetForm = () => {
    setAccountName("");
    setAccountType("CHECKING");
    setProfileId(null);
    setCurrency("BRL");
    setBalance(0);
    setError(null);
  };

  const formattedBalance = new Intl.NumberFormat(
    currency === "BRL" ? "pt-BR" : currency === "AUD" ? "en-AU" : "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(balance / 100);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const accountData = {
        spaceId: space.id,
        profileId: null,
        name: accountName,
        type: accountType,
        currency: currency,
        balance: balance,
      };
      const spaceAccount = await addSpaceAccount(accountData);

      if (spaceAccount) {
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
        className={buttonVariants({
          variant: "default",
        })}
      >
        <HugeiconsIcon icon={Add01Icon} />
        Adicionar Conta
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            <DialogHeader>
              <DialogTitle>
                Adicionar conta ao espaço{" "}
                <span className="text-lime-600 font-medium">{space.name}</span>
              </DialogTitle>
              <DialogDescription className="flex flex-col gap-2">
                Cadastre uma conta para acompanhar saldos e movimentações dentro
                deste espaço.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <Field className="flex flex-col gap-3">
                <Label htmlFor="account-type">Tipo da conta</Label>
                <RadioGroup
                  value={accountType}
                  onChange={(event) =>
                    setAccountType(
                      (event.target as HTMLInputElement).value as AccountType,
                    )
                  }
                  className="w-full flex gap-2"
                >
                  {accountOptions.map((option) => {
                    return (
                      <FieldLabel
                        key={option.id}
                        htmlFor={option.id}
                        className={
                          accountType === option.value ? "border-lime-500" : ""
                        }
                      >
                        <Field orientation="vertical">
                          <FieldContent>
                            <FieldDescription className="w-full flex justify-center">
                              {option.icon}
                            </FieldDescription>

                            <FieldTitle className="flex items-center justify-between w-full">
                              <div
                                className={`w-full justify-center items-center flex`}
                              >
                                {option.name}
                              </div>
                              <RadioGroupItem
                                value={option.value}
                                id={option.id}
                                className="hidden"
                              />
                            </FieldTitle>
                          </FieldContent>
                        </Field>
                      </FieldLabel>
                    );
                  })}
                </RadioGroup>
              </Field>

              <Field>
                <Label htmlFor="name">Nome da Instituição</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ex: Nubank"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                />
              </Field>

              <Field className="flex flex-col gap-3">
                <Label htmlFor="account-type">Moeda</Label>
                <RadioGroup
                  value={currency}
                  onChange={(event) =>
                    setCurrency(
                      (event.target as HTMLInputElement).value as CurrencyType,
                    )
                  }
                  className="w-full flex gap-2"
                >
                  {currencyOptions.map((option) => {
                    return (
                      <FieldLabel
                        key={option.id}
                        htmlFor={option.id}
                        className={
                          currency === option.value ? "border-lime-500" : ""
                        }
                      >
                        <Field orientation="vertical">
                          <FieldContent>
                            <FieldDescription className="w-full flex justify-center font-bold text-lg">
                              {option.symbol}
                            </FieldDescription>

                            <FieldTitle className="flex items-center justify-between w-full">
                              <div
                                className={`w-full justify-center items-center flex`}
                              >
                                {option.name}
                              </div>
                              <RadioGroupItem
                                value={option.value}
                                id={option.id}
                                className="hidden"
                              />
                            </FieldTitle>
                          </FieldContent>
                        </Field>
                      </FieldLabel>
                    );
                  })}
                </RadioGroup>
              </Field>

              <Field>
                <Label htmlFor="name">Saldo Inicial</Label>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>
                      {
                        currencyOptions.find(
                          (option) => option.value === currency,
                        )?.symbol
                      }
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="0.00"
                    value={formattedBalance}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");

                      setBalance(Number(digits));
                    }}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>
                      {
                        currencyOptions.find(
                          (option) => option.value === currency,
                        )?.value
                      }
                    </InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
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
              <Button type="submit" disabled={!accountName.trim() || isLoading}>
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
