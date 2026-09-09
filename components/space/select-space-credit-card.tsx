import { SpaceCreditCard } from "@/lib/space/queries";
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

export default function SelectSpaceCreditCard({
  creditCards,
  inputLabel = "Cartão",
  value,
  onValueChange,
  placeholder = "Selecione um cartão",
}: {
  creditCards: SpaceCreditCard[];
  inputLabel?: string;
  value: string | null;
  onValueChange: (creditCardId: string | null) => void;
  placeholder?: string;
}) {
  const options = creditCards
    .filter((creditCard) => creditCard.isActive)
    .map((creditCard) => ({
      value: creditCard.id,
      label: creditCard.lastFour
        ? `${creditCard.name} •••• ${creditCard.lastFour}`
        : creditCard.name,
    }));

  return (
    <Field>
      <Label>{inputLabel}</Label>
      <Select items={options} value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          <SelectGroup>
            <SelectLabel>Cartões</SelectLabel>
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
