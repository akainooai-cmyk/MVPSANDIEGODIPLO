/**
 * URL validation utilities
 * Validates URLs to ensure they are accessible and not returning 404 or empty pages
 */

export interface UrlValidationResult {
  url: string;
  isValid: boolean;
  statusCode?: number;
  error?: string;
  isEmpty?: boolean;
}

/**
 * Validates a URL by checking if it's accessible and returns valid content
 * @param url The URL to validate
 * @param timeout Timeout in milliseconds (default: 10000)
 * @returns Validation result
 */
export async function validateUrl(
  url: string,
  timeout: number = 10000
): Promise<UrlValidationResult> {
  try {
    // Validate URL format
    let urlObj: URL;
    try {
      urlObj = new URL(url);
    } catch {
      return {
        url,
        isValid: false,
        error: 'Invalid URL format',
      };
    }

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        url,
        isValid: false,
        error: 'Only HTTP and HTTPS protocols are allowed',
      };
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Fetch the URL with HEAD request first (faster)
      const headResponse = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; URLValidator/1.0)',
        },
      });

      clearTimeout(timeoutId);

      // Check status code
      if (!headResponse.ok) {
        return {
          url,
          isValid: false,
          statusCode: headResponse.status,
          error: `HTTP ${headResponse.status}: ${headResponse.statusText}`,
        };
      }

      // If HEAD succeeded, try GET to check content
      const getController = new AbortController();
      const getTimeoutId = setTimeout(() => getController.abort(), timeout);

      try {
        const getResponse = await fetch(url, {
          method: 'GET',
          signal: getController.signal,
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; URLValidator/1.0)',
          },
        });

        clearTimeout(getTimeoutId);

        // Check if page is empty (very small content)
        const contentLength = getResponse.headers.get('content-length');
        if (contentLength && parseInt(contentLength) < 100) {
          // Try to read the body to verify
          const text = await getResponse.text();
          if (text.trim().length < 50) {
            return {
              url,
              isValid: false,
              statusCode: getResponse.status,
              isEmpty: true,
              error: 'Page appears to be empty or has minimal content',
            };
          }
        }

        return {
          url,
          isValid: true,
          statusCode: getResponse.status,
        };
      } catch (getError: any) {
        // If GET failed but HEAD succeeded, still consider valid
        // (Some sites block GET but allow HEAD)
        return {
          url,
          isValid: true,
          statusCode: headResponse.status,
        };
      }
    } catch (headError: any) {
      clearTimeout(timeoutId);

      if (headError.name === 'AbortError') {
        return {
          url,
          isValid: false,
          error: 'Request timeout',
        };
      }

      return {
        url,
        isValid: false,
        error: headError.message || 'Failed to fetch URL',
      };
    }
  } catch (error: any) {
    return {
      url,
      isValid: false,
      error: error.message || 'Unexpected error during validation',
    };
  }
}

/**
 * Validates multiple URLs in parallel
 * @param urls Array of URLs to validate
 * @param maxConcurrent Maximum number of concurrent validations (default: 5)
 * @returns Array of validation results
 */
export async function validateUrls(
  urls: string[],
  maxConcurrent: number = 5
): Promise<UrlValidationResult[]> {
  const results: UrlValidationResult[] = [];

  // Process URLs in batches to avoid overwhelming the system
  for (let i = 0; i < urls.length; i += maxConcurrent) {
    const batch = urls.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(
      batch.map(url => validateUrl(url))
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Filters valid URLs from a list of validation results
 * @param results Array of validation results
 * @returns Array of valid URLs
 */
export function getValidUrls(results: UrlValidationResult[]): string[] {
  return results
    .filter(result => result.isValid)
    .map(result => result.url);
}

/**
 * Filters invalid URLs from a list of validation results
 * @param results Array of validation results
 * @returns Array of invalid URLs with their errors
 */
export function getInvalidUrls(
  results: UrlValidationResult[]
): { url: string; error: string }[] {
  return results
    .filter(result => !result.isValid)
    .map(result => ({
      url: result.url,
      error: result.error || 'Unknown error',
    }));
}
