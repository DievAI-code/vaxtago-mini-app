"use client";

import { useCallback, useRef, useState } from "react";
import { hhService } from "@/services/hh/hhService";
import type { HHSearchParams, NormalizedVacancy } from "@/services/hh/hhTypes";

interface UseHHResult {
  vacancies: NormalizedVacancy[];
  loading: boolean;
  error: string | null;
  found: number;
  page: number;
  pages: number;
  hasMore: boolean;
  search: (params: HHSearchParams) => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => void;
}

export function useHH(): UseHHResult {
  const [vacancies, setVacancies] = useState<NormalizedVacancy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState(0);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(0);
  const lastParams = useRef<HHSearchParams>({});

  const search = useCallback(async (params: HHSearchParams) => {
    setLoading(true);
    setError(null);
    lastParams.current = params;
    try {
      const res = await hhService.searchVacancies({ ...params, page: 0 });
      setVacancies(res.items);
      setFound(res.found);
      setPage(res.page);
      setPages(res.pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "UNKNOWN_ERROR");
      setVacancies([]);
      setFound(0);
      setPage(0);
      setPages(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || page + 1 >= pages) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await hhService.searchVacancies({
        ...lastParams.current,
        page: nextPage,
      });
      setVacancies((prev) => [...prev, ...res.items]);
      setPage(res.page);
      setPages(res.pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "UNKNOWN_ERROR");
    } finally {
      setLoading(false);
    }
  }, [loading, page, pages]);

  const reset = useCallback(() => {
    setVacancies([]);
    setFound(0);
    setPage(0);
    setPages(0);
    setError(null);
  }, []);

  return {
    vacancies,
    loading,
    error,
    found,
    page,
    pages,
    hasMore: page + 1 < pages,
    search,
    loadMore,
    reset,
  };
}