"use client";

import * as React from "react";

import { DataTable } from "@/components/ui/data-table";
import type { SpaceCategory } from "@/lib/space/queries";
import { createCategoryColumns } from "./columns";

export function CategoriesTable({
  categories,
  canManage,
}: {
  categories: SpaceCategory[];
  canManage: boolean;
}) {
  const columns = React.useMemo(
    () => createCategoryColumns(canManage),
    [canManage],
  );

  return <DataTable columns={columns} data={categories} />;
}
