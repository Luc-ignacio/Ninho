import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  eyebrow,
  description,
  badge,
  back,
  actions,
  className,
}: {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  back?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-3",
        className,
      )}
    >
      {back && <div className="order-1 flex flex-1">{back}</div>}

      <div
        className={cn(
          "flex min-w-0 flex-col",
          back ? "order-3 w-full sm:order-4" : "order-1 flex-1",
        )}
      >
        {eyebrow && <span className="text-sm text-olive-600">{eyebrow}</span>}

        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-lg font-medium sm:text-xl">
            {title}
          </span>
          {badge}
        </div>

        {description && (
          <span className="text-sm text-olive-600">{description}</span>
        )}
      </div>

      <SidebarTrigger size="icon-lg" className="order-2 shrink-0 sm:order-3" />

      {actions && (
        <div
          className={cn(
            "flex w-full items-center gap-2 sm:order-2 sm:w-auto",
            back ? "order-4" : "order-3",
          )}
        >
          {actions}
        </div>
      )}
    </div>
  );
}
