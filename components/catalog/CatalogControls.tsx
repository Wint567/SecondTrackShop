"use client";

import { ChevronDown, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBodyLock } from "@/hooks/use-body-lock";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import type { CatalogFilters } from "@/types/product";
import { emptyCatalogFilters } from "@/utils/catalog";
import { presentCategory, presentCondition } from "@/utils/presentation";
import { getPublicStatus } from "@/utils/status";

type OptionSet = Record<keyof CatalogFilters, string[]>;

type CatalogControlsProps = {
  filters: CatalogFilters;
  getResultCount: (filters: CatalogFilters) => number;
  hasExternalState: boolean;
  onChange: (filters: CatalogFilters) => void;
  onReset: () => void;
  options: OptionSet;
};

const filterDefinitions: Array<{ key: keyof CatalogFilters; label: string }> = [
  { key: "categories", label: "Category" },
  { key: "sizes", label: "Size" },
  { key: "brands", label: "Brand" },
  { key: "conditions", label: "Condition" },
  { key: "priceRanges", label: "Price" },
  { key: "statuses", label: "Availability" },
];

const copyFilters = (filters: CatalogFilters): CatalogFilters =>
  Object.fromEntries(
    Object.entries(filters).map(([key, values]) => [key, [...values]]),
  ) as CatalogFilters;

const countFilters = (filters: CatalogFilters) =>
  Object.values(filters).reduce((total, values) => total + values.length, 0);

const presentFilter = (key: keyof CatalogFilters, value: string) => {
  if (key === "categories") return presentCategory(value);
  if (key === "conditions") return presentCondition(value);
  if (key === "statuses") return getPublicStatus(value).label;
  return value;
};

function FilterOptions({
  active,
  keyName,
  label,
  onToggle,
  options,
}: {
  active: string[];
  keyName: keyof CatalogFilters;
  label: string;
  onToggle: (option: string) => void;
  options: string[];
}) {
  if (options.length === 0) return <p className="filter-empty">No options available</p>;
  return (
    <fieldset className="filter-options">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <label key={option}>
          <input
            checked={active.includes(option)}
            onChange={() => onToggle(option)}
            type="checkbox"
          />
          <span>{presentFilter(keyName, option)}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function CatalogControls({
  filters,
  getResultCount,
  hasExternalState,
  onChange,
  onReset,
  options,
}: CatalogControlsProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(() => copyFilters(filters));
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  useBodyLock(drawerOpen);
  useDialogFocus({ dialogRef: drawerRef, initialFocusRef: drawerCloseRef, open: drawerOpen });

  useEffect(() => {
    if (!drawerOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [drawerOpen]);

  const activeCount = useMemo(() => countFilters(filters), [filters]);
  const draftActiveCount = useMemo(() => countFilters(draftFilters), [draftFilters]);
  const draftResultCount = useMemo(
    () => getResultCount(draftFilters),
    [draftFilters, getResultCount],
  );

  const toggle = (source: CatalogFilters, key: keyof CatalogFilters, option: string) => ({
    ...source,
    [key]: source[key].includes(option)
      ? source[key].filter((value) => value !== option)
      : [...source[key], option],
  });

  const filterList = (
    active: CatalogFilters,
    onToggle: (key: keyof CatalogFilters, option: string) => void,
    mobile = false,
  ) => (
    <div className={mobile ? "filter-drawer__body" : "catalog-filterbar__groups"}>
      {filterDefinitions.map(({ key, label }) => (
        <details key={key}>
          <summary>
            {label}
            {active[key].length > 0 && <span className="filter-count">{active[key].length}</span>}
            <ChevronDown aria-hidden="true" />
          </summary>
          <FilterOptions
            active={active[key]}
            keyName={key}
            label={label}
            onToggle={(option) => onToggle(key, option)}
            options={options[key]}
          />
        </details>
      ))}
    </div>
  );

  const openDrawer = () => {
    setDraftFilters(copyFilters(filters));
    setDrawerOpen(true);
  };

  return (
    <>
      <div className="catalog-filterbar" aria-label="Catalog filters">
        <div className="catalog-filterbar__categories">
          <button
            className={filters.categories.length === 0 ? "is-active" : ""}
            onClick={() => onChange({ ...filters, categories: [] })}
            type="button"
          >
            All items
          </button>
          {options.categories.slice(0, 4).map((category) => (
            <button
              className={filters.categories.includes(category) ? "is-active" : ""}
              key={category}
              onClick={() => onChange(toggle(filters, "categories", category))}
              type="button"
            >
              {presentCategory(category)}
            </button>
          ))}
        </div>
        {filterList(filters, (key, option) => onChange(toggle(filters, key, option)))}
        <button
          className="filter-reset"
          disabled={activeCount === 0 && !hasExternalState}
          onClick={onReset}
          type="button"
        >
          Clear <RotateCcw aria-hidden="true" />
        </button>
      </div>

      <div className="catalog-controls--mobile">
        <button
          aria-controls="catalog-filter-drawer"
          aria-expanded={drawerOpen}
          className="catalog-filter-trigger"
          onClick={openDrawer}
          type="button"
        >
          <SlidersHorizontal aria-hidden="true" /> Filter{" "}
          {activeCount > 0 && <span>{activeCount}</span>}
        </button>
      </div>

      {drawerOpen && (
        <div
          className="overlay club-overlay filter-overlay"
          onMouseDown={() => setDrawerOpen(false)}
        >
          <aside
            aria-label="Catalog filters"
            aria-modal="true"
            className="filter-drawer"
            id="catalog-filter-drawer"
            onMouseDown={(event) => event.stopPropagation()}
            ref={drawerRef}
            role="dialog"
          >
            <span className="filter-drawer__sticker">
              WORN
              <br />
              AGAIN
            </span>
            <div className="filter-drawer__header">
              <h2>
                FILTER <i>/</i> <small>{draftResultCount} found</small>
              </h2>
              <p>narrow it down</p>
              <button
                aria-label="Close filters and discard changes"
                onClick={() => setDrawerOpen(false)}
                ref={drawerCloseRef}
                type="button"
              >
                <X aria-hidden="true" />
              </button>
            </div>
            {filterList(
              draftFilters,
              (key, option) => setDraftFilters((current) => toggle(current, key, option)),
              true,
            )}
            <div className="filter-drawer__footer">
              <button
                className="club-button"
                onClick={() => {
                  onChange(draftFilters);
                  setDrawerOpen(false);
                }}
                type="button"
              >
                Apply filters ({draftResultCount})
              </button>
              <button
                className="filter-drawer__reset"
                disabled={draftActiveCount === 0}
                onClick={() => setDraftFilters(emptyCatalogFilters())}
                type="button"
              >
                Clear all selections
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
