/**
 * Admin Utility Functions
 * Helper functions for calculations and data transformations
 */

// ================================================================
// SCORE CALCULATION UTILITIES
// ================================================================

/**
 * Calculate percentage from score
 * @param score - Student's score
 * @param total - Total possible marks
 * @returns Percentage rounded to 1 decimal place
 */
export const calculatePercentage = (score: number, total: number): number => {
  if (total <= 0) return 0;
  return Math.round((score / total) * 100 * 10) / 10;
};

/**
 * Calculate average score
 * @param scores - Array of scores
 * @returns Average score rounded to 1 decimal place
 */
export const calculateAverage = (scores: number[]): number => {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round((sum / scores.length) * 10) / 10;
};

/**
 * Calculate grade based on percentage
 * @param percentage - Score percentage (0-100)
 * @returns Grade letter (A, B, C, D, F)
 */
export const calculateGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

/**
 * Get grade color
 * @param grade - Grade letter
 * @returns Tailwind color class
 */
export const getGradeColor = (grade: string): string => {
  switch (grade.toUpperCase()) {
    case 'A':
      return 'text-green-600 bg-green-50';
    case 'B':
      return 'text-blue-600 bg-blue-50';
    case 'C':
      return 'text-yellow-600 bg-yellow-50';
    case 'D':
      return 'text-orange-600 bg-orange-50';
    case 'F':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

/**
 * Get performance status badge
 * @param percentage - Score percentage
 * @returns Status object with label and color
 */
export const getPerformanceStatus = (percentage: number): { label: string; color: string } => {
  if (percentage >= 80) {
    return { label: 'Excellent', color: 'text-green-600' };
  }
  if (percentage >= 60) {
    return { label: 'Good', color: 'text-blue-600' };
  }
  if (percentage >= 40) {
    return { label: 'Average', color: 'text-yellow-600' };
  }
  return { label: 'Poor', color: 'text-red-600' };
};

// ================================================================
// DATE UTILITIES
// ================================================================

/**
 * Format date to IST format
 * @param date - Date to format
 * @returns Formatted date string
 */
export const formatDateIST = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get time difference in human readable format
 * @param date - Date to calculate from
 * @returns Human readable time difference
 */
export const getTimeDifference = (date: string | Date): string => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

// ================================================================
// VALIDATION UTILITIES
// ================================================================

/**
 * Validate email format
 * @param email - Email to validate
 * @returns True if valid email
 */
export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate score range
 * @param score - Score to validate
 * @param min - Minimum score
 * @param max - Maximum score
 * @returns True if score is in valid range
 */
export const isValidScore = (score: number, min: number = 0, max: number = 100): boolean => {
  return score >= min && score <= max;
};

// ================================================================
// ARRAY UTILITIES
// ================================================================

/**
 * Group array by key
 * @param array - Array to group
 * @param key - Key to group by
 * @returns Grouped object
 */
export const groupBy = <T extends Record<string, any>>(
  array: T[],
  key: keyof T
): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const group = String(item[key]);
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

/**
 * Get unique values from array
 * @param array - Array to get unique values from
 * @param key - Optional key for object arrays
 * @returns Array of unique values
 */
export const getUnique = <T extends Record<string, any> | string>(
  array: T[],
  key?: keyof T
): T[] => {
  if (key) {
    const seen = new Set();
    return array.filter(item => {
      const k = String(item[key]);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
  return Array.from(new Set(array));
};

// ================================================================
// STRING UTILITIES
// ================================================================

/**
 * Capitalize first letter
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Truncate string
 * @param str - String to truncate
 * @param length - Maximum length
 * @returns Truncated string with ellipsis
 */
export const truncate = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};

// ================================================================
// EXPORT ALL
// ================================================================

export default {
  calculatePercentage,
  calculateAverage,
  calculateGrade,
  getGradeColor,
  getPerformanceStatus,
  formatDateIST,
  getTimeDifference,
  isValidEmail,
  isValidScore,
  groupBy,
  getUnique,
  capitalize,
  truncate
};