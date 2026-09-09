import { SpaceAccount } from "@/lib/space/queries";
import { accountTypeLabel } from "@/lib/utils";
import { Field } from "../ui/field";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export default function SelectSpaceAccount({
  accounts,
  inputLabel,
  value,
  onValueChange,
  excludeAccountId = null,
  placeholder = "Selecione uma conta",
}: {
  accounts: SpaceAccount[];
  inputLabel: string;
  value: string | null;
  onValueChange: (accountId: string | null) => void;
  excludeAccountId?: string | null;
  placeholder?: string;
}) {
  const options = accounts
    .filter(
      (account) => account.isActive && account.id !== excludeAccountId,
    )
    .map((account) => ({
      value: account.id,
      label: `${account.name} · ${accountTypeLabel[account.type]}`,
    }));

  return (
    <Field>
      <Label>{inputLabel}</Label>
      {/* O base-ui usa `items` para o rótulo do gatilho e os filhos para as
          opções — os dois precisam ficar em sincronia. */}
      <Select items={options} value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          <SelectGroup>
            <SelectLabel>Contas</SelectLabel>
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
