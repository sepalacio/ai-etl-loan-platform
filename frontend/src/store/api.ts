import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  LoanApplication,
  BorrowerProfile,
  CreateApplicationDto,
} from '../types/api';
import type { RootState } from './index';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const email = (getState() as RootState).lender.email;
      if (email) headers.set('X-Lender-Email', email);
      return headers;
    },
  }),
  tagTypes: ['Application'],
  endpoints: (builder) => ({
    listApplications: builder.query<LoanApplication[], void>({
      query: () => '/applications',
      providesTags: ['Application'],
    }),
    getApplication: builder.query<LoanApplication, string>({
      query: (id) => `/applications/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Application', id }],
    }),
    getBorrowerProfile: builder.query<BorrowerProfile, string>({
      query: (id) => `/applications/${id}/profile`,
    }),
    createApplication: builder.mutation<LoanApplication, CreateApplicationDto>({
      query: (body) => ({ url: '/applications', method: 'POST', body }),
      invalidatesTags: ['Application'],
    }),
    getDocumentDownloadUrl: builder.query<{ url: string }, { applicationId: string; docId: string }>({
      query: ({ applicationId, docId }) => `/applications/${applicationId}/documents/${docId}/download`,
    }),
  }),
});

export const {
  useListApplicationsQuery,
  useGetApplicationQuery,
  useGetBorrowerProfileQuery,
  useCreateApplicationMutation,
  useLazyGetDocumentDownloadUrlQuery,
} = api;
