import { useQuery } from '@tanstack/react-query';
import { getNewestProducts, getBestSellingProducts } from '@/app/services/firebaseService';

export function useNewestProducts() {
    return useQuery({
        queryKey: ['home', 'newest'],
        queryFn: () => getNewestProducts(6),
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

export function useBestSellingProducts() {
    return useQuery({
        queryKey: ['home', 'bestSelling'],
        queryFn: () => getBestSellingProducts(6),
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}
