import { CreateSpace } from "@/components/space/create-space";
import { BirdhouseIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default function OnboardingPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center flex flex-col gap-8 justify-center items-center">
        <div className="flex flex-col justify-center items-center gap-2">
          <HugeiconsIcon icon={BirdhouseIcon} size={64} />

          <h2 className="text-xl font-medium">Bem Vindo ao Ninho!</h2>

          <p>
            Crie seu primeiro espaço para começar a organizar as suas finanças
            pessoais, da sua família ou em grupo.
          </p>
        </div>

        <CreateSpace />
      </div>
    </div>
  );
}
