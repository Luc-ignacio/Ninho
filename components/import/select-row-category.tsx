"use client";

import type { SpaceCategory } from "@/lib/space/queries";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NO_CATEGORY = "__none__";
const NEW_CATEGORY_PREFIX = "__new__:";

export interface RowCategory {
  categoryId: string | null;
  newCategoryName: string | null;
}

export default function SelectRowCategory({
  categories,
  suggestedNames,
  value,
  disabled,
  onValueChange,
}: {
  categories: SpaceCategory[];
  suggestedNames: string[];
  value: RowCategory;
  disabled?: boolean;
  onValueChange: (next: RowCategory) => void;
}) {
  const options = [
    { value: NO_CATEGORY, label: "Sem categoria" },
    ...categories.map((category) => ({
      value: category.id,
      label: category.name,
    })),
    ...suggestedNames.map((name) => ({
      value: `${NEW_CATEGORY_PREFIX}${name}`,
      label: `Criar "${name}"`,
    })),
  ];

  const current = value.newCategoryName
    ? `${NEW_CATEGORY_PREFIX}${value.newCategoryName}`
    : (value.categoryId ?? NO_CATEGORY);

  return (
    <Select
      items={options}
      value={current}
      disabled={disabled}
      onValueChange={(next) => {
        const selected = next as string;

        if (selected === NO_CATEGORY) {
          onValueChange({ categoryId: null, newCategoryName: null });
          return;
        }

        if (selected.startsWith(NEW_CATEGORY_PREFIX)) {
          onValueChange({
            categoryId: null,
            newCategoryName: selected.slice(NEW_CATEGORY_PREFIX.length),
          });
          return;
        }

        onValueChange({ categoryId: selected, newCategoryName: null });
      }}
    >
      <SelectTrigger size="sm" className="w-44">
        <SelectValue placeholder="Sem categoria" />
      </SelectTrigger>

      <SelectContent>
        <SelectGroup>
          <SelectLabel>Categorias</SelectLabel>
          {options
            .filter((option) => !option.value.startsWith(NEW_CATEGORY_PREFIX))
            .map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
        </SelectGroup>

        {suggestedNames.length > 0 && (
          <SelectGroup>
            <SelectLabel>Criar categoria</SelectLabel>
            {options
              .filter((option) => option.value.startsWith(NEW_CATEGORY_PREFIX))
              .map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
