// Mock function to simulate school holiday checks
// Returns true if the dates conflict with typical school days (Sep-June 10th, excluding breaks)
export const checkSchoolConflict = (description: string, startDate?: string): boolean => {
  // If we have a specific date, use strict date checking
  if (startDate) {
      const date = new Date(startDate);
      const month = date.getMonth(); // 0-11
      const day = date.getDate();

      // Conflict: Jan(0), Feb(1), Mar(2), Apr(3), May(4), Sep(8), Oct(9), Nov(10), Dec(11)
      if ([0, 1, 2, 3, 4, 8, 9, 10, 11].includes(month)) {
          return true;
      }

      // June(5) logic: School is typically in session until around June 10th
      if (month === 5 && day <= 10) {
          return true;
      }

      // Safe: Jul(6), Aug(7), Jun(5) after the 10th
      return false;
  }

  // Fallback to text matching
  const normalized = description.toLowerCase();
  
  // Safe periods (Summer Break)
  if (
      normalized.includes('july') || normalized.includes('jul ') ||
      normalized.includes('august') || normalized.includes('aug ') ||
      normalized.includes('mid june') || normalized.includes('late june') || normalized.includes('end of june')
  ) {
      return false;
  }

  // Conflict periods (School in session)
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
      // 'jun', 'june' -> Removed generic June to be more permissive per user request
      'early june'
  ];

  if (schoolMonths.some(m => normalized.includes(m))) {
      return true;
  }

  return false; // Default safe if unsure
};