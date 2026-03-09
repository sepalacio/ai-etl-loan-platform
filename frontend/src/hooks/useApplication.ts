import { useGetApplicationQuery, useGetBorrowerProfileQuery } from '../store/api';

export function useApplication(id: string | undefined) {
  const { data: application, isLoading: appLoading, error: appError } =
    useGetApplicationQuery(id!, { skip: !id });

  const { data: profile, isLoading: profileLoading } =
    useGetBorrowerProfileQuery(id!, { skip: !id });

  return {
    application: application ?? null,
    profile: profile ?? null,
    isLoading: appLoading || profileLoading,
    error: appError ? 'Failed to load application' : null,
  };
}
