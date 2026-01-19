// Mock function to simulate school holiday checks
// Returns true if the dates conflict with typical school days (Sep-June, excluding breaks)
export const checkSchoolConflict = (timeframe: string): boolean => {
  const normalized = timeframe.toLowerCase();
  
  // Safe periods (Breaks)
  if (
      normalized.includes('summer') || 
      normalized.includes('june') || 
      normalized.includes('july') || 
      normalized.includes('august') || 
      normalized.includes('winter') || 
      normalized.includes('december') ||
      normalized.includes('spring break')
  ) {
      return false;
  }

  // Conflict periods (School in session)
  if (
      normalized.includes('september') || 
      normalized.includes('october') || 
      normalized.includes('november') || 
      normalized.includes('january') || 
      normalized.includes('february') || 
      normalized.includes('march') || 
      normalized.includes('april') || 
      normalized.includes('may')
  ) {
      return true;
  }

  return false; // Default safe if unsure
};