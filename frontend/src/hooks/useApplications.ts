import { useListApplicationsQuery } from '../store/api';

export function useApplications() {
  const { data: applications = [], isLoading, error } = useListApplicationsQuery();
  return {
    applications,
    isLoading,
    error: error ? 'Failed to load applications' : null,
  };
}
