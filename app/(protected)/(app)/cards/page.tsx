import { AddSpaceCreditCard } from "@/components/space/add-credit-card";
import { CreditCardItem } from "@/components/space/credit-card-item";
import { EmptyState } from "@/components/ui/empty-state";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getActiveSpace } from "@/lib/space/get-active-space";
import { CreditCardIcon } from "@hugeicons/core-free-icons";
import { notFound } from "next/navigation";

export default async function CardsPage() {
  const space = await getActiveSpace();

  if (!space) {
    notFound();
  }

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-6 rounded-2xl p-6 pb-12">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xl font-medium">Cartões</span>
          <span className="text-sm text-olive-600">
            Acompanhe faturas e limites dos cartões.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <AddSpaceCreditCard space={space} />
          <SidebarTrigger size="icon-lg" />
        </div>
      </div>

      {space.CreditCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {space.CreditCards.map((creditCard, index) => (
            <CreditCardItem
              key={creditCard.id}
              space={space}
              creditCard={creditCard}
              index={index}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CreditCardIcon}
          title="Nenhum cartão ainda"
          description="Adicione um cartão para acompanhar faturas e parcelamentos."
          action={<AddSpaceCreditCard space={space} />}
        />
      )}
    </div>
  );
}
