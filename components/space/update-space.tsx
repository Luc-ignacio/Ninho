"use client";

import { renameSpace } from "@/app/actions/space";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActiveSpace } from "@/lib/space/get-active-space";
import { cn } from "@/lib/utils";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { notFound, useRouter } from "next/navigation";
import { useState } from "react";

type UpdateSpaceProps = {
  space: ActiveSpace;
  className?: string;
};

export function UpdateSpace({ space, className }: UpdateSpaceProps) {
  if (!space) {
    notFound();
  }

  const router = useRouter();
  const [newName, setNewName] = useState(space.name);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const updatedSpace = await renameSpace(space.id, newName);

      if (updatedSpace) {
        setNewName(updatedSpace.name);
        router.refresh();
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Algo deu errado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)}>
      <div className="flex flex-col gap-6 w-full">
        <FieldGroup>
          <Field>
            <Label htmlFor="name">Nome do espaço</Label>
            <div className="flex items-center gap-2">
              <Input
                id="name"
                type="text"
                placeholder="Ex: Família"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Button
                type="submit"
                disabled={
                  !newName.trim() || newName.trim() === space.name || isLoading
                }
              >
                {isLoading ? (
                  <div className="animate-spin">
                    <HugeiconsIcon icon={Loading03Icon} />
                  </div>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </Field>
        </FieldGroup>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </form>
  );
}
