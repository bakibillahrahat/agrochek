import { useState, useEffect, useCallback } from 'react';

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface PaginatedData<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginatedApiState<T> extends Omit<ApiState<PaginatedData<T>>, 'data'> {
  data: T[];
  pagination: PaginatedData<T>['pagination'] | null;
}

/**
 * Generic hook for API data fetching
 */
export function useApiData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  options: {
    immediate?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
  } = {}
): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { immediate = true, onSuccess, onError } = options;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [...dependencies, immediate]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook for paginated API data
 */
export function usePaginatedApiData<T>(
  fetchFn: (page: number, limit: number, search?: string) => Promise<PaginatedData<T>>,
  options: {
    initialPage?: number;
    initialLimit?: number;
    immediate?: boolean;
  } = {}
): PaginatedApiState<T> & {
  page: number;
  limit: number;
  search: string;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  nextPage: () => void;
  prevPage: () => void;
} {
  const { initialPage = 1, initialLimit = 10, immediate = true } = options;
  
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState('');
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginatedData<T>['pagination'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn(page, limit, search || undefined);
      setData(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setData([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, page, limit, search]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [fetchData, immediate]);

  const nextPage = useCallback(() => {
    if (pagination?.hasNext) {
      setPage(prev => prev + 1);
    }
  }, [pagination?.hasNext]);

  const prevPage = useCallback(() => {
    if (pagination?.hasPrev) {
      setPage(prev => prev - 1);
    }
  }, [pagination?.hasPrev]);

  return {
    data,
    pagination,
    loading,
    error,
    refetch: fetchData,
    page,
    limit,
    search,
    setPage,
    setLimit,
    setSearch,
    nextPage,
    prevPage,
  };
}

/**
 * Hook for CRUD operations
 */
export function useCrudOperations<T extends { id: string }>(
  apiEndpoint: string,
  options: {
    onCreateSuccess?: (item: T) => void;
    onUpdateSuccess?: (item: T) => void;
    onDeleteSuccess?: (id: string) => void;
    onError?: (error: string) => void;
  } = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { onCreateSuccess, onUpdateSuccess, onDeleteSuccess, onError } = options;

  const handleApiCall = async <R>(operation: () => Promise<R>): Promise<R | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const create = async (data: Omit<T, 'id'>): Promise<T | null> => {
    const result = await handleApiCall(async () => {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create');
      }
      
      const responseData = await response.json();
      return responseData.success ? responseData.data : responseData;
    });

    if (result) {
      onCreateSuccess?.(result);
    }
    
    return result;
  };

  const update = async (id: string, data: Partial<Omit<T, 'id'>>): Promise<T | null> => {
    const result = await handleApiCall(async () => {
      const response = await fetch(`${apiEndpoint}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update');
      }
      
      const responseData = await response.json();
      return responseData.success ? responseData.data : responseData;
    });

    if (result) {
      onUpdateSuccess?.(result);
    }
    
    return result;
  };

  const remove = async (id: string): Promise<boolean> => {
    const result = await handleApiCall(async () => {
      const response = await fetch(`${apiEndpoint}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete');
      }
      
      return true;
    });

    if (result) {
      onDeleteSuccess?.(id);
    }
    
    return !!result;
  };

  return {
    create,
    update,
    remove,
    loading,
    error,
  };
}

/**
 * Hook for form state management
 */
export function useFormState<T>() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const openCreateForm = useCallback(() => {
    setMode('create');
    setSelectedItem(null);
    setIsOpen(true);
  }, []);

  const openEditForm = useCallback((item: T) => {
    setMode('edit');
    setSelectedItem(item);
    setIsOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setIsOpen(false);
    setSelectedItem(null);
  }, []);

  return {
    isOpen,
    mode,
    selectedItem,
    openCreateForm,
    openEditForm,
    closeForm,
  };
}

/**
 * Hook for search and filtering
 */
export function useSearchAndFilter<T>() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
  }, []);

  const toggleSort = useCallback((field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }, [sortBy]);

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    toggleSort,
  };
}
