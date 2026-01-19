// Datafordeler HTTP Client
// Provides authenticated access to Danish government data APIs

import type {
  BBRBygning,
  BBREnhed,
  BBRGrund,
  BBREjendomsrelation,
  BBRSearchParams,
} from './types';

const BASE_URL = 'https://services.datafordeler.dk/BBR/BBRPublic/1/rest';
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Configuration for the Datafordeler client
 */
export interface DatafordelerConfig {
  username: string;
  password: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Error class for Datafordeler API errors
 */
export class DatafordelerError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'DatafordelerError';
  }
}

/**
 * Get credentials from environment
 */
function getCredentials(): { username: string; password: string } {
  const username = process.env.DATAFORDELER_USERNAME;
  const password = process.env.DATAFORDELER_PASSWORD;

  if (!username || !password) {
    throw new DatafordelerError(
      'Missing Datafordeler credentials. Set DATAFORDELER_USERNAME and DATAFORDELER_PASSWORD environment variables.'
    );
  }

  return { username, password };
}

/**
 * Build URL with authentication and search parameters
 */
function buildUrl(endpoint: string, params: Record<string, string | number | undefined>): string {
  const { username, password } = getCredentials();
  const url = new URL(`${BASE_URL}${endpoint}`);

  // Add auth params
  url.searchParams.set('username', username);
  url.searchParams.set('password', password);

  // Add search params
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make a request to the Datafordeler API with retry logic
 */
async function makeRequest<T>(
  endpoint: string,
  params: Record<string, string | number | undefined> = {},
  config: Partial<DatafordelerConfig> = {}
): Promise<T[]> {
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;
  const maxRetries = config.maxRetries ?? MAX_RETRIES;
  const url = buildUrl(endpoint, params);

  // Mask password in logs
  const logUrl = url.replace(/password=[^&]+/, 'password=***');

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
        console.log(`Retrying Datafordeler request (attempt ${attempt + 1}/${maxRetries + 1}) after ${delay}ms`);
        await sleep(delay);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new DatafordelerError(
          `API request failed: ${response.status} ${response.statusText}. ${errorText}`,
          response.status,
          endpoint
        );
      }

      const data = await response.json();

      // Handle different response formats
      // The API can return either a GeoJSON FeatureCollection or a direct array
      if (data.features && Array.isArray(data.features)) {
        // GeoJSON format - extract properties from each feature
        return data.features.map((feature: { properties: T }) => feature.properties);
      } else if (Array.isArray(data)) {
        // Direct array format
        return data;
      } else if (typeof data === 'object' && data !== null) {
        // Single object - wrap in array
        return [data as T];
      }

      return [];
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on auth errors or not found
      if (error instanceof DatafordelerError) {
        if (error.statusCode === 401 || error.statusCode === 403) {
          throw error;
        }
        if (error.statusCode === 404) {
          return []; // Not found is not an error - return empty
        }
      }

      // Don't retry if aborted (timeout)
      if (lastError.name === 'AbortError') {
        throw new DatafordelerError(
          `Request timed out after ${timeout}ms`,
          408,
          endpoint
        );
      }

      // Log retry-able errors
      console.error(`Datafordeler request failed (attempt ${attempt + 1}/${maxRetries + 1}):`, lastError.message);
    }
  }

  // All retries exhausted
  throw new DatafordelerError(
    `Request failed after ${maxRetries + 1} attempts: ${lastError?.message}`,
    undefined,
    endpoint
  );
}

/**
 * Search for buildings (Bygning)
 */
export async function searchBygninger(
  params: BBRSearchParams,
  config?: Partial<DatafordelerConfig>
): Promise<BBRBygning[]> {
  const searchParams: Record<string, string | number | undefined> = {
    pagesize: params.pagesize ?? 10,
    page: params.page ?? 1,
  };

  if (params.id) {
    searchParams.id = params.id;
  }
  if (params.kommunekode) {
    searchParams.kommunekode = params.kommunekode;
  }
  if (params.husnummer) {
    searchParams.husnummer = params.husnummer;
  }
  if (params.bygningsnummer) {
    searchParams.bygningsnummer = params.bygningsnummer;
  }

  return makeRequest<BBRBygning>('/bygning', searchParams, config);
}

/**
 * Search for units (Enhed)
 */
export async function searchEnheder(
  params: BBRSearchParams & { bygning?: string },
  config?: Partial<DatafordelerConfig>
): Promise<BBREnhed[]> {
  const searchParams: Record<string, string | number | undefined> = {
    pagesize: params.pagesize ?? 100,
    page: params.page ?? 1,
  };

  if (params.id) {
    searchParams.id = params.id;
  }
  if ((params as { bygning?: string }).bygning) {
    searchParams.bygning = (params as { bygning?: string }).bygning;
  }
  if (params.kommunekode) {
    searchParams.kommunekode = params.kommunekode;
  }

  return makeRequest<BBREnhed>('/enhed', searchParams, config);
}

/**
 * Search for plots (Grund)
 */
export async function searchGrunde(
  params: BBRSearchParams,
  config?: Partial<DatafordelerConfig>
): Promise<BBRGrund[]> {
  const searchParams: Record<string, string | number | undefined> = {
    pagesize: params.pagesize ?? 10,
    page: params.page ?? 1,
  };

  if (params.id) {
    searchParams.id = params.id;
  }
  if (params.kommunekode) {
    searchParams.kommunekode = params.kommunekode;
  }
  if (params.matrikelnummer) {
    searchParams.matrikelnummer = params.matrikelnummer;
  }
  if (params.ejerlavskode) {
    searchParams.ejerlavskode = params.ejerlavskode;
  }

  return makeRequest<BBRGrund>('/grund', searchParams, config);
}

/**
 * Search for property relations (Ejendomsrelation)
 */
export async function searchEjendomsrelationer(
  params: BBRSearchParams & { bfeNummer?: number },
  config?: Partial<DatafordelerConfig>
): Promise<BBREjendomsrelation[]> {
  const searchParams: Record<string, string | number | undefined> = {
    pagesize: params.pagesize ?? 10,
    page: params.page ?? 1,
  };

  if (params.id) {
    searchParams.id = params.id;
  }
  if (params.kommunekode) {
    searchParams.kommunekode = params.kommunekode;
  }
  if ((params as { bfeNummer?: number }).bfeNummer) {
    searchParams.bfeNummer = (params as { bfeNummer?: number }).bfeNummer;
  }

  return makeRequest<BBREjendomsrelation>('/ejendomsrelation', searchParams, config);
}

/**
 * Get a single building by ID
 */
export async function getBygningById(
  id: string,
  config?: Partial<DatafordelerConfig>
): Promise<BBRBygning | null> {
  const results = await searchBygninger({ id }, config);
  return results.length > 0 ? results[0] : null;
}

/**
 * Get a single unit by ID
 */
export async function getEnhedById(
  id: string,
  config?: Partial<DatafordelerConfig>
): Promise<BBREnhed | null> {
  const results = await searchEnheder({ id }, config);
  return results.length > 0 ? results[0] : null;
}

/**
 * Get a single plot by ID
 */
export async function getGrundById(
  id: string,
  config?: Partial<DatafordelerConfig>
): Promise<BBRGrund | null> {
  const results = await searchGrunde({ id }, config);
  return results.length > 0 ? results[0] : null;
}

/**
 * Test the Datafordeler connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    // Try to fetch a single building to test auth
    await makeRequest('/bygning', { pagesize: 1 });
    return true;
  } catch (error) {
    console.error('Datafordeler connection test failed:', error);
    return false;
  }
}

/**
 * Check if credentials are configured
 */
export function hasCredentials(): boolean {
  return !!(process.env.DATAFORDELER_USERNAME && process.env.DATAFORDELER_PASSWORD);
}
