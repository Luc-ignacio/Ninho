import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSpacesByProfile } from "@/lib/space/queries";
import { getActiveSpace } from "@/lib/space/get-active-space";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const spaces = await getSpacesByProfile();
  const activeSpace = await getActiveSpace();

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar
          variant="inset"
          spaces={spaces}
          activeSpaceId={activeSpace?.id}
        />
        <SidebarInset>
          <div className="relative flex w-full min-w-0 flex-1 flex-col">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
