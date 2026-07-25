/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Normalizes date strings to the standard ISO YYYY-MM-DD format.
 */
export function normalizeDate(dateStr: string): string {
  const cleaned = dateStr.replace(/[\/\.]/g, '-').trim();
  
  // Format: DD-MM-YYYY or MM-DD-YYYY to YYYY-MM-DD (heuristically)
  const parts = cleaned.split('-');
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      // Assuming DD-MM-YYYY, swap to YYYY-MM-DD
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
  }

  // Fallback to JS standard Date parsing if possible
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch (e) {
    // Ignore error and return raw string
  }

  return dateStr.trim();
}

/**
 * Cleans currency strings, returning a raw floating-point number.
 */
export function normalizeCurrency(currencyStr: string | number): number {
  if (typeof currencyStr === 'number') return currencyStr;
  
  const cleaned = currencyStr
    .replace(/[R\$\s,]/g, (match) => {
      if (match === ',') return '.';
      return '';
    })
    .trim();
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Standardizes South African vehicle registration license plates.
 */
export function normalizeLicensePlate(plateStr: string): string {
  const cleaned = plateStr.toUpperCase().replace(/[^A-Z0-9\-]/g, '').trim();
  
  // Format GP plates nicely if possible (e.g., GP-SCALE-1 -> GP-SCALE-1)
  return cleaned;
}

/**
 * Standardizes personal driver names to Title Case with single spacing.
 */
export function normalizeName(nameStr: string): string {
  return nameStr
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
