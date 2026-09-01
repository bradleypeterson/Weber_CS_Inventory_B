import { useCallback, useEffect, useState } from "react";

export function useData<T>(
  key: string,
  fetchDataFunction: () => Promise<T>,
  options?: {
    expiresIn?: number;
    retryOnFail?: boolean;
    retryAttempts?: number;
    retryDelay?: number;
  }
) {
  const {
    expiresIn = 1_800_00, //30 mins
    retryOnFail = true,
    retryAttempts = 3,
    retryDelay = 1000,
  } = options ?? {};
  const [data, setData] = useState<T | undefined>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);

  const refetch = useCallback(
    async function fetchFreshData() {
      let attempts = 0;
      while (attempts < retryAttempts) {
        try {
          const fetchedData = await fetchDataFunction();
          if (fetchedData === undefined || fetchedData === null)
            throw Error("No data received");

          if ("caches" in window) {
            caches.open("data-cache").then((cache) => {
              const response = new Response(JSON.stringify(fetchedData), {
                headers: {
                  "Content-Type": "application/json",
                  Date: new Date().toUTCString(), // Add date to the response for cache expiration logic
                },
              });

              cache.put(key, response); // Cache the fetched data
            });
          }

          setData(fetchedData);
          break;
        } catch (e) {
          attempts++;
          setError(e);

          if (retryOnFail && attempts < retryAttempts) {
            await new Promise((res) => setTimeout(res, retryDelay));
          } else {
            break;
          }
        }
      }

      setLoading(false);
    },
    [retryAttempts, retryDelay, retryOnFail, fetchDataFunction, key]
  );

  useEffect(() => {
    async function invalidateCache() {
      if ("caches" in window) {
        const cache = await caches.open("data-cache");
        const cachedResponse = await cache.match(key);
        if (cachedResponse) {
          const cachedDate = new Date(cachedResponse.headers.get("date") || "");
          const now = new Date();

          // Invalidate if the cache is older than the specified cacheDuration
          if (now.getTime() - cachedDate.getTime() > expiresIn) {
            await cache.delete(key); // Delete the cache if expired
          }
        }
      }
    }

    async function loadDataFromCacheOrNetwork() {
      setLoading(true);
      if ("caches" in window) {
        const cachedData = await caches.match(key);
        if (cachedData) {
          const cachedJson = await cachedData.json();
          setData(cachedJson);
          setLoading(false);
          return;
        }
      }

      await refetch();
    }

    invalidateCache().then(() => loadDataFromCacheOrNetwork());
  }, [key, refetch, expiresIn]);

  return { data, loading, error, refetch };
}
