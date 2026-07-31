"use client";

import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBodyLock } from "@/hooks/use-body-lock";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import type {
  CatalogFilters,
  CatalogSort,
} from "@/types/product";

type OptionSet = {
  categories: string[];
  brands: string[];
  sizes: string[];
  conditions: string[];
  statuses: string[];
};

type CatalogControlsProps = {
  filters: CatalogFilters;
  hasExternalState: boolean;
  onChange: (filters: CatalogFilters) => void;
  onReset: () => void;
  onSortChange: (sort: CatalogSort) => void;
  options: OptionSet;
  resultCount: number;
  sort: CatalogSort;
};

const filterDefinitions: Array<{
  key: keyof CatalogFilters;
  label: string;
}> = [
  { key: "categories", label: "Категория" },
  { key: "brands", label: "Бренд" },
  { key: "sizes", label: "Размер" },
  { key: "conditions", label: "Состояние" },
  { key: "statuses", label: "Статус" },
];

function FilterOptions({
  active,
  label,
  onToggle,
  options,
}: {
  active: string[];
  label: string;
  onToggle: (option: string) => void;
  options: string[];
}) {
  if (options.length === 0) {
    return <p className="filter-empty">Нет доступных значений</p>;
  }

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
          <span>{option}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function CatalogControls({
  filters,
  hasExternalState,
  onChange,
  onReset,
  onSortChange,
  options,
  resultCount,
  sort,
}: CatalogControlsProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  useBodyLock(drawerOpen);
  useDialogFocus({
    dialogRef: drawerRef,
    initialFocusRef: drawerCloseRef,
    open: drawerOpen,
  });

  useEffect(() => {
    if (!drawerOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [drawerOpen]);

  const activeCount = useMemo(
    () =>
      Object.values(filters).reduce(
        (total, values) => total + values.length,
        0,
      ),
    [filters],
  );

  const toggle = (key: keyof CatalogFilters, option: string) => {
    const current = filters[key];
    onChange({
      ...filters,
      [key]: current.includes(option)
        ? current.filter((value) => value !== option)
        : [...current, option],
    });
  };

  return (
    <>
      <div className="catalog-controls catalog-controls--desktop">
        <div className="desktop-filters">
          {filterDefinitions.map(({ key, label }) => (
            <details className="filter-dropdown" key={key}>
              <summary>
                {label}
                {filters[key].length > 0 && (
                  <span className="filter-count">{filters[key].length}</span>
                )}
                <ChevronDown aria-hidden="true" />
              </summary>
              <div className="filter-dropdown__panel">
                <FilterOptions
                  active={filters[key]}
                  label={label}
                  onToggle={(option) => toggle(key, option)}
                  options={options[key]}
                />
              </div>
            </details>
          ))}
        </div>
        <div className="catalog-sort">
          <label htmlFor="desktop-sort">Сортировка</label>
          <select
            id="desktop-sort"
            onChange={(event) =>
              onSortChange(event.target.value as CatalogSort)
            }
            value={sort}
          >
            <option value="newest">Сначала новые</option>
            <option value="price-asc">Цена: по возрастанию</option>
            <option value="price-desc">Цена: по убыванию</option>
          </select>
          <button
            className="reset-button"
            disabled={activeCount === 0 && !hasExternalState}
            onClick={onReset}
            type="button"
          >
            Сбросить
          </button>
        </div>
      </div>

      <div className="catalog-controls catalog-controls--mobile">
        <button
          aria-controls="catalog-filter-drawer"
          aria-expanded={drawerOpen}
          className="button button--outline"
          onClick={() => setDrawerOpen(true)}
          type="button"
        >
          <SlidersHorizontal aria-hidden="true" />
          Фильтры
          {activeCount > 0 && <span className="filter-count">{activeCount}</span>}
        </button>
        <label className="mobile-sort">
          <span className="sr-only">Сортировка</span>
          <select
            onChange={(event) =>
              onSortChange(event.target.value as CatalogSort)
            }
            value={sort}
          >
            <option value="newest">Сначала новые</option>
            <option value="price-asc">Цена ↑</option>
            <option value="price-desc">Цена ↓</option>
          </select>
        </label>
      </div>

      {drawerOpen && (
        <div className="overlay" onMouseDown={() => setDrawerOpen(false)}>
          <aside
            aria-label="Фильтры каталога"
            aria-modal="true"
            className="filter-drawer"
            id="catalog-filter-drawer"
            onMouseDown={(event) => event.stopPropagation()}
            ref={drawerRef}
            role="dialog"
          >
            <div className="filter-drawer__handle" aria-hidden="true" />
            <div className="filter-drawer__header">
              <div>
                <p className="eyebrow">Каталог</p>
                <h2>Фильтры</h2>
              </div>
              <button
                aria-label="Закрыть фильтры"
                className="icon-button"
                onClick={() => setDrawerOpen(false)}
                ref={drawerCloseRef}
                type="button"
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <div className="filter-drawer__body">
              {filterDefinitions.map(({ key, label }) => (
                <details key={key}>
                  <summary>
                    {label}
                    {filters[key].length > 0 && (
                      <span className="filter-count">{filters[key].length}</span>
                    )}
                    <ChevronDown aria-hidden="true" />
                  </summary>
                  <FilterOptions
                    active={filters[key]}
                    label={label}
                    onToggle={(option) => toggle(key, option)}
                    options={options[key]}
                  />
                </details>
              ))}
            </div>
            <div className="filter-drawer__footer">
              <button
                className="button button--outline"
                disabled={activeCount === 0 && !hasExternalState}
                onClick={() => {
                  onReset();
                  setDrawerOpen(false);
                }}
                type="button"
              >
                Сбросить
              </button>
              <button
                className="button button--primary"
                onClick={() => setDrawerOpen(false)}
                type="button"
              >
                Показать {resultCount}
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
