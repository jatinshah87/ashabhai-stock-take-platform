"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppUser } from "@/lib/types";
import { RolePill } from "@/components/shared/role-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchableUserSelectProps = {
  title: string;
  helper: string;
  users: AppUser[];
  selectedUserId: string;
  onSelect: (userId: string) => void;
  excludedUserId?: string;
  getMeta?: (user: AppUser) => string;
};

export function SearchableUserSelect({
  title,
  helper,
  users,
  selectedUserId,
  onSelect,
  excludedUserId,
  getMeta,
}: SearchableUserSelectProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      if (user.id === excludedUserId) return false;
      const haystack = `${user.name} ${user.role} ${user.employeeCode} ${user.email}`.toLowerCase();
      return !term || haystack.includes(term);
    });
  }, [users, search, excludedUserId]);

  return (
    <div className="grid gap-4 rounded-[28px] border border-border/70 bg-muted/20 p-5">
      <div className="grid gap-1">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{helper}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-10"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by user, role, or employee code"
        />
      </div>

      <div className="grid max-h-[320px] gap-3 overflow-auto pr-1">
        {filtered.map((user) => {
          const active = selectedUserId === user.id;

          return (
            <button
              key={user.id}
              type="button"
              onClick={() => onSelect(user.id)}
              className={`rounded-3xl border p-4 text-left transition ${
                active ? "border-primary/20 bg-primary/5 shadow-soft" : "border-border/70 bg-white hover:bg-muted/40"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="grid gap-1">
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {user.employeeCode} | {user.email}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getMeta ? getMeta(user) : `Warehouse assignment: ${user.warehouseId}`}
                  </div>
                </div>
                <RolePill role={user.role} />
              </div>
            </button>
          );
        })}
      </div>

      {selectedUserId ? (
        <Button variant="ghost" size="sm" onClick={() => onSelect("")}>
          Clear selection
        </Button>
      ) : null}
    </div>
  );
}
