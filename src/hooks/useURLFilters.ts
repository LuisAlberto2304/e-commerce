import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { Filters } from '@/app/types/filters';
import { useDebounce } from './useDebounce';

export function useURLFilters() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // 1. Leer filtros desde la URL
    const filters: Filters = useMemo(() => {
        const params: Filters = {};

        // String params
        const q = searchParams.get('q');
        if (q) params.q = q;

        const minPrice = searchParams.get('minPrice');
        if (minPrice) params.minPrice = Number(minPrice);

        const maxPrice = searchParams.get('maxPrice');
        if (maxPrice) params.maxPrice = Number(maxPrice);

        const rating = searchParams.get('rating');
        if (rating) params.rating = Number(rating);

        // Array params (comma separated or multiple keys)
        // Medusa/Next usually handles ?categories=1&categories=2 OR ?categories=1,2
        // Aquí soportamos coma separada para URLs más limpias

        const categories = searchParams.get('categories');
        if (categories) params.categories = categories.split(',');

        const color = searchParams.get('color');
        if (color) params.color = color.split(',');

        const size = searchParams.get('size');
        if (size) params.size = size.split(',');

        return params;
    }, [searchParams]);

    // 2. Función para actualizar URL
    // Usamos una función compatible con React.Dispatch<React.SetStateAction<Filters>>
    const setFilters = useCallback((update: Filters | ((prev: Filters) => Filters)) => {
        const currentFilters = filters; // filters from scope
        const newFilters = typeof update === 'function' ? update(currentFilters) : update;

        const params = new URLSearchParams();

        if (newFilters.q) params.set('q', newFilters.q);
        if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice.toString());
        if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice.toString());
        if (newFilters.rating) params.set('rating', newFilters.rating.toString());

        if (newFilters.categories?.length) {
            params.set('categories', newFilters.categories.join(','));
        }
        if (newFilters.color?.length) {
            params.set('color', newFilters.color.join(','));
        }
        if (newFilters.size?.length) {
            params.set('size', newFilters.size.join(','));
        }

        // Replace current URL without reloading
        const query = params.toString();
        const url = query ? `${pathname}?${query}` : pathname;

        // Usamos replace para no llenar el historial con cada letra, 
        // pero idealmente para filtros "aplicados" debería ser push. 
        // Por ahora replace es más fluido mientras se escribe.
        router.replace(url, { scroll: false });

    }, [filters, pathname, router]);

    return { filters, setFilters };
}
