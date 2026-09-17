"use client";

import { createSpace, setActiveSpace } from "@/app/actions/space";
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
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Add01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type CreateSpaceProps = {
  className?: string;
  /** Controlled open state. When provided, the default trigger is not rendered. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CreateSpace({
  className,
  open: controlledOpen,
  onOpenChange,
}: CreateSpaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setError(null);
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const space = await createSpace(name);

      if (space) {
        resetForm();
        setOpen(false);

        await setActiveSpace(space.id);

        if (pathname === "/onboarding") {
          router.push("/");
        } else {
          router.refresh();
        }
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Algo deu errado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger
          className={cn(buttonVariants({ variant: "default" }), className)}
        >
          <HugeiconsIcon icon={Add01Icon} /> Criar Espaço
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto no-scrollbar">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            <DialogHeader>
              <DialogTitle>Criar espaço</DialogTitle>
              <DialogDescription>
                Organize contas, cartões e transações em um espaço e compartilhe
                com outras pessoas quando quiser.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <Field>
                <Label htmlFor="name">Nome do espaço</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ex: Família"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
            </FieldGroup>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <DialogFooter>
              <DialogClose
                render={
                  <Button variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                }
              />

              <Button type="submit" disabled={!name.trim() || isLoading}>
                {isLoading ? (
                  <div className="animate-spin">
                    <HugeiconsIcon icon={Loading03Icon} />
                  </div>
                ) : (
                  "Criar"
                )}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
