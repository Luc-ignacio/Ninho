"use client";

import type { ActiveSpace } from "@/lib/space/get-active-space";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import SelectSpaceAccount from "@/components/space/select-space-account";
import SelectSpaceCreditCard from "@/components/space/select-space-credit-card";

export type TargetKind = "account" | "card";

export default function ImportTargetPicker({
  space,
  kind,
  accountId,
  creditCardId,
  onKindChange,
  onAccountChange,
  onCreditCardChange,
}: {
  space: NonNullable<ActiveSpace>;
  kind: TargetKind;
  accountId: string | null;
  creditCardId: string | null;
  onKindChange: (kind: TargetKind) => void;
  onAccountChange: (accountId: string | null) => void;
  onCreditCardChange: (creditCardId: string | null) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-4">
      <Field>
        <Label>O arquivo é de</Label>
        <RadioGroup
          value={kind}
          onValueChange={(next) => onKindChange(next as TargetKind)}
          className="grid-cols-2"
        >
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm has-data-checked:border-primary">
            <RadioGroupItem value="account" />
            Extrato de conta
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm has-data-checked:border-primary">
            <RadioGroupItem value="card" />
            Fatura de cartão
          </label>
        </RadioGroup>
      </Field>

      {kind === "account" ? (
        <SelectSpaceAccount
          accounts={space.Accounts}
          inputLabel="Conta"
          value={accountId}
          onValueChange={onAccountChange}
        />
      ) : (
        <SelectSpaceCreditCard
          creditCards={space.CreditCards}
          value={creditCardId}
          onValueChange={onCreditCardChange}
        />
      )}
    </div>
  );
}
