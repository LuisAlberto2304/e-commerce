import algoliasearch, { SearchClient } from "algoliasearch/lite";

export const searchClient: SearchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY! // Search-only API key
);

export const indexName = "products";
