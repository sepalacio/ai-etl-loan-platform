import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { clearEmail, dismissWelcome, dismissToast, selectLenderEmail, selectShowWelcome, selectToast } from '../store/lenderSlice';
import { Logo } from './Logo';
import { WelcomeToast } from './WelcomeToast';
import { AppToast } from './AppToast';

export function Layout() {
  const dispatch = useAppDispatch();
  const email = useAppSelector(selectLenderEmail);
  const showWelcome = useAppSelector(selectShowWelcome);
  const toast = useAppSelector(selectToast);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-nav px-6 h-14 flex items-center justify-between">
        <Link to="/">
          <Logo className="text-white" />
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-md">
            {email}
          </span>
          <button
            onClick={() => dispatch(clearEmail())}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1.5"
          >
            Switch
          </button>
        </div>
      </nav>

      {/* key forces remount on route change */}
      <main
        key={location.pathname}
        className="max-w-5xl mx-auto px-6 py-10 animate-[fade-up_0.25s_ease-out]"
      >
        <Outlet />
      </main>

      {showWelcome && (
        <WelcomeToast email={email} onDismiss={() => dispatch(dismissWelcome())} />
      )}
      {toast && (
        <AppToast toast={toast} onDismiss={() => dispatch(dismissToast())} />
      )}
    </div>
  );
}
