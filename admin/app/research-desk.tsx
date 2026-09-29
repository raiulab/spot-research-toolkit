"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Candidate = {
  id: string;
  record_id: string;
  name_ja: string;
  name_en: string | null;
  spot_kind: string;
  workflow_status: string;
  confidence: string;
  primary_source_count: number;
  issue_count: number;
  payload_json: string;
  review_notes: string;
  updated_at: string;
};

type Job = {
  id: string;
  region: string;
  categories_json: string;
  target_count: number;
  model: string;
  reasoning_effort: string;
  status: string;
  error_message: string | null;
  created_at: string;
};

type Schedule = {
  id: string;
  region: string;
  categories_json: string;
  target_count: number;
  cadence: string;
  time_jst: string;
  next_run_at: string;
};

type Overview = {
  totals: {
    total: number;
    draft: number;
    verified: number;
    primary_backed: number;
  };
  kinds: Array<{ spot_kind: string; count: number }>;
  jobs: Job[];
  schedules: Schedule[];
};

const categoryOptions = [
  { value: "restaurant", label: "レストラン" },
  { value: "cafe", label: "カフェ・喫茶" },
  { value: "shop", label: "個人商店" },
  { value: "gallery", label: "ギャラリー" },
  { value: "bar", label: "バー" },
];

const kindLabel: Record<string, string> = {
  restaurant: "食事処",
  cafe: "カフェ",
  shop: "商店",
  gallery: "ギャラリー",
  bar: "バー",
};

const statusLabel: Record<string, string> = {
  draft: "要確認",
  verified: "確認済み",
  running: "調査中",
  queued: "待機中",
  completed: "完了",
  failed: "失敗",
  waiting_for_key: "API設定待ち",
  in_progress: "調査中",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const contentType = response.headers.get("content-type") ?? "";
  const value = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  if (!response.ok) {
    const message =
      typeof value === "object" && value && "error" in value
        ? String((value as { error: unknown }).error)
        : String(value);
    throw new Error(message);
  }
  return value as T;
}

export function ResearchDesk({ displayName }: { displayName: string }) {
  const [tab, setTab] = useState<"review" | "research" | "schedule">("review");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (kindFilter !== "all") params.set("kind", kindFilter);
    if (query) params.set("q", query);
    const [overviewData, candidateData] = await Promise.all([
      requestJson<Overview>("/api/overview"),
      requestJson<{ candidates: Candidate[] }>(
        `/api/candidates?${params.toString()}`,
      ),
    ]);
    setOverview(overviewData);
    setCandidates(candidateData.candidates);
    setSelectedId((current) =>
      current && candidateData.candidates.some((item) => item.id === current)
        ? current
        : (candidateData.candidates[0]?.id ?? null),
    );
  }, [kindFilter, query, statusFilter]);

  useEffect(() => {
    // Data loading is the effect's external synchronization boundary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().catch((error) => setMessage(error.message));
  }, [load]);

  const selected = useMemo(
    () => candidates.find((candidate) => candidate.id === selectedId) ?? null,
    [candidates, selectedId],
  );

  async function runAction(action: () => Promise<void>, success: string) {
    setBusy(true);
    setMessage("");
    try {
      await action();
      setMessage(success);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "処理に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            S
          </div>
          <div>
            <strong>Spot Research</strong>
            <span>Research Desk</span>
          </div>
        </div>

        <nav aria-label="メインナビゲーション">
          <button
            className={tab === "review" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("review")}
          >
            <span>01</span>
            候補確認
            <b>{overview?.totals.draft ?? "—"}</b>
          </button>
          <button
            className={tab === "research" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("research")}
          >
            <span>02</span>
            調査開始
          </button>
          <button
            className={tab === "schedule" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("schedule")}
          >
            <span>03</span>
            定期調査・出力
          </button>
        </nav>

        <div className="sidebar-note">
          <span className="pulse" />
          <p>Evidence first</p>
          <small>事実・推論・推薦を分け、一次情報が足りない候補はdraftに保ちます。</small>
        </div>

        <div className="editor">
          <span>{displayName.slice(0, 1).toUpperCase()}</span>
          <div>
            <small>EDITOR</small>
            <strong>{displayName}</strong>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">EVIDENCE · FIELD RESEARCH</p>
            <h1>
              {tab === "review"
                ? "候補を確かめる"
                : tab === "research"
                  ? "新しい地域の日常を探す"
                  : "繰り返し調べ、確かな形で渡す"}
            </h1>
            <p className="subtitle">
              {tab === "review"
                ? "Verify candidates / 証拠と不足項目を見ながら承認します"
                : tab === "research"
                  ? "Start research / 地域・カテゴリー・件数から調査ジョブを作成します"
                  : "Schedule & export / 毎週・毎月の条件とデータ出力を管理します"}
            </p>
          </div>
          <div className="top-status">
            <span className="status-dot" />
            Schema 1.2
          </div>
        </header>

        {message && (
          <div className="notice" role="status">
            {message}
            <button onClick={() => setMessage("")} aria-label="閉じる">
              ×
            </button>
          </div>
        )}

        {tab === "review" && (
          <ReviewPanel
            overview={overview}
            candidates={candidates}
            selected={selected}
            selectedId={selectedId}
            statusFilter={statusFilter}
            kindFilter={kindFilter}
            query={query}
            busy={busy}
            setSelectedId={setSelectedId}
            setStatusFilter={setStatusFilter}
            setKindFilter={setKindFilter}
            setQuery={setQuery}
            runAction={runAction}
          />
        )}
        {tab === "research" && (
          <ResearchPanel
            jobs={overview?.jobs ?? []}
            busy={busy}
            runAction={runAction}
          />
        )}
        {tab === "schedule" && (
          <SchedulePanel
            schedules={overview?.schedules ?? []}
            busy={busy}
            runAction={runAction}
          />
        )}
      </section>
    </main>
  );
}

function ReviewPanel(props: {
  overview: Overview | null;
  candidates: Candidate[];
  selected: Candidate | null;
  selectedId: string | null;
  statusFilter: string;
  kindFilter: string;
  query: string;
  busy: boolean;
  setSelectedId: (value: string) => void;
  setStatusFilter: (value: string) => void;
  setKindFilter: (value: string) => void;
  setQuery: (value: string) => void;
  runAction: (action: () => Promise<void>, success: string) => Promise<void>;
}) {
  const {
    overview,
    candidates,
    selected,
    selectedId,
    statusFilter,
    kindFilter,
    query,
    busy,
    setSelectedId,
    setStatusFilter,
    setKindFilter,
    setQuery,
    runAction,
  } = props;
  return (
    <>
      <section className="metrics" aria-label="候補集計">
        <Metric
          number={overview?.totals.total ?? "—"}
          label="店舗候補"
          english="Storefronts"
          tone="ink"
        />
        <Metric
          number={overview?.totals.draft ?? "—"}
          label="要確認"
          english="Draft"
          tone="amber"
        />
        <Metric
          number={overview?.totals.verified ?? "—"}
          label="確認済み"
          english="Verified"
          tone="green"
        />
        <Metric
          number={overview?.totals.primary_backed ?? "—"}
          label="一次情報あり"
          english="Primary source"
          tone="blue"
        />
      </section>

      <section className="review-layout">
        <div className="candidate-panel">
          <div className="filter-row">
            <label className="search">
              <span>⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="店名・IDを検索"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="状態"
            >
              <option value="all">すべての状態</option>
              <option value="draft">要確認</option>
              <option value="verified">確認済み</option>
            </select>
            <select
              value={kindFilter}
              onChange={(event) => setKindFilter(event.target.value)}
              aria-label="種類"
            >
              <option value="all">すべての種類</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="list-heading">
            <strong>{candidates.length} candidates</strong>
            <span>確認が必要な順</span>
          </div>
          <div className="candidate-list">
            {candidates.map((candidate) => (
              <button
                key={candidate.id}
                className={
                  candidate.id === selectedId
                    ? "candidate-card selected"
                    : "candidate-card"
                }
                onClick={() => setSelectedId(candidate.id)}
              >
                <div className="candidate-index">
                  {candidate.spot_kind === "restaurant"
                    ? "食"
                    : candidate.spot_kind === "cafe"
                      ? "喫"
                      : candidate.spot_kind === "gallery"
                        ? "藝"
                        : "店"}
                </div>
                <div className="candidate-copy">
                  <div>
                    <strong>{candidate.name_ja}</strong>
                    <span className={`badge ${candidate.workflow_status}`}>
                      {statusLabel[candidate.workflow_status] ??
                        candidate.workflow_status}
                    </span>
                  </div>
                  <small>{candidate.name_en || "English name pending"}</small>
                  <p>
                    {kindLabel[candidate.spot_kind] ?? candidate.spot_kind}
                    <i>·</i> 一次情報 {candidate.primary_source_count}
                    <i>·</i> 確認事項 {candidate.issue_count}
                  </p>
                </div>
                <span className="chevron">›</span>
              </button>
            ))}
          </div>
        </div>

        {selected ? (
          <CandidateDetail
            key={`${selected.id}-${selected.updated_at}`}
            candidate={selected}
            busy={busy}
            runAction={runAction}
          />
        ) : (
          <div className="detail-panel empty-state">
            <span>候補なし</span>
            <p>No candidate matches the current filters.</p>
          </div>
        )}
      </section>
    </>
  );
}

function CandidateDetail({
  candidate,
  busy,
  runAction,
}: {
  candidate: Candidate;
  busy: boolean;
  runAction: (action: () => Promise<void>, success: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState(candidate.review_notes);
  const [json, setJson] = useState(() =>
    JSON.stringify(JSON.parse(candidate.payload_json), null, 2),
  );
  const record = JSON.parse(candidate.payload_json) as {
    summary?: { ja?: string; en?: string };
    location?: { address?: { ja?: string } };
    official?: { website?: string };
    google_maps?: {
      url?: string | null;
      search_url?: string;
      link_status?: string;
    };
    review_insights?: {
      status?: string;
      observed_at?: string | null;
      sampled_review_count?: number | null;
      summary?: { ja?: string; en?: string | null } | null;
      positive_themes?: Array<{ ja?: string; en?: string | null }>;
      caution_themes?: Array<{ ja?: string; en?: string | null }>;
      caveats?: Array<{ ja?: string; en?: string | null }>;
    };
    practical?: { opening_hours?: { raw_text?: { ja?: string } } };
    verification?: { issues?: string[] };
    business?: {
      venue_type?: string;
      reservation_policy?: string;
      service_modes?: string[];
      takeaway?: boolean | null;
      local_context?: { ja?: string };
    };
    sources?: Array<{
      source_id?: string;
      title?: string;
      url?: string;
      trust_level?: string;
      evidence_note?: string;
    }>;
  };

  async function save() {
    await requestJson(`/api/candidates/${candidate.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewNotes: notes, payloadJson: json }),
    });
  }

  async function approve() {
    const result = await fetch(`/api/candidates/${candidate.id}/approve`, {
      method: "POST",
    });
    const value = (await result.json()) as {
      error?: string;
      problems?: string[];
    };
    if (!result.ok) {
      throw new Error(
        [value.error, ...(value.problems ?? [])].filter(Boolean).join(" / "),
      );
    }
  }

  return (
    <article className="detail-panel">
      <div className="detail-head">
        <div>
          <p className="eyebrow">
            {candidate.record_id} · {candidate.confidence.toUpperCase()}
          </p>
          <h2>{candidate.name_ja}</h2>
          <p>{candidate.name_en}</p>
        </div>
        <span className={`large-status ${candidate.workflow_status}`}>
          {statusLabel[candidate.workflow_status] ?? candidate.workflow_status}
        </span>
      </div>

      <div className="fact-grid">
        <Fact label="住所 / Address" value={record.location?.address?.ja} />
        <Fact
          label="営業時間 / Hours"
          value={record.practical?.opening_hours?.raw_text?.ja}
        />
        <Fact
          label="店舗形式 / Venue"
          value={record.business?.venue_type}
        />
        <Fact
          label="予約 / Reservation"
          value={record.business?.reservation_policy}
        />
      </div>

      <div className="summary-block">
        <span>WHY IT BELONGS</span>
        <p>{record.summary?.ja}</p>
        <small>{record.summary?.en}</small>
      </div>

      <div className="evidence-block">
        <div className="section-title">
          <h3>Google Maps・口コミ傾向</h3>
          <span>Maps & reviews</span>
        </div>
        <div className="source-list">
          {(record.google_maps?.url || record.google_maps?.search_url) && (
            <a
              href={record.google_maps.url ?? record.google_maps.search_url}
              target="_blank"
              rel="noreferrer"
            >
              <span className="source-mark secondary">↗</span>
              <div>
                <strong>Google Mapsを開く</strong>
                <small>
                  {record.google_maps.link_status === "entity-confirmed"
                    ? "確認済みの店舗ページ"
                    : "店名と住所による検索リンク"}
                </small>
              </div>
              <b>{record.google_maps.link_status ?? "unknown"}</b>
            </a>
          )}
        </div>
        {record.review_insights?.status === "collected" ? (
          <>
            <p className="clear-evidence">
              {record.review_insights.summary?.ja}
            </p>
            <small>
              確認日 {record.review_insights.observed_at ?? "—"} ·
              対象 {record.review_insights.sampled_review_count ?? "—"}件
            </small>
            {(record.review_insights.positive_themes ?? []).length > 0 && (
              <ul className="issue-list">
                {record.review_insights.positive_themes?.map((theme, index) => (
                  <li key={`positive-${index}`}>良い傾向: {theme.ja}</li>
                ))}
              </ul>
            )}
            {(record.review_insights.caution_themes ?? []).length > 0 && (
              <ul className="issue-list">
                {record.review_insights.caution_themes?.map((theme, index) => (
                  <li key={`caution-${index}`}>注意傾向: {theme.ja}</li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="muted">
            口コミ傾向は未収集です。本文や投稿者名は保存しません。
          </p>
        )}
      </div>

      <div className="evidence-block">
        <div className="section-title">
          <h3>根拠と確認事項</h3>
          <span>Evidence</span>
        </div>
        {(record.verification?.issues ?? []).length > 0 ? (
          <ul className="issue-list">
            {record.verification?.issues?.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        ) : (
          <p className="clear-evidence">未解決の確認事項はありません。</p>
        )}
        <div className="source-list">
          {record.sources?.map((source) => (
            <a
              key={source.source_id}
              href={source.url}
              target="_blank"
              rel="noreferrer"
            >
              <span className={`source-mark ${source.trust_level}`}>↗</span>
              <div>
                <strong>{source.title}</strong>
                <small>{source.evidence_note}</small>
              </div>
              <b>{source.trust_level}</b>
            </a>
          ))}
        </div>
      </div>

      <details className="json-editor">
        <summary>JSONを確認・修正 / Inspect JSON</summary>
        <textarea
          spellCheck={false}
          value={json}
          onChange={(event) => setJson(event.target.value)}
          aria-label="候補JSON"
        />
      </details>

      <label className="notes-field">
        <span>審査メモ / Review notes</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="再確認したい点、承認理由、差し戻し内容…"
        />
      </label>

      <div className="detail-actions">
        <button
          className="secondary-button"
          disabled={busy}
          onClick={() => runAction(save, "候補の修正と審査メモを保存しました。")}
        >
          修正を保存
        </button>
        <button
          className="primary-button"
          disabled={busy || candidate.workflow_status === "verified"}
          onClick={() =>
            runAction(approve, "承認条件を確認し、verifiedへ更新しました。")
          }
        >
          {candidate.workflow_status === "verified"
            ? "確認済み"
            : "証拠を確認して承認"}
          <span>→</span>
        </button>
      </div>
    </article>
  );
}

function ResearchPanel({
  jobs,
  busy,
  runAction,
}: {
  jobs: Job[];
  busy: boolean;
  runAction: (action: () => Promise<void>, success: string) => Promise<void>;
}) {
  const [region, setRegion] = useState("京都市東山区");
  const [categories, setCategories] = useState([
    "restaurant",
    "cafe",
    "shop",
    "gallery",
  ]);
  const [count, setCount] = useState(20);
  const toggle = (value: string) =>
    setCategories((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );

  return (
    <div className="two-column">
      <section className="form-card feature-card">
        <p className="eyebrow">NEW RESEARCH JOB</p>
        <h2>調査条件</h2>
        <p className="form-lead">
          候補はすべてdraftで入ります。GPT-5.6 Solが一次情報を優先してWeb調査し、人の確認を待ちます。
        </p>
        <label>
          <span>地域 / Region</span>
          <input value={region} onChange={(event) => setRegion(event.target.value)} />
        </label>
        <fieldset>
          <legend>カテゴリー / Categories</legend>
          <div className="choice-grid">
            {categoryOptions.map((option) => (
              <label
                className={
                  categories.includes(option.value)
                    ? "choice selected"
                    : "choice"
                }
                key={option.value}
              >
                <input
                  type="checkbox"
                  checked={categories.includes(option.value)}
                  onChange={() => toggle(option.value)}
                />
                <span>{option.label}</span>
                <small>{option.value}</small>
              </label>
            ))}
          </div>
        </fieldset>
        <label>
          <span>目標件数 / Target</span>
          <div className="range-row">
            <input
              type="range"
              min="1"
              max="30"
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
            />
            <b>{count}</b>
          </div>
        </label>
        <div className="model-strip">
          <div>
            <small>MODEL</small>
            <strong>GPT-5.6 Sol</strong>
          </div>
          <div>
            <small>REASONING</small>
            <strong>High</strong>
          </div>
          <div>
            <small>TOOLS</small>
            <strong>Web search</strong>
          </div>
        </div>
        <button
          className="launch-button"
          disabled={busy || categories.length === 0}
          onClick={() =>
            runAction(
              async () => {
                await requestJson("/api/jobs", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    region,
                    categories,
                    targetCount: count,
                  }),
                });
              },
              "調査ジョブを作成しました。APIキー設定済みの場合はバックグラウンドで開始します。",
            )
          }
        >
          <span>調査開始</span>
          <b>START RESEARCH →</b>
        </button>
      </section>

      <section className="activity-card">
        <div className="section-title">
          <h2>調査履歴</h2>
          <span>Recent jobs</span>
        </div>
        <div className="timeline">
          {jobs.length === 0 && <p className="muted">まだ調査ジョブはありません。</p>}
          {jobs.map((job) => (
            <div className="job-row" key={job.id}>
              <span className={`job-state ${job.status}`} />
              <div>
                <strong>{job.region}</strong>
                <p>
                  {(JSON.parse(job.categories_json) as string[]).join(" · ")}
                </p>
                <small>
                  {job.target_count}件 · {job.model} / {job.reasoning_effort} ·{" "}
                  {formatDate(job.created_at)}
                </small>
                {job.error_message && <em>{job.error_message}</em>}
              </div>
              <div className="job-actions">
                <b>{statusLabel[job.status] ?? job.status}</b>
                {["running", "in_progress", "queued"].includes(job.status) && (
                  <button
                    onClick={() =>
                      runAction(
                        async () => {
                          await requestJson(`/api/jobs/${job.id}/sync`, {
                            method: "POST",
                          });
                        },
                        "調査ジョブの状態を同期しました。",
                      )
                    }
                  >
                    同期
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SchedulePanel({
  schedules,
  busy,
  runAction,
}: {
  schedules: Schedule[];
  busy: boolean;
  runAction: (action: () => Promise<void>, success: string) => Promise<void>;
}) {
  const [cadence, setCadence] = useState<"weekly" | "monthly">("weekly");
  const [region, setRegion] = useState("京都市東山区");
  const [categories, setCategories] = useState([
    "restaurant",
    "cafe",
    "shop",
    "gallery",
  ]);
  const [count, setCount] = useState(20);
  const [weekday, setWeekday] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [time, setTime] = useState("09:00");
  const toggle = (value: string) =>
    setCategories((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );

  async function download(format: "canonical" | "compact") {
    const response = await fetch("/api/exports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format,
        includeDrafts: false,
        region: region.trim() || undefined,
      }),
    });
    if (!response.ok) throw new Error(await response.text());
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      format === "compact"
        ? "spot-research-compact.json"
        : "spot-research-canonical.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="schedule-grid">
      <section className="form-card">
        <p className="eyebrow">RECURRING RESEARCH</p>
        <h2>定期調査を追加</h2>
        <div className="segmented">
          <button
            className={cadence === "weekly" ? "active" : ""}
            onClick={() => setCadence("weekly")}
          >
            毎週 <small>Weekly</small>
          </button>
          <button
            className={cadence === "monthly" ? "active" : ""}
            onClick={() => setCadence("monthly")}
          >
            毎月 <small>Monthly</small>
          </button>
        </div>
        <label>
          <span>地域</span>
          <input value={region} onChange={(event) => setRegion(event.target.value)} />
        </label>
        <fieldset>
          <legend>カテゴリー</legend>
          <div className="choice-grid compact">
            {categoryOptions.map((option) => (
              <label
                className={
                  categories.includes(option.value)
                    ? "choice selected"
                    : "choice"
                }
                key={option.value}
              >
                <input
                  type="checkbox"
                  checked={categories.includes(option.value)}
                  onChange={() => toggle(option.value)}
                />
                <span>{option.label}</span>
                <small>{option.value}</small>
              </label>
            ))}
          </div>
        </fieldset>
        <label>
          <span>目標件数（1〜30件）</span>
          <input
            type="number"
            min="1"
            max="30"
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
          />
        </label>
        {cadence === "weekly" ? (
          <label>
            <span>曜日</span>
            <select
              value={weekday}
              onChange={(event) => setWeekday(Number(event.target.value))}
            >
              <option value="1">月曜日</option>
              <option value="2">火曜日</option>
              <option value="3">水曜日</option>
              <option value="4">木曜日</option>
              <option value="5">金曜日</option>
            </select>
          </label>
        ) : (
          <label>
            <span>毎月の日付（1〜28日）</span>
            <input
              type="number"
              min="1"
              max="28"
              value={dayOfMonth}
              onChange={(event) => setDayOfMonth(Number(event.target.value))}
            />
          </label>
        )}
        <label>
          <span>実行時刻（日本時間）</span>
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
          />
        </label>
        <button
          className="primary-button full"
          disabled={busy || !region.trim() || categories.length === 0}
          onClick={() =>
            runAction(
              async () => {
                await requestJson("/api/schedules", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    region,
                    categories,
                    targetCount: count,
                    cadence,
                    weekday,
                    dayOfMonth,
                    timeJst: time,
                  }),
                });
              },
              "定期調査を保存しました。",
            )
          }
        >
          定期設定を保存 <span>→</span>
        </button>
      </section>

      <section className="activity-card">
        <div className="section-title">
          <h2>次回の調査</h2>
          <span>Schedule queue</span>
        </div>
        <div className="schedule-list">
          {schedules.length === 0 && (
            <p className="muted">定期設定はまだありません。</p>
          )}
          {schedules.map((schedule) => (
            <div key={schedule.id}>
              <span>{schedule.cadence === "weekly" ? "W" : "M"}</span>
              <div>
                <strong>{schedule.region}</strong>
                <small>
                  {schedule.target_count}件 · {schedule.time_jst} JST
                </small>
              </div>
              <time>{formatDate(schedule.next_run_at)}</time>
            </div>
          ))}
        </div>
        <button
          className="secondary-button full"
          disabled={busy}
          onClick={() =>
            runAction(
              async () => {
                const result = await requestJson<{ processed: number }>(
                  "/api/schedules/run-due",
                  { method: "POST" },
                );
                if (result.processed === 0) {
                  throw new Error("現在、実行時刻を過ぎた定期設定はありません。");
                }
              },
              "実行時刻を過ぎた定期調査をジョブ化しました。",
            )
          }
        >
          今すぐ期限チェック
        </button>
      </section>

      <section className="export-card">
        <div>
          <p className="eyebrow">APPROVED DATA ONLY</p>
          <h2>承認済みデータを出力</h2>
          <p>
            draftを除外し、確認済み店舗だけを標準JSONまたは軽量JSONで書き出します。
          </p>
        </div>
        <div className="export-actions">
          <button
            disabled={busy}
            onClick={() =>
              runAction(
                () => download("canonical"),
                "標準JSONを出力しました。",
              )
            }
          >
            <span>JSON</span>
            <div>
              <strong>標準データ</strong>
              <small>Canonical 1.1</small>
            </div>
            <b>↓</b>
          </button>
          <button
            disabled={busy}
            onClick={() =>
              runAction(
                () => download("compact"),
                "軽量JSONを出力しました。",
              )
            }
          >
            <span>Lite</span>
            <div>
              <strong>軽量データ</strong>
              <small>Compact venues</small>
            </div>
            <b>↓</b>
          </button>
        </div>
      </section>
    </div>
  );
}

function Metric({
  number,
  label,
  english,
  tone,
}: {
  number: number | string;
  label: string;
  english: string;
  tone: string;
}) {
  return (
    <div className={`metric ${tone}`}>
      <span>{english}</span>
      <strong>{number}</strong>
      <p>{label}</p>
    </div>
  );
}

function Fact({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="fact">
      <span>{label}</span>
      <strong>{value || "未確認 / Not confirmed"}</strong>
    </div>
  );
}
