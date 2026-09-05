import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { redirect } from "next/navigation";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-linear-to-b from-lime-50 to-lime-100">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Obrigado por se cadastrar!
              </CardTitle>
              <CardDescription>
                Verifique seu e-mail para confirmar
              </CardDescription>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground">
                Seu cadastro foi feito com sucesso. Confira seu e-mail para
                confirmar sua conta antes de entrar.
              </p>
            </CardContent>

            <CardFooter>
              <Button onClick={redirect("/auth/login")} className="w-full">
                <HugeiconsIcon icon={ArrowLeft02Icon} /> Voltar para o login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
