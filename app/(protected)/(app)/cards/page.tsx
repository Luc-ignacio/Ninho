import { AddSpaceCreditCard } from "@/components/space/add-credit-card";
import { CreditCardItem } from "@/components/space/credit-card-item";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getActiveSpace } from "@/lib/space/get-active-space";
import { CreditCardIcon } from "@hugeicons/core-free-icons";
import { notFound } from "next/navigation";

export default async function CardsPage() {
  const space = await getActiveSpace();

  if (!space) {
    notFound();
  }

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-6 rounded-2xl p-4 pb-12 sm:p-6 sm:pb-12">
      <PageHeader
        title="Cartões"
        description="Acompanhe faturas e limites dos cartões."
        actions={
          <AddSpaceCreditCard space={space} className="flex-1 sm:flex-none" />
        }
      />

      {space.CreditCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
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
