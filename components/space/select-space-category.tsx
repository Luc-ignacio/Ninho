import { SpaceCategory } from "@/lib/space/queries";
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

const NO_CATEGORY = "__none__";

export default function SelectSpaceCategory({
  categories,
  inputLabel = "Categoria",
  value,
  onValueChange,
}: {
  categories: SpaceCategory[];
  inputLabel?: string;
  value: string | null;
  onValueChange: (categoryId: string | null) => void;
}) {
  // Categoria é opcional, então a primeira opção limpa a seleção. O sentinela
  // evita depender de `null` como `value` de um item.
  const options = [
    { value: NO_CATEGORY, label: "Sem categoria" },
    ...categories.map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ];

  return (
    <Field>
      <Label>{inputLabel}</Label>
      <Select
        items={options}
        value={value ?? NO_CATEGORY}
        onValueChange={(next) =>
          onValueChange(next === NO_CATEGORY ? null : (next as string))
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Sem categoria" />
        </SelectTrigger>

        <SelectContent>
          <SelectGroup>
            <SelectLabel>Categorias</SelectLabel>
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
