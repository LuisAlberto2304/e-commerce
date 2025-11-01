/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import algoliasearch from "algoliasearch/lite";
import { X } from "lucide-react"; // Ícono moderno

const client = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!
);

const index = client.initIndex("products");

export default function ProductSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const search = async (q: string) => {
    setQuery(q);
    if (!q) {
      setResults([]);
      return;
    }
    const { hits } = await index.search(q);
    setResults(hits);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder="Buscar productos..."
          className="w-full p-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Botón personalizado para limpiar el texto */}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1 transition"
            aria-label="Limpiar búsqueda"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute top-full left-0 w-full bg-white border rounded shadow max-h-80 overflow-y-auto z-50 mt-1">
          {results.map((hit: any) => (
            <div
              key={hit.objectID}
              className="p-2 border-b last:border-b-0 flex gap-2 hover:bg-gray-50 cursor-pointer transition"
            >
              {hit.thumbnail && (
                <img
                  src={hit.thumbnail}
                  alt={hit.title}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div>
                <p className="font-semibold text-black">{hit.title}</p>
                <p className="text-sm text-gray-700">{hit.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
