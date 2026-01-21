// Mock function to simulate school holiday checks
// Returns true if the dates conflict with typical school days (Sep-June, excluding breaks)
export const checkSchoolConflict = (description: string, startDate?: string): boolean => {
  // If we have a specific date, use strict month checking
  if (startDate) {
      const date = new Date(startDate);
      const month = date.getMonth(); // 0-11
      // Conflict: Jan(0), Feb(1), Mar(2), Apr(3), May(4), Jun(5), Sep(8), Oct(9), Nov(10), Dec(11)
      // Safe: Jul(6), Aug(7)
      return [0, 1, 2, 3, 4, 5, 8, 9, 10, 11].includes(month);
  }

  // Fallback to text matching
  const normalized = description.toLowerCase();
  
  // Safe periods (Summer Break)
  if (
      normalized.includes('july') || normalized.includes('jul ') ||
      normalized.includes('august') || normalized.includes('aug ')
  ) {
      return false;
  }

  // Conflict periods (School in session)
  // Check for both full names and abbreviations
  const schoolMonths = [
      'sep', 'september',
      'oct', 'october',
      'nov', 'november',
      'dec', 'december',
      'jan', 'january',
      'feb', 'february',
      'mar', 'march',
      'apr', 'april',
      'may',
      'jun', 'june'
  ];

  if (schoolMonths.some(m => normalized.includes(m))) {
      return true;
  }

  return false; // Default safe if unsure
};