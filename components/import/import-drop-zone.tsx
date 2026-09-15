"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Cancel01Icon,
  CloudUploadIcon,
  File01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const ACCEPTED_EXTENSIONS = [".ofx"] as const;
const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.join(",");

function hasAcceptedExtension(fileName: string) {
  const lower = fileName.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ImportDropZoneProps {
  className?: string;
  file?: File | null;
  disabled?: boolean;
  onFileSelected?: (file: File | null) => void;
}

export function ImportDropZone({
  className,
  file: controlledFile,
  disabled,
  onFileSelected,
}: ImportDropZoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dragDepth = React.useRef(0);

  const [internalFile, setInternalFile] = React.useState<File | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const file = controlledFile !== undefined ? controlledFile : internalFile;

  const selectFile = (next: File | null) => {
    if (next && !hasAcceptedExtension(next.name)) {
      setError("Formato não suportado. Envie um arquivo .ofx.");
      return;
    }

    setError(null);
    setInternalFile(next);
    onFileSelected?.(next);
  };

  const openPicker = () => inputRef.current?.click();

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0] ?? null);
  };

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={(event) => {
          selectFile(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />

      {file ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3.5 text-sm">
          <HugeiconsIcon icon={File01Icon} className="shrink-0" />
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate font-medium">{file.name}</span>
            <span className="text-muted-foreground">
              {formatBytes(file.size)}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remover arquivo"
            disabled={disabled}
            onClick={() => selectFile(null)}
          >
            <HugeiconsIcon icon={Cancel01Icon} />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          onDragEnter={(event) => {
            event.preventDefault();
            dragDepth.current += 1;
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            event.preventDefault();
            dragDepth.current -= 1;
            if (dragDepth.current <= 0) setIsDragging(false);
          }}
          onDrop={handleDrop}
          className={cn(
            "flex w-full flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-8 text-center transition-colors outline-none hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            isDragging && "border-primary bg-accent",
          )}
        >
          <div className="rounded-xl bg-accent p-3">
            <HugeiconsIcon icon={CloudUploadIcon} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              Arraste o arquivo aqui ou clique para procurar
            </span>
            <span className="text-xs text-muted-foreground">
              Formato aceito: OFX
            </span>
          </div>
          <span className="pointer-events-none text-xs font-bold text-primary underline underline-offset-4">
            Procurar arquivo
          </span>
        </button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
