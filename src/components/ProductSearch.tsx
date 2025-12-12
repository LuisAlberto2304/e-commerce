/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import algoliasearch from "algoliasearch/lite";
import { Search, X } from "lucide-react"; 

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
    <div className="relative w-full max-w-lg mx-auto">
      {/* Campo de búsqueda */}
      <div className="relative group">
        {/* Icono de lupa */}
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
        />

        <input
          type="search"
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder="Buscar productos..."
          className="w-full pl-12 pr-10 py-3 rounded-full bg-gray-100 text-gray-900 placeholder-gray-400
                    focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none
                    shadow-sm transition-all duration-200"
        />

        {/* Botón para limpiar */}
        {query && (
          <button
            onClick={clearSearch}
            aria-label="Limpiar búsqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-200 hover:bg-gray-300 text-gray-600 
                      rounded-full p-1.5 transition"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Resultados */}
      {results.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-2 rounded-2xl backdrop-blur-md bg-white/70 shadow-xl border border-gray-100 overflow-hidden z-50">
          {results.map((hit: any) => (
            <div
              key={hit.objectID}
              className="flex items-center gap-3 p-3 hover:bg-gray-100/60 cursor-pointer transition"
            >
              {hit.thumbnail && (
                <img
                  src={hit.thumbnail}
                  alt={hit.title}
                  className="w-10 h-10 object-cover rounded-md"
                />
              )}
              <div className="flex flex-col">
                <p className="text-sm font-medium text-gray-900">{hit.title}</p>
                <p className="text-xs text-gray-500 line-clamp-1">{hit.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

}
