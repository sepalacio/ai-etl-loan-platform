import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAppSelector } from './store';
import { selectLenderEmail } from './store/lenderSlice';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PageLoader } from './components/PageLoader';
import { LenderEmailPrompt } from './components/LenderEmailPrompt';
import { Layout } from './components/Layout';

const LenderDashboard = lazy(() =>
  import('./pages/LenderDashboard').then((m) => ({ default: m.LenderDashboard })),
);
const CreateApplication = lazy(() =>
  import('./pages/CreateApplication').then((m) => ({ default: m.CreateApplication })),
);
const ApplicationDetail = lazy(() =>
  import('./pages/ApplicationDetail').then((m) => ({ default: m.ApplicationDetail })),
);
const BorrowerUpload = lazy(() =>
  import('./pages/BorrowerUpload').then((m) => ({ default: m.BorrowerUpload })),
);

function LenderApp() {
  const email = useAppSelector(selectLenderEmail);
  if (!email) return <LenderEmailPrompt />;
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<LenderDashboard />} />
          <Route path="applications/new" element={<CreateApplication />} />
          <Route path="applications/:id" element={<ApplicationDetail />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/upload/:token" element={<BorrowerUpload />} />
          <Route path="/*" element={<LenderApp />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
