import { BirdhouseIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default function TemplatePage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center flex flex-col gap-2 justify-center items-center">
        <HugeiconsIcon icon={BirdhouseIcon} size={64} />
        Template page.
      </div>
    </div>
  );
}
