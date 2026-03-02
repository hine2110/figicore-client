/**
 * Formats a string or number into a VND currency input format (e.g., 1.000.000)
 */
export const formatVNDInput = (value: string | number): string => {
    if (value === undefined || value === null || value === '') return '';

    // Remove all non-digit characters
    const numericValue = value.toString().replace(/\D/g, '');

    if (numericValue === '') return '';

    // Format with dots as thousand separators
    return new Intl.NumberFormat('vi-VN').format(parseInt(numericValue, 10));
};

/**
 * Parses a formatted VND input string back into a numeric value
 */
export const parseVNDInput = (value: string): number => {
    if (!value) return 0;

    // Remove all non-digit characters
    const numericValue = value.replace(/\D/g, '');

    return numericValue === '' ? 0 : parseInt(numericValue, 10);
};

/**
 * Helper to handle VND input change events
 */
export const handleVNDInputChange = (value: string, callback: (numericValue: number, formattedValue: string) => void) => {
    const numeric = parseVNDInput(value);
    const formatted = formatVNDInput(numeric);
    callback(numeric, formatted);
};
