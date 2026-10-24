import { isItemKind, type ItemKind } from "@/lib/items/types";
import type { DashboardFilters } from "./view";

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Reads the filters from the page URL, ignoring anything unexpected. */
export function filtersFromParams(params: RawParams): DashboardFilters & { section: ItemKind | null } {
  const section = first(params.section);
  const category = first(params.category)?.trim().slice(0, 40);
  const query = first(params.q)?.trim().slice(0, 100);
  return {
    section: isItemKind(section) ? section : null,
    category: category || null,
    query: query || null,
  };
}

/** The home URL for a set of filters (empty filters give plain "/"). */
export function hrefFor(filters: DashboardFilters, basePath = "/"): string {
  const search = new URLSearchParams();
  if (filters.section) search.set("section", filters.section);
  if (filters.category) search.set("category", filters.category);
  if (filters.query) search.set("q", filters.query);
  const text = search.toString();
  return text ? `${basePath}?${text}` : basePath;
}
