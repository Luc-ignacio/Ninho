import { TransactionMethod } from "@/app/generated/prisma/enums";
import { transactionMethodLabel } from "@/lib/utils";
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

export default function SelectTransactionMethod({
  inputLabel = "Forma de pagamento",
  value,
  onValueChange,
  exclude = [],
}: {
  inputLabel?: string;
  value: TransactionMethod;
  onValueChange: (method: TransactionMethod) => void;
  exclude?: TransactionMethod[];
}) {
  const options = Object.values(TransactionMethod)
    .filter((method) => !exclude.includes(method))
    .map((method) => ({
      value: method,
      label: transactionMethodLabel[method],
    }));

  return (
    <Field>
      <Label>{inputLabel}</Label>
      <Select
        items={options}
        value={value}
        onValueChange={(next) => onValueChange(next as TransactionMethod)}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          <SelectGroup>
            <SelectLabel>Formas de pagamento</SelectLabel>
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
