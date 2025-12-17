import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { fetchProducts, fetchProductById } from '@/app/lib/medusaClient';

import { Filters } from "@/app/types/filters";

export function useInfiniteProducts(filters: Filters) {
    return useInfiniteQuery({
        queryKey: ['products', filters],
        queryFn: async ({ pageParam = 0 }) => {
            // Prepare filters for API
            const apiFilters = {
                ...filters,
                limit: 20, // Load 20 items per page
                offset: pageParam,
            };

            // Remove client-side only filters from API call if they are not supported by backend yet
            // For now, we pass them, assuming backend or client handles them.
            // Based on medusaClient, we should pass simple filters.

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = await fetchProducts(apiFilters as any);
            return data;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const currentCount = allPages.flatMap(p => p.products).length;
            const totalCount = lastPage.count || 0; // Assuming API returns count

            if (currentCount < totalCount && lastPage.products.length > 0) {
                return currentCount; // Next offset
            }
            return undefined;
        },
        staleTime: 30 * 60 * 1000, // 30 minutes
    });
}

export function useProductQuery(id: string) {
    return useQuery({
        queryKey: ['product', id],
        queryFn: async () => {
            if (!id) return null;
            const data = await fetchProductById(id);
            return data;
        },
        enabled: !!id,
        staleTime: 30 * 60 * 1000, // 30 minutes for individual products
    });
}
