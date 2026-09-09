import * as React from "react";
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
import { SpaceMember } from "@/lib/space/queries";

export default function SelectSpaceMember({
  members,
  inputLabel,
  value,
  onValueChange,
}: {
  members: SpaceMember[];
  inputLabel: string;
  value: string | null;
  onValueChange: (profileId: string | null) => void;
}) {
  return (
    <Field>
      <Label htmlFor="role">{inputLabel}</Label>
      <Select
        items={members.map((member) => ({
          value: member.Profile.id,
          label: member.Profile.name,
        }))}
        value={value}
        onValueChange={onValueChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          <SelectGroup>
            <SelectLabel>Membros</SelectLabel>
            {members.map((member) => (
              <SelectItem key={member.Profile.id} value={member.Profile.id}>
                {member.Profile.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}
