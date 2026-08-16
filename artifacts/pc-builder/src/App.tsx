import { useMemo, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Check,
  CircuitBoard,
  Copy,
  Cpu,
  Fan,
  Gauge,
  HardDrive,
  Info,
  MemoryStick,
  Plus,
  RotateCcw,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import {
  type AppearancePreference,
  type NoisePreference,
  type Part,
  type Resolution,
  type SizePreference,
} from '@/data/parts';
import {
  formatCategory,
  selectBasicBuild,
  type BuildPreferences,
  type BuildRequest,
  type SelectedBuild,
} from '@/lib/build-recommender';

const queryClient = new QueryClient();

const defaultPreferences: BuildPreferences = {
  size: 'Balanced',
  noise: 'Quiet',
  appearance: 'Understated',
  upgradeability: 'Plan ahead',
};

function Home() {
  const [budget, setBudget] = useState('');
  const [resolution, setResolution] = useState<Resolution | ''>('');
  const [games, setGames] = useState<string[]>([]);
  const [gameInput, setGameInput] = useState('');
  const [fps, setFps] = useState(90);
  const [preferences, setPreferences] = useState<BuildPreferences>(defaultPreferences);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [buildRequest, setBuildRequest] = useState<BuildRequest | null>(null);

  const review = useMemo(() => ({
    budget: budget ? `$${Number(budget).toLocaleString('en-US')}` : 'Not set',
    resolution: resolution || 'Not set',
    games: games.length ? games.join(', ') : 'No games added',
    fps: `${fps} FPS`,
  }), [budget, fps, games, resolution]);

  const selectedBuild = useMemo(
    () => (buildRequest ? selectBasicBuild(buildRequest) : null),
    [buildRequest],
  );

  const updatePreference = <T extends keyof BuildPreferences>(key: T, value: BuildPreferences[T]) => {
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
    if (!validate() || !resolution) return;

    setBuildRequest({
      budget: Number(budget),
      resolution,
      games: [...games],
      fps,
      preferences,
    });
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetPlan = () => {
    setBudget('');
    setResolution('');
    setGames([]);
    setGameInput('');
    setFps(90);
    setPreferences(defaultPreferences);
    setErrors({});
    setBuildRequest(null);
    setSubmitted(false);
    setCopied(false);
  };

  const editBrief = () => {
    setSubmitted(false);
    window.setTimeout(() => document.getElementById('section-budget')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const copySummary = async () => {
    const buildLines = selectedBuild
      ? `\nSelected parts: ${selectedBuild.parts.map((part) => `${formatCategory(part.category)} — ${part.name}`).join(', ')}.\nSample total: ${formatCurrency(selectedBuild.totalPrice)}.`
      : '';
    const text = `My Rigwise plan: ${review.budget}, ${review.resolution}, ${review.games}, target ${review.fps}.${buildLines}`;
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(text);
    } finally {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
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
            {['Budget', 'Performance', 'Preferences', 'Build'].map((label, index) => {
              const isCurrent = submitted ? index === 3 : index < 3;
              return (
                <button
                  className={`rail-step ${isCurrent ? 'active' : ''} ${submitted && index < 3 ? 'complete' : ''}`}
                  data-testid={`button-step-${label.toLowerCase()}`}
                  key={label}
                  onClick={() => {
                    if (submitted && index < 3) setSubmitted(false);
                    window.setTimeout(() => document.getElementById(['section-budget', 'section-performance', 'section-preferences', 'section-review'][index])?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
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
            {submitted && selectedBuild ? (
              <ResultsState
                build={selectedBuild}
                copied={copied}
                onCopy={copySummary}
                onEdit={editBrief}
              />
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
                      <input aria-describedby={errors.budget ? 'error-budget' : undefined} className="text-input" data-testid="input-budget" id="budget" inputMode="numeric" min="500" onChange={(event) => setBudget(event.target.value.replace(/[^0-9]/g, ''))} placeholder="1,500" type="text" value={budget} />
                    </div>
                    {errors.budget && <p className="error-text" data-testid="error-budget" id="error-budget">{errors.budget}</p>}
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
                        <button aria-pressed={resolution === value} className={`option-card ${resolution === value ? 'selected' : ''}`} data-testid={`button-resolution-${value}`} key={value} onClick={() => { setResolution(value as Resolution); setErrors((current) => ({ ...current, resolution: '' })); }} type="button">
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
                      <input aria-describedby={errors.games ? 'error-games' : undefined} className="text-input" data-testid="input-game" id="games" onChange={(event) => setGameInput(event.target.value)} onKeyDown={handleGameKeyDown} placeholder="Try “Baldur’s Gate 3”" type="text" value={gameInput} />
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
                    {errors.games && <p className="error-text" data-testid="error-games" id="error-games">{errors.games}</p>}
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
                      <PreferenceRow label="Size" hint="How much space should it occupy?" options={['Compact', 'Balanced', 'Roomy']} value={preferences.size} onChange={(value) => updatePreference('size', value as SizePreference)} testId="size" />
                      <PreferenceRow label="Noise" hint="How present should the fans be?" options={['Silent', 'Quiet', 'I don’t mind']} value={preferences.noise} onChange={(value) => updatePreference('noise', value as NoisePreference)} testId="noise" />
                      <PreferenceRow label="Appearance" hint="What should it say on your desk?" options={['Understated', 'A little drama', 'Showpiece']} value={preferences.appearance} onChange={(value) => updatePreference('appearance', value as AppearancePreference)} testId="appearance" />
                      <PreferenceRow label="Upgradeability" hint="How long should the plan stretch?" options={['Keep it simple', 'Plan ahead']} value={preferences.upgradeability} onChange={(value) => updatePreference('upgradeability', value as BuildPreferences['upgradeability'])} testId="upgradeability" />
                    </div>
                  </section>

                  <div className="form-actions" id="section-review">
                    <button className="secondary-button" data-testid="button-clear-form" onClick={resetPlan} type="button">Clear everything</button>
                    <button className="primary-button" data-testid="button-review-brief" type="submit">Build my baseline <ArrowRight size={15} /></button>
                  </div>
                </form>
              </>
            )}
          </section>
          <SummaryCard build={selectedBuild} preferences={preferences} review={review} submitted={submitted} />
        </div>
      </main>
    </div>
  );
}

function ResultsState({ build, copied, onCopy, onEdit }: { build: SelectedBuild; copied: boolean; onCopy: () => void; onEdit: () => void }) {
  const tierLabel = getPerformanceTierLabel(build.performanceTier);
  return (
    <div className="results-state" id="section-review">
      <div className="intro-row">
        <div>
          <p className="eyebrow"><i /> Build result / local catalog</p>
          <h1 className="page-title">A baseline that <em>knows your priorities.</em></h1>
          <p className="page-subtitle">Eight sample parts, selected from the local Rigwise catalog to give your brief a tangible starting point.</p>
        </div>
        <div className="status-pill result-pill"><span /> Baseline ready</div>
      </div>

      <div className="result-callout">
        <div className="result-callout-mark"><Check size={19} /></div>
        <div>
          <p className="callout-kicker">Performance read</p>
          <h2>{tierLabel}</h2>
          <p>Graphics performance is the anchor here. The surrounding parts are chosen to keep the plan balanced, serviceable, and within the limits of this sample catalog.</p>
        </div>
      </div>

      <div className="result-metrics" aria-label="Build summary metrics">
        <MetricCard label="Sample total" value={formatCurrency(build.totalPrice)} detail="local catalog value" testId="metric-total" />
        <MetricCard label="Estimated draw" value={`${build.estimatedPower}W`} detail="CPU + GPU + system margin" testId="metric-power" />
        <MetricCard label={build.budgetRemaining >= 0 ? 'Budget left' : 'Over budget'} value={formatCurrency(Math.abs(build.budgetRemaining))} detail={build.budgetRemaining >= 0 ? 'before peripherals' : 'closest match shown'} testId="metric-remaining" />
        <MetricCard label="Performance tier" value={`${build.performanceTier} / 4`} detail={tierLabel} testId="metric-tier" />
      </div>

      <section className="results-section" aria-labelledby="selected-parts-title">
        <div className="results-section-heading">
          <div>
            <p className="section-index">01</p>
            <h2 id="selected-parts-title">Selected parts</h2>
          </div>
          <span className="parts-count" data-testid="text-parts-count">{build.parts.length} components</span>
        </div>
        <div className="parts-grid">
          {build.parts.map((part) => <PartCard key={part.id} part={part} />)}
        </div>
      </section>

      <section className="results-section notes-section" aria-labelledby="recommender-notes-title">
        <div className="results-section-heading">
          <div>
            <p className="section-index">02</p>
            <h2 id="recommender-notes-title">Why this shape</h2>
          </div>
          <span className="notes-label"><Info size={13} /> Recommender notes</span>
        </div>
        <ul className="notes-list">
          {build.notes.map((note, index) => <li data-testid={`text-note-${index}`} key={note}><span>{String(index + 1).padStart(2, '0')}</span>{note}</li>)}
        </ul>
      </section>

      <div className="local-data-notice" data-testid="notice-local-data">
        <ShieldCheck size={17} />
        <div>
          <strong>Use this as a planning baseline.</strong>
          <p>Prices are local sample data, not live market prices. Rigwise has not run a full compatibility validation, so confirm clearances, BIOS support, connectors, and current pricing before you buy.</p>
        </div>
      </div>

      <div className="results-actions">
        <button className="secondary-button results-back" data-testid="button-edit-brief" onClick={onEdit} type="button"><ArrowLeft size={14} /> Edit brief</button>
        <button className="primary-button" data-testid="button-copy-summary" onClick={onCopy} type="button">
          {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied to clipboard' : 'Copy build summary'}
        </button>
      </div>
    </div>
  );
}

function PartCard({ part }: { part: Part }) {
  return (
    <article className="part-card" data-testid={`card-part-${part.id}`}>
      <div className="part-card-top">
        <span className="part-icon"><PartIcon category={part.category} /></span>
        <span className="part-category">{formatCategory(part.category)}</span>
        <span className="part-price" data-testid={`text-price-${part.id}`}>{formatCurrency(part.price)}</span>
      </div>
      <h3 data-testid={`text-part-name-${part.id}`}>{part.name}</h3>
      <p className="part-brand">{part.brand}</p>
      <p className="part-meta">{getPartMeta(part)}</p>
    </article>
  );
}

function PartIcon({ category }: { category: Part['category'] }) {
  if (category === 'cpu') return <Cpu aria-hidden="true" size={18} />;
  if (category === 'gpu') return <Gauge aria-hidden="true" size={18} />;
  if (category === 'ram') return <MemoryStick aria-hidden="true" size={18} />;
  if (category === 'storage') return <HardDrive aria-hidden="true" size={18} />;
  if (category === 'psu') return <Zap aria-hidden="true" size={18} />;
  if (category === 'case') return <Box aria-hidden="true" size={18} />;
  if (category === 'cooler') return <Fan aria-hidden="true" size={18} />;
  return <CircuitBoard aria-hidden="true" size={18} />;
}

function getPartMeta(part: Part) {
  switch (part.category) {
    case 'cpu':
      return `${part.cores} cores · ${part.socket} · ${part.powerDraw}W`;
    case 'gpu':
      return `${part.vramGb}GB VRAM · ${part.powerDraw}W · ${part.lengthMm}mm`;
    case 'motherboard':
      return `${part.formFactor} · ${part.socket} · ${part.m2Slots} M.2 slots`;
    case 'ram':
      return `${part.capacityGb}GB · ${part.speedMhz}MHz · ${part.sticks}-stick kit`;
    case 'storage':
      return `${part.capacityGb >= 1000 ? `${part.capacityGb / 1000}TB` : `${part.capacityGb}GB`} · ${part.interface}`;
    case 'psu':
      return `${part.wattage}W · ${part.efficiency} · Modular`;
    case 'case':
      return `${part.size} · ${part.maxGpuLengthMm}mm GPU clearance`;
    case 'cooler':
      return `${part.noise} · ${part.thermalCapacityW}W thermal capacity`;
  }
}

function getPerformanceTierLabel(tier: number) {
  return {
    1: 'Entry 1080p',
    2: 'Mainstream 1080p / 1440p',
    3: 'High 1440p',
    4: 'Enthusiast 4K',
  }[tier] ?? 'Baseline performance';
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString('en-US')}`;
}

function MetricCard({ label, value, detail, testId }: { label: string; value: string; detail: string; testId: string }) {
  return (
    <div className="metric-card" data-testid={testId}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function PreferenceRow({ label, hint, options, value, onChange, testId }: { label: string; hint: string; options: string[]; value: string; onChange: (value: string) => void; testId: string }) {
  return (
    <div className="pref-row">
      <div className="pref-copy"><strong>{label}</strong><span>{hint}</span></div>
      <div className="segmented" role="group" aria-label={`${label} preference`}>
        {options.map((option) => (
          <button aria-pressed={value === option} className={`seg-button ${value === option ? 'selected' : ''}`} data-testid={`button-${testId}-${option.toLowerCase().replace(/\s+/g, '-')}`} key={option} onClick={() => onChange(option)} type="button">{option}</button>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ review, preferences, submitted, build }: { review: { budget: string; resolution: string; games: string; fps: string }; preferences: BuildPreferences; submitted: boolean; build: SelectedBuild | null }) {
  return (
    <aside className={`summary-card ${build ? 'summary-card-results' : ''}`} data-testid="card-summary">
      <div className="summary-inner">
        <p className="summary-label">{build ? 'Selected baseline' : submitted ? 'Brief snapshot' : 'Live snapshot'}</p>
        <h2 className="summary-title">{build ? getPerformanceTierLabel(build.performanceTier) : submitted ? 'A brief worth bringing along.' : 'Your build, in plain English.'}</h2>
        <p className="summary-intro">{build ? 'A local, sample-data translation of the brief you just submitted.' : submitted ? 'Everything you told us, in one compact place.' : 'As you answer, this little snapshot keeps the important stuff visible.'}</p>
        <div className="summary-divider" />
        {build ? (
          <>
            <dl className="summary-list">
              <SummaryLine label="Sample total" value={formatCurrency(build.totalPrice)} />
              <SummaryLine label="Estimated draw" value={`${build.estimatedPower}W`} />
              <SummaryLine label={build.budgetRemaining >= 0 ? 'Budget remaining' : 'Over budget'} value={formatCurrency(Math.abs(build.budgetRemaining))} />
              <SummaryLine label="Parts selected" value={`${build.parts.length} components`} />
            </dl>
            <div className="confidence">
              <ShieldCheck size={16} />
              <div><strong>Local planning mode</strong><p>Sample catalog values only. Confirm live prices and compatibility before purchase.</p></div>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
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