"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type SearchableOption = {
  value: string;
  label: string;
  description?: string;
  groupId?: string;
  keywords?: string[];
};

export type SearchableGroup = {
  id: string;
  label: string;
  description?: string;
};

type SearchableMultiSelectProps = {
  title: string;
  description: string;
  searchPlaceholder: string;
  options: SearchableOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  groups?: SearchableGroup[];
  emptyText: string;
  selectAllLabel?: string;
  onSelectAll?: () => void;
  onClear?: () => void;
  onToggleGroup?: (groupId: string) => void;
  isGroupFullySelected?: (groupId: string) => boolean;
};

export function SearchableMultiSelect({
  title,
  description,
  searchPlaceholder,
  options,
  selectedValues,
  onChange,
  groups,
  emptyText,
  selectAllLabel,
  onSelectAll,
  onClear,
  onToggleGroup,
  isGroupFullySelected,
}: SearchableMultiSelectProps) {
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return options;

    return options.filter((option) => {
      const haystack = [option.label, option.description, ...(option.keywords ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [options, search]);

  const grouped = useMemo(() => {
    if (!groups?.length) {
      return [{ key: "ungrouped", label: "", description: "", options: filteredOptions }];
    }

    return groups.map((group) => ({
      key: group.id,
      label: group.label,
      description: group.description ?? "",
      options: filteredOptions.filter((option) => option.groupId === group.id),
    }));
  }, [filteredOptions, groups]);

  function toggleValue(value: string) {
    onChange(
      selectedValues.includes(value)
        ? selectedValues.filter((item) => item !== value)
        : [...selectedValues, value],
    );
  }

  return (
    <div className="grid gap-4 rounded-[28px] border border-border/70 bg-muted/20 p-5">
      <div className="flex flex-col gap-4 tablet:flex-row tablet:items-start tablet:justify-between">
        <div className="grid gap-1">
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectAllLabel && onSelectAll ? (
            <Button variant="secondary" size="sm" onClick={onSelectAll}>
              {selectAllLabel}
            </Button>
          ) : null}
          {onClear ? (
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-10"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={searchPlaceholder}
        />
      </div>

      {selectedValues.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedValues.map((value) => {
            const option = options.find((item) => item.value === value);
            if (!option) return null;

            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleValue(value)}
                className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
              >
                {option.label}
                <X className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">No selections yet.</div>
      )}

      <div className="grid gap-3">
        {grouped.map((group) => {
          if (!group.options.length) return null;

          return (
            <div key={group.key} className="rounded-[24px] border border-border/70 bg-white p-4">
              {group.label ? (
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">{group.label}</div>
                    {group.description ? (
                      <div className="text-sm text-muted-foreground">{group.description}</div>
                    ) : null}
                  </div>
                  {onToggleGroup ? (
                    <Button variant="ghost" size="sm" onClick={() => onToggleGroup(group.key)}>
                      {isGroupFullySelected?.(group.key) ? "Clear group" : "Select all"}
                    </Button>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-3">
                {group.options.map((option) => {
                  const selected = selectedValues.includes(option.value);

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleValue(option.value)}
                      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-primary/20 bg-primary/5"
                          : "border-border/70 bg-white hover:bg-muted/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        readOnly
                        className="mt-1 h-4 w-4 rounded border-border accent-[#173765]"
                      />
                      <div className="grid gap-1">
                        <div className="font-medium">{option.label}</div>
                        {option.description ? (
                          <div className="text-sm leading-6 text-muted-foreground">{option.description}</div>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {!filteredOptions.length ? (
        <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          {emptyText}
        </div>
      ) : null}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{selectedValues.length} selected</span>
        <Badge variant="outline">{title}</Badge>
      </div>
    </div>
  );
}
