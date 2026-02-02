import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useProfileStore } from '@/lib/store';

/**
 * Hook to sync profile when user authenticates.
 *
 * How Demo Access Works for Non-Logged-In Visitors:
 * 1. Visitor lands on landing page and clicks "Load Demo Profile"
 * 2. restoreDemoProfile() is called, which sets isDemoMode: true
 * 3. Demo data (Alex Johnson) loads into DEMO_STORAGE_KEY localStorage
 * 4. Visitor is redirected to home page
 * 5. This hook runs but does NOTHING (because isAuthenticated = false)
 * 6. Visitor sees demo data from localStorage and can navigate the entire app
 * 7. No authentication required, no database access needed
 */
export function useProfileSync() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { initializeAuthenticatedProfile, isDemoMode, isInitialized } = useProfileStore();

  useEffect(() => {
    // Only init if: authenticated, not loading, not demo, not already initialized
    // NOTE: This hook does NOT run for non-authenticated demo users
    // They continue to use the demo data from localStorage without any DB sync
    if (!isLoading && isAuthenticated && user && !isDemoMode && !isInitialized) {
      initializeAuthenticatedProfile(user.id);
    }
  }, [isAuthenticated, isLoading, user, isDemoMode, isInitialized, initializeAuthenticatedProfile]);
}
