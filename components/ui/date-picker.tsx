"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatYmd, toYmd, ymdToUtcDate } from "@/lib/utils";
import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

export function DatePicker({
  id,
  value,
  onValueChange,
  disabled,
}: {
  id?: string;
  value: string; // "YYYY-MM-DD"
  onValueChange: (ymd: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  // O calendário trabalha com `Date` local, então o valor é remontado a partir
  // dos componentes UTC — passar `ymdToUtcDate` direto exibiria o dia anterior
  // em fusos negativos.
  const utc = ymdToUtcDate(value);
  const selected = Number.isNaN(utc.getTime())
    ? undefined
    : new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full justify-start font-normal"
          >
            <HugeiconsIcon icon={Calendar03Icon} />
            {selected ? formatYmd(value) : "Selecione uma data"}
          </Button>
        }
      />

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={ptBR}
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (!date) return;

            // `react-day-picker` devolve um `Date` local — `toYmd` usa os
            // getters locais, nunca `toISOString()`.
            onValueChange(toYmd(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
