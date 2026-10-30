import { useEffect } from 'react';
import { hrefFor, useRoute } from './lib/router.js';
import { useStore } from './state/store.js';
import { catalog } from './content/index.js';
import { dueReviews, summarize } from './state/progress.js';
import { usePythonStatus, warmUp } from './runtime/python.js';
import PathPage from './components/PathPage.jsx';
import ChallengePage from './components/ChallengePage.jsx';
import ReviewPage from './components/ReviewPage.jsx';
import ReferencePage from './components/ReferencePage.jsx';
import SettingsPage from './components/SettingsPage.jsx';

export default function App() {
  const route = useRoute();
  const settings = useStore((s) => s.settings);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', settings.theme);
    root.style.setProperty('--editor-font-size', `${settings.fontSize}px`);
  }, [settings]);

  // Start downloading Python shortly after the first paint, so it's ready by the first Check.
  useEffect(() => {
    const t = setTimeout(warmUp, 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const c = route.page === 'challenge' && catalog.byId.get(route.id);
    document.title = c ? `${c.code} ${c.title} · pycoach` : 'pycoach';
  }, [route]);

  return (
    <div className={`app app-${route.page}`}>
      <Header route={route} />
      <main>
        {route.page === 'path' && <PathPage />}
        {route.page === 'challenge' && <ChallengePage id={route.id} review={route.review} />}
        {route.page === 'review' && <ReviewPage />}
        {route.page === 'ref' && <ReferencePage />}
        {route.page === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}

function Header({ route }) {
  const entries = useStore((s) => s.entries);
  const python = usePythonStatus();
  const total = summarize(catalog.order, entries);
  const due = dueReviews(catalog.order, entries, Date.now()).length;
  const link = (page, href, label) => (
    <a href={href} className={route.page === page ? 'active' : ''} aria-current={route.page === page ? 'page' : undefined}>{label}</a>
  );
  return (
    <header className="topbar">
      <a className="brand mono" href={hrefFor.path()}>pycoach</a>
      <nav>
        {link('path', hrefFor.path(), 'Path')}
        {link('review', hrefFor.review(), <>Review{due > 0 && <span className="badge">{due}</span>}</>)}
        {link('ref', hrefFor.ref(), 'Reference')}
        {link('settings', hrefFor.settings(), 'Settings')}
      </nav>
      <span className="spacer" />
      <span className="topstats mono">
        <span title="challenges passed">{total.passed}/{total.total}</span>
        <span title="experience points">{total.xp} xp</span>
        <span className={`runtime runtime-${python.status}`} title="Python runtime">
          {python.status === 'ready' ? python.version || python.detail : python.detail}
        </span>
      </span>
    </header>
  );
}
