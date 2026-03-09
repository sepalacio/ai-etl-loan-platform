import { useGetApplicationQuery, useGetBorrowerProfileQuery } from '../store/api';

export function useApplication(id: string | undefined) {
  const { data: application, isLoading: appLoading, error: appError, isFetching: appFetching, refetch: refetchApp } =
    useGetApplicationQuery(id!, { skip: !id });

  const { data: profile, isLoading: profileLoading, isFetching: profileFetching, refetch: refetchProfile } =
    useGetBorrowerProfileQuery(id!, { skip: !id });

  const refetch = () => {
    refetchApp();
    refetchProfile();
  };

  return {
    application: application ?? null,
    profile: profile ?? null,
    isLoading: appLoading || profileLoading,
    isFetching: appFetching || profileFetching,
    error: appError ? 'Failed to load application' : null,
    refetch,
  };
}
