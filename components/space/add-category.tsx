"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Add01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { ActiveSpace } from "@/lib/space/get-active-space";
import { cn } from "@/lib/utils";
import { addSpaceCategory } from "@/app/actions/category";

export function AddSpaceCategory({
  space,
  className,
}: {
  space: ActiveSpace;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!space) {
    notFound();
  }

  const resetForm = () => {
    setCategory("");
    setError(null);
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const spaceCategory = await addSpaceCategory(space.id, category);

      if (spaceCategory) {
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
        className={cn(buttonVariants({ variant: "default" }), className)}
      >
        <HugeiconsIcon icon={Add01Icon} />
        <span className="truncate">Adicionar Categoria</span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto no-scrollbar">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            <DialogHeader className="space-y-1">
              <DialogTitle>
                Adicionar categoria ao espaço{" "}
                <span className="text-lime-600 font-medium">{space.name}</span>
              </DialogTitle>

              {/* <DialogDescription>
                Adicione categorias para organizar suas transações.
              </DialogDescription> */}
            </DialogHeader>

            <div className="space-y-2">
              <Field>
                <Label htmlFor="category">Nome da categoria</Label>
                <Input
                  id="category"
                  type="text"
                  placeholder="Ex: Mercado"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
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
              <Button type="submit" disabled={!category.trim() || isLoading}>
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
