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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Add01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { addSpaceMember } from "@/app/actions/space-member";
import { notFound, useRouter } from "next/navigation";
import { ActiveSpace } from "@/lib/space/get-active-space";
import { SpaceRole } from "@/app/generated/prisma/enums";

export function AddSpaceMember({ space }: { space: ActiveSpace }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<SpaceRole>("MEMBER");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!space) {
    notFound();
  }

  const RoleOptions: { value: SpaceRole; label: string }[] = [
    { value: "ADMIN", label: "Administrador" },
    { value: "MEMBER", label: "Membro" },
  ];

  const resetForm = () => {
    setEmail("");
    setRole("MEMBER");
    setError(null);
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const spaceMember = await addSpaceMember(space.id, email, role);

      if (spaceMember) {
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
        Adicionar Membro
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            <DialogHeader className="space-y-1">
              <DialogTitle>
                Adicionar membro ao espaço{" "}
                <span className="text-lime-600 font-medium">{space.name}</span>
              </DialogTitle>

              <DialogDescription>
                Adicione membros para compartilhar e acompanhar as finanças
                deste espaço com você.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Field>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="lucas@ninho.com.br"
                  required
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value.toLowerCase().trim())
                  }
                />
                <span className="text-xs text-muted-foreground">
                  Atenção: O email adicionado precisa ter uma conta cadastrada
                  no ninho.
                </span>
              </Field>

              <Field>
                <Label htmlFor="role">Cargo</Label>
                <Select
                  items={RoleOptions}
                  value={role}
                  onValueChange={(value) => {
                    if (value) setRole(value);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Cargos</SelectLabel>
                      {RoleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <DialogFooter>
              <DialogClose
                render={
                  <Button variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                }
              />
              <Button type="submit" disabled={!email.trim() || isLoading}>
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
