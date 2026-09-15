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
import { SidebarTrigger } from "@/components/ui/sidebar";
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
    <div className="flex w-full min-w-0 max-w-full flex-col gap-6 rounded-2xl p-6 pb-12">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xl font-medium">Membros</span>
          <span className="text-sm text-olive-600">
            Gerencie quem faz parte deste espaço.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <AddSpaceMember space={space} />
          <SidebarTrigger size="icon-lg" />
        </div>
      </div>

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

          <div className="flex flex-col flex-1 items-center justify-center min-h-40">
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
