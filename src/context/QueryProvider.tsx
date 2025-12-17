'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Cache data for 5 minutes (300,000 ms) before considering it stale
                staleTime: 5 * 60 * 1000,
                // Keep unused data in cache for 10 minutes (600,000 ms)
                gcTime: 10 * 60 * 1000,
                // Retry failed queries once
                retry: 1,
                // Disable automatic refetch on window focus to reduce load
                refetchOnWindowFocus: false,
            },
        },
    }))

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}
