import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: IconSvgElement;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("min-h-40", className)}>
      <CardContent className="flex flex-col flex-1 items-center justify-center space-y-4">
        <div className="p-4 bg-accent rounded-xl">
          <HugeiconsIcon icon={icon} />
        </div>

        <div className="flex flex-col items-center text-center">
          <span className="font-bold text-base">{title}</span>

          <span className="text-muted-foreground">{description}</span>
        </div>

        {action}
      </CardContent>
    </Card>
  );
}
