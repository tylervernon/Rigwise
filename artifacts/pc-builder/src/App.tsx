import { useMemo, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CircuitBoard,
  Copy,
  Info,
  Plus,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Home() {
  const [budget, setBudget] = useState('');
  const [resolution, setResolution] = useState('');
  const [games, setGames] = useState<string[]>([]);
  const [gameInput, setGameInput] = useState('');
  const [fps, setFps] = useState(90);
  const [preferences, setPreferences] = useState<Preferences>({
    size: 'Balanced',
    noise: 'Quiet',
    appearance: 'Understated',
    upgradeability: 'Plan ahead',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const review = useMemo(() => ({
    budget: budget ? `$${Number(budget).toLocaleString('en-US')}` : 'Not set',
    resolution: resolution || 'Not set',
    games: games.length ? games.join(', ') : 'No games added',
    fps: `${fps} FPS`,
  }), [budget, fps, games, resolution]);

  const updatePreference = (key: keyof Preferences, value: string) => {
    setPreferences((current) => ({ ...current, [key]: value }));
  };

  const addGame = () => {
    const cleanGame = gameInput.trim();
    if (!cleanGame || games.some((game) => game.toLowerCase() === cleanGame.toLowerCase())) {
      setGameInput('');
      return;
    }
    setGames((current) => [...current, cleanGame]);
    setGameInput('');
    setErrors((current) => ({ ...current, games: '' }));
  };

  const handleGameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addGame();
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const numericBudget = Number(budget);
    if (!budget || Number.isNaN(numericBudget) || numericBudget < 500) {
      nextErrors.budget = 'Enter a budget of at least $500.';
    }
    if (!resolution) nextErrors.resolution = 'Choose the resolution you play at.';
    if (!games.length) nextErrors.games = 'Add at least one game to shape the plan.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validate()) {
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const resetPlan = () => {
    setBudget('');
    setResolution('');
    setGames([]);
    setGameInput('');
    setFps(90);
    setPreferences({ size: 'Balanced', noise: 'Quiet', appearance: 'Understated', upgradeability: 'Plan ahead' });
    setErrors({});
    setSubmitted(false);
    setCopied(false);
  };

  const copySummary = async () => {
    const text = `My PC plan: ${review.budget}, ${review.resolution}, ${review.games}, target ${review.fps}.`;
    if (navigator.clipboard) await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="app-shell">
      <aside className="side-rail" aria-label="Builder progress">
        <div>
          <div className="brand">
            <span className="brand-mark"><CircuitBoard aria-hidden="true" /></span>
            Rigwise
          </div>
          <p className="rail-kicker">Build brief / 01</p>
          <nav className="rail-steps">
            {['Budget', 'Performance', 'Preferences', 'Review'].map((label, index) => {
              const isCurrent = submitted ? index === 3 : index < 3;
              return (
                <button
                  className={`rail-step ${isCurrent ? 'active' : ''} ${submitted && index < 3 ? 'complete' : ''}`}
                  data-testid={`button-step-${label.toLowerCase()}`}
                  key={label}
                  onClick={() => {
                    if (submitted) {
                      if (index < 3) setSubmitted(false);
                      window.setTimeout(() => document.getElementById(['section-budget', 'section-performance', 'section-preferences', 'section-review'][index])?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
                    } else {
                      document.getElementById(['section-budget', 'section-performance', 'section-preferences', 'section-review'][index])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  type="button"
                >
                  <span className="rail-number">{submitted && index < 3 ? <Check size={12} /> : `0${index + 1}`}</span>
                  <span className="rail-step-label">{label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="rail-footer">
          <p className="rail-note">A clear brief makes better hardware decisions. No jargon, no guesswork.</p>
          <div className="rail-footline"><span /> Local planning mode</div>
        </div>
      </aside>

      <main className="main-canvas">
        <header className="topbar">
          <span className="mobile-brand">Rigwise / Build brief</span>
          <span className="topbar-meta">Planning tool for considered gamers</span>
          <button className="topbar-action" data-testid="button-start-over" onClick={resetPlan} type="button">
            <RotateCcw size={13} /> Start over
          </button>
        </header>

        <div className="content-grid">
          <section>
            {submitted ? (
              <div className="review-state">
                <div className="intro-row">
                  <div>
                    <p className="eyebrow"><i /> Brief complete</p>
                    <h1 className="page-title">Your build brief is <em>locked in.</em></h1>
                    <p className="page-subtitle">Here’s the signal you’ll want to carry into every PC conversation. Clear inputs, fewer compromises.</p>
                  </div>
                  <div className="status-pill"><span /> Ready to use</div>
                </div>
                <div className="review-hero">
                  <div className="review-check"><CheckCircle2 size={21} /></div>
                  <div>
                    <h2>A solid starting point.</h2>
                    <p>Rigwise has captured your priorities without pretending to know more than you told us.</p>
                  </div>
                </div>
                <div className="review-block">
                  <h3>The essentials</h3>
                  <div className="review-items">
                    <ReviewItem label="Comfortable budget" value={review.budget} />
                    <ReviewItem label="Target resolution" value={review.resolution} />
                    <ReviewItem label="Target frame rate" value={review.fps} />
                    <ReviewItem label="Games" value={review.games} />
                  </div>
                </div>
                <div className="review-block">
                  <h3>Your preferences</h3>
                  <div className="review-items">
                    <ReviewItem label="Footprint" value={preferences.size} />
                    <ReviewItem label="Sound profile" value={preferences.noise} />
                    <ReviewItem label="Appearance" value={preferences.appearance} />
                    <ReviewItem label="Future upgrades" value={preferences.upgradeability} />
                  </div>
                  <p className="review-note">This is a planning brief, not a product recommendation. Take it to a builder, a friend, or your next research session.</p>
                  <div className="review-actions">
                    <button className="primary-button" data-testid="button-copy-summary" onClick={copySummary} type="button">
                      {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied to clipboard' : 'Copy brief'}
                    </button>
                    <button className="secondary-button" data-testid="button-edit-brief" onClick={() => setSubmitted(false)} type="button">Edit brief</button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="intro-row">
                  <div>
                    <p className="eyebrow"><i /> Build brief / 01</p>
                    <h1 className="page-title">Make your next PC <em>make sense.</em></h1>
                    <p className="page-subtitle">Tell us what matters when you play. We’ll turn the noise of PC parts into a brief you can actually use.</p>
                  </div>
                  <div className="status-pill"><span /> Private by default</div>
                </div>
                <form className="builder-form" onSubmit={handleSubmit} noValidate>
                  <section className="section-block" id="section-budget">
                    <div className="section-heading"><span className="section-index">01</span><h2 className="section-title">Set the guardrails</h2></div>
                    <label className="field-label" htmlFor="budget">What’s a comfortable budget?</label>
                    <p className="field-hint">A realistic range helps every choice land in the right place.</p>
                    <div className="budget-field">
                      <span className="currency">$</span>
                      <input className="text-input" data-testid="input-budget" id="budget" inputMode="numeric" min="500" onChange={(event) => setBudget(event.target.value.replace(/[^0-9]/g, ''))} placeholder="1,500" type="text" value={budget} />
                    </div>
                    {errors.budget && <p className="error-text" data-testid="error-budget">{errors.budget}</p>}
                  </section>

                  <section className="section-block" id="section-performance">
                    <div className="section-heading"><span className="section-index">02</span><h2 className="section-title">Choose the view</h2></div>
                    <label className="field-label">Where do you play?</label>
                    <p className="field-hint">Pick the resolution you want your games to feel great at.</p>
                    <div className="option-grid">
                      {[
                        ['1080p', 'Fast, focused, familiar'],
                        ['1440p', 'The sweet spot'],
                        ['4K', 'Every detail turned up'],
                      ].map(([value, helper]) => (
                        <button className={`option-card ${resolution === value ? 'selected' : ''}`} data-testid={`button-resolution-${value}`} key={value} onClick={() => { setResolution(value); setErrors((current) => ({ ...current, resolution: '' })); }} type="button">
                          <strong>{value}</strong><small>{helper}</small>
                        </button>
                      ))}
                    </div>
                    {errors.resolution && <p className="error-text" data-testid="error-resolution">{errors.resolution}</p>}
                  </section>

                  <section className="section-block" id="section-games">
                    <div className="section-heading"><span className="section-index">03</span><h2 className="section-title">Name your games</h2></div>
                    <label className="field-label" htmlFor="games">What do you actually play?</label>
                    <p className="field-hint">A few specific titles are more useful than a genre.</p>
                    <div className="game-input-row">
                      <input className="text-input" data-testid="input-game" id="games" onChange={(event) => setGameInput(event.target.value)} onKeyDown={handleGameKeyDown} placeholder="Try “Baldur’s Gate 3”" type="text" value={gameInput} />
                      <button aria-label="Add game" className="add-button" data-testid="button-add-game" onClick={addGame} type="button"><Plus size={18} /></button>
                    </div>
                    <div className="game-tags" data-testid="list-games">
                      {games.length ? games.map((game) => (
                        <span className="game-tag" data-testid={`tag-game-${game.toLowerCase().replace(/\s+/g, '-')}`} key={game}>
                          {game}
                          <button aria-label={`Remove ${game}`} data-testid={`button-remove-game-${game.toLowerCase().replace(/\s+/g, '-')}`} onClick={() => setGames((current) => current.filter((item) => item !== game))} type="button"><X size={12} /></button>
                        </span>
                      )) : <span className="empty-games">Your games will show up here.</span>}
                    </div>
                    {errors.games && <p className="error-text" data-testid="error-games">{errors.games}</p>}
                  </section>

                  <section className="section-block" id="section-performance-target">
                    <div className="section-heading"><span className="section-index">04</span><h2 className="section-title">Set the feel</h2></div>
                    <label className="field-label" htmlFor="fps">What should “smooth” feel like?</label>
                    <p className="field-hint">A target, not a promise. We’ll use it to frame the brief.</p>
                    <div className="fps-row">
                      <input className="fps-value" data-testid="input-fps" id="fps" max="240" min="30" onChange={(event) => setFps(Number(event.target.value))} type="number" value={fps} />
                      <span className="fps-unit">frames per second</span>
                    </div>
                    <div className="range-wrap">
                      <input aria-label="Target frames per second" data-testid="input-fps-range" max="240" min="30" onChange={(event) => setFps(Number(event.target.value))} type="range" value={fps} />
                      <div className="range-scale"><span>30 FPS</span><span>120 FPS</span><span>240 FPS</span></div>
                    </div>
                  </section>

                  <section className="section-block" id="section-preferences">
                    <div className="section-heading"><span className="section-index">05</span><h2 className="section-title">Make it yours</h2></div>
                    <div className="pref-list">
                      <PreferenceRow label="Size" hint="How much space should it occupy?" options={['Compact', 'Balanced', 'Roomy']} value={preferences.size} onChange={(value) => updatePreference('size', value)} testId="size" />
                      <PreferenceRow label="Noise" hint="How present should the fans be?" options={['Silent', 'Quiet', 'I don’t mind']} value={preferences.noise} onChange={(value) => updatePreference('noise', value)} testId="noise" />
                      <PreferenceRow label="Appearance" hint="What should it say on your desk?" options={['Understated', 'A little drama', 'Showpiece']} value={preferences.appearance} onChange={(value) => updatePreference('appearance', value)} testId="appearance" />
                      <PreferenceRow label="Upgradeability" hint="How long should the plan stretch?" options={['Keep it simple', 'Plan ahead']} value={preferences.upgradeability} onChange={(value) => updatePreference('upgradeability', value)} testId="upgradeability" />
                    </div>
                  </section>

                  <div className="form-actions" id="section-review">
                    <button className="secondary-button" data-testid="button-clear-form" onClick={resetPlan} type="button">Clear everything</button>
                    <button className="primary-button" data-testid="button-review-brief" type="submit">Review my brief <ArrowRight size={15} /></button>
                  </div>
                </form>
              </>
            )}
          </section>
          <SummaryCard review={review} preferences={preferences} submitted={submitted} />
        </div>
      </main>
    </div>
  );
}

type Preferences = {
  size: string;
  noise: string;
  appearance: string;
  upgradeability: string;
};

function PreferenceRow({ label, hint, options, value, onChange, testId }: { label: string; hint: string; options: string[]; value: string; onChange: (value: string) => void; testId: string }) {
  return (
    <div className="pref-row">
      <div className="pref-copy"><strong>{label}</strong><span>{hint}</span></div>
      <div className="segmented" role="group" aria-label={`${label} preference`}>
        {options.map((option) => (
          <button className={`seg-button ${value === option ? 'selected' : ''}`} data-testid={`button-${testId}-${option.toLowerCase().replace(/\s+/g, '-')}`} key={option} onClick={() => onChange(option)} type="button">{option}</button>
        ))}
      </div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return <div className="review-item" data-testid={`review-${label.toLowerCase().replace(/\s+/g, '-')}`}><span>{label}</span><strong>{value}</strong></div>;
}

function SummaryCard({ review, preferences, submitted }: { review: { budget: string; resolution: string; games: string; fps: string }; preferences: Preferences; submitted: boolean }) {
  return (
    <aside className="summary-card" data-testid="card-summary">
      <div className="summary-inner">
        <p className="summary-label">{submitted ? 'Brief snapshot' : 'Live snapshot'}</p>
        <h2 className="summary-title">{submitted ? 'A brief worth bringing along.' : 'Your build, in plain English.'}</h2>
        <p className="summary-intro">{submitted ? 'Everything you told us, in one compact place.' : 'As you answer, this little snapshot keeps the important stuff visible.'}</p>
        <div className="summary-divider" />
        <dl className="summary-list">
          <SummaryLine label="Budget" value={review.budget} />
          <SummaryLine label="Resolution" value={review.resolution} />
          <SummaryLine label="Games" value={review.games} games={review.games !== 'No games added' ? review.games.split(', ') : []} />
          <SummaryLine label="Target" value={review.fps} />
        </dl>
        <div className="summary-divider" />
        <dl className="summary-list">
          <SummaryLine label="Size" value={preferences.size} />
          <SummaryLine label="Noise" value={preferences.noise} />
          <SummaryLine label="Look" value={preferences.appearance} />
          <SummaryLine label="Upgrade path" value={preferences.upgradeability} />
        </dl>
        <div className="confidence">
          <ShieldCheck size={16} />
          <div><strong>No hidden assumptions</strong><p>We only use what you choose. No pricing, parts, or compatibility claims yet.</p></div>
        </div>
        <p className="summary-hint"><Info size={10} /> This stays in your browser for now.</p>
      </div>
    </aside>
  );
}

function SummaryLine({ label, value, games = [] }: { label: string; value: string; games?: string[] }) {
  return (
    <div className="summary-line">
      <dt>{label}</dt>
      <dd data-testid={`summary-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        {games.length ? <span className="summary-games">{games.map((game) => <span className="summary-game" key={game}>{game}</span>)}</span> : value}
      </dd>
    </div>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
