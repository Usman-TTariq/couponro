"use client";

import { useEffect, useRef, useState } from "react";
import type { Store } from "@/types/store";

type StoreSearchSelectProps = {
  stores: Store[];
  value: string;
  onChange: (storeId: string, store: Store | null) => void;
  className?: string;
  id?: string;
};

export default function StoreSearchSelect({
  stores,
  value,
  onChange,
  className = "",
  id = "store-search-select",
}: StoreSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = value ? stores.find((s) => s.id === value) : null;

  const sortedStores = [...stores].sort((a, b) =>
    (a.name ?? "").localeCompare(b.name ?? "", undefined, { sensitivity: "base" })
  );

  const q = query.trim().toLowerCase();
  const filtered = q
    ? sortedStores.filter((s) => (s.name ?? "").toLowerCase().includes(q))
    : sortedStores;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pick = (storeId: string) => {
    const store = storeId ? stores.find((s) => s.id === storeId) ?? null : null;
    onChange(storeId, store);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const displayValue = open ? query : selected?.name ?? "";

  return (
    <div ref={wrapRef} className={`relative w-full max-w-xs ${className}`}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </span>
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          placeholder="Search store…"
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) onChange("", null);
          }}
          onFocus={() => {
            setOpen(true);
            if (selected && !query) setQuery("");
          }}
          className="w-full rounded border-2 border-stone-300 bg-white py-2 pl-9 pr-8 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />
        {selected && !open && (
          <button
            type="button"
            onClick={() => pick("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            aria-label="Clear store"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-lg border-2 border-stone-200 bg-white py-1 shadow-lg"
        >
          <li role="option" aria-selected={!value}>
            <button
              type="button"
              className={`w-full px-3 py-2 text-left text-sm hover:bg-amber-50 ${
                !value ? "bg-amber-50 font-medium text-amber-900" : "text-stone-700"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                pick("");
              }}
            >
              — Add new store —
            </button>
          </li>
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-stone-500">No stores match &quot;{query}&quot;</li>
          ) : (
            filtered.map((s) => (
              <li key={s.id} role="option" aria-selected={value === s.id}>
                <button
                  type="button"
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-amber-50 ${
                    value === s.id ? "bg-amber-50 font-medium text-amber-900" : "text-stone-800"
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(s.id);
                  }}
                >
                  {s.name ?? "–"}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
