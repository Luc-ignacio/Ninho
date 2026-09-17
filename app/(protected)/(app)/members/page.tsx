import { AddSpaceMember } from "@/components/space/add-member";
import { RemoveSpaceMember } from "@/components/space/remove-member";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { PageHeader } from "@/components/ui/page-header";
import { getActiveSpace } from "@/lib/space/get-active-space";
import { notFound } from "next/navigation";

export default async function MembersPage() {
  const space = await getActiveSpace();
  if (!space) {
    notFound();
  }

  const spaceOwner = space?.Members.find((member) => member.role === "OWNER");
  if (!spaceOwner) {
    notFound();
  }

  const memberInitials = (memberName: string) => {
    return memberName
      .toUpperCase()
      .split(" ")
      .map((item) => item.slice(0, 1))
      .join("");
  };

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-6 rounded-2xl p-4 pb-12 sm:p-6 sm:pb-12">
      <PageHeader
        title="Membros"
        description="Gerencie quem faz parte deste espaço."
        actions={
          <AddSpaceMember space={space} className="flex-1 sm:flex-none" />
        }
      />

      {space.Members.length > 1 ? (
        space.Members.map((member) => (
          <Item
            variant="outline"
            className="bg-white shadow-md"
            key={member.id}
          >
            <Avatar className="h-8 w-8 rounded-full grayscale">
              <AvatarFallback className="rounded-full">
                {memberInitials(member.Profile.name)}
              </AvatarFallback>
            </Avatar>

            <ItemContent>
              <ItemTitle>{member.Profile.name}</ItemTitle>
              <ItemDescription>{member.Profile.email}</ItemDescription>
            </ItemContent>

            <ItemActions>
              <Badge variant="secondary" className="text-olive-600">
                {member.role === "OWNER"
                  ? "Proprietário"
                  : member.role === "ADMIN"
                    ? "Administrador"
                    : "Membro"}
              </Badge>
              {member.role !== "OWNER" && (
                <RemoveSpaceMember space={space} spaceMember={member} />
              )}
            </ItemActions>
          </Item>
        ))
      ) : (
        <div>
          <Item variant="outline" className="bg-white shadow-md">
            <Avatar className="h-8 w-8 rounded-full grayscale">
              <AvatarFallback className="rounded-full">
                {memberInitials(spaceOwner.Profile.name)}
              </AvatarFallback>
            </Avatar>

            <ItemContent>
              <ItemTitle>{spaceOwner.Profile.name}</ItemTitle>
              <ItemDescription>{spaceOwner.Profile.email}</ItemDescription>
            </ItemContent>

            <ItemActions>
              <Badge variant="secondary" className="text-olive-600">
                {spaceOwner.role === "OWNER"
                  ? "Proprietário"
                  : spaceOwner.role === "ADMIN"
                    ? "Administrador"
                    : "Membro"}
              </Badge>
            </ItemActions>
          </Item>

          <div className="flex flex-col flex-1 items-center justify-center min-h-40 text-center">
            <span className="font-bold text-base">
              Nenhuma outra pessoa neste espaço ainda
            </span>

            <span className="text-muted-foreground text-sm">
              Adicione alguém para organizar as finanças junto com você.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
