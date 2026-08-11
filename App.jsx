import React, { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  BookOpen,
  Flame,
  Anchor,
  Plus,
  X,
  Check,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  CalendarDays,
  Trophy,
  Skull,
  ScrollText,
  PenLine,
  History,
  Save,
  RotateCcw,
} from "lucide-react";

const C = {
  void: "#0F1119",
  panel: "#171B27",
  panelAlt: "#1E2432",
  ink: "#EDE7D9",
  inkDim: "#B7B3A6",
  inkMuted: "#787C8C",
  gold: "#C6A15B",
  goldDim: "#7A6438",
  goldSoft: "rgba(198,161,91,0.14)",
  sage: "#7FA98C",
  sageSoft: "rgba(127,169,140,0.14)",
  rose: "#B5675A",
  roseSoft: "rgba(181,103,90,0.14)",
  hair: "#2A2E3D",
};

const FONT_DISPLAY = "'Spectral', serif";
const FONT_MONO = "'IBM Plex Mono', monospace";
const FONT_BODY = "'Inter', sans-serif";

const CHECKLIST = [
  { id: "bible", label: "Đọc 1 chương Kinh Thánh", group: "Kỷ luật" },
  { id: "session", label: "Chờ đúng phiên giao dịch", group: "Kỷ luật" },
  { id: "pause", label: "Pause 60 giây trước lệnh", group: "Kỷ luật" },
  { id: "nofomo", label: "Không FOMO đuổi giá", group: "Kỷ luật" },
  { id: "plan", label: "Trade theo đúng kế hoạch", group: "Kỷ luật" },
  { id: "hours", label: "Vào lệnh đúng khung giờ", group: "Kỷ luật" },
  { id: "amd", label: "Xác nhận AMD", group: "Setup" },
  { id: "cisd", label: "Xác nhận CISD", group: "Setup" },
  { id: "htfpda", label: "HTF PDA hợp lệ", group: "Setup" },
  { id: "ifvg", label: "IFVG hợp lệ", group: "Setup" },
  { id: "rr", label: "RR tối thiểu 1:2", group: "Rủi ro" },
  { id: "risk", label: "Đúng risk mỗi lệnh", group: "Rủi ro" },
];

const GOAL_DEFAULT = 10000;
const STORAGE_KEY = "journal-entries-v1";
const GOAL_KEY = "journal-goal-v1";
const JOURNEYS_KEY = "journal-archive-v1";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function fmtUSD(n) {
  const sign = n < 0 ? "-" : "";
  return sign + "$" + Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtDateVN(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function addDays(iso, delta) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

function pnlColor(v) {
  const n = Number(v);
  if (!n) return C.inkMuted;
  return n > 0 ? C.sage : C.rose;
}

function seedEntries() {
  return [
    {
      date: todayISO(),
      pnl: 600,
      note: "",
      bible: "",
      checklist: CHECKLIST.reduce((acc, c) => ({ ...acc, [c.id]: c.id === "bible" }), {}),
    },
  ];
}

export default function JournalDashboard() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [goal, setGoal] = useState(GOAL_DEFAULT);
  const [chartMode, setChartMode] = useState("cumulative");
  const [formOpen, setFormOpen] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [view, setView] = useState("overview");
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalTab, setJournalTab] = useState("write");
  const [jDate, setJDate] = useState(todayISO());
  const [jBible, setJBible] = useState("");
  const [jNote, setJNote] = useState("");
  const [journeys, setJourneys] = useState([]);
  const [journeysOpen, setJourneysOpen] = useState(false);
  const [saveJourneyMode, setSaveJourneyMode] = useState(false);
  const [newJourneyName, setNewJourneyName] = useState("");
  const [newJourneyGoal, setNewJourneyGoal] = useState(String(GOAL_DEFAULT));
  const [viewDate, setViewDate] = useState(todayISO());

  const [fDate, setFDate] = useState(todayISO());
  const [fPnl, setFPnl] = useState("");
  const [fNote, setFNote] = useState("");
  const [fChecklist, setFChecklist] = useState(
    CHECKLIST.reduce((acc, c) => ({ ...acc, [c.id]: false }), {})
  );

  useEffect(() => {
    (async () => {
      try {
        let loadedEntries = null;
        let loadedGoal = null;
        try {
          const r = await window.storage.get(STORAGE_KEY, false);
          if (r && r.value) loadedEntries = JSON.parse(r.value);
        } catch (e) {}
        try {
          const g = await window.storage.get(GOAL_KEY, false);
          if (g && g.value) loadedGoal = JSON.parse(g.value);
        } catch (e) {}
        let loadedJourneys = [];
        try {
          const j = await window.storage.get(JOURNEYS_KEY, false);
          if (j && j.value) loadedJourneys = JSON.parse(j.value);
        } catch (e) {}
        setJourneys(loadedJourneys);

        if (loadedEntries && loadedEntries.length) {
          setEntries(loadedEntries);
        } else {
          const seed = seedEntries();
          setEntries(seed);
          try {
            await window.storage.set(STORAGE_KEY, JSON.stringify(seed), false);
          } catch (e) {}
        }
        if (loadedGoal) setGoal(loadedGoal);
      } catch (e) {
        setEntries(seedEntries());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function persist(nextEntries) {
    setEntries(nextEntries);
    try {
      const res = await window.storage.set(STORAGE_KEY, JSON.stringify(nextEntries), false);
      if (!res) setSaveError(true);
      else setSaveError(false);
    } catch (e) {
      setSaveError(true);
    }
  }

  async function persistJourneys(next) {
    setJourneys(next);
    try {
      await window.storage.set(JOURNEYS_KEY, JSON.stringify(next), false);
    } catch (e) {}
  }

  async function setGoalPersisted(g) {
    setGoal(g);
    try {
      await window.storage.set(GOAL_KEY, JSON.stringify(g), false);
    } catch (e) {}
  }

  async function saveCurrentAndStartNew() {
    const name = newJourneyName.trim() || `Hành trình ${journeys.length + 1}`;
    const archived = {
      id: String(Date.now()),
      name,
      goal,
      entries: sorted,
      savedAt: todayISO(),
    };
    const nextJourneys = [...journeys, archived];
    await persistJourneys(nextJourneys);
    await persist([]);
    await setGoalPersisted(Number(newJourneyGoal) || GOAL_DEFAULT);
    setNewJourneyName("");
    setNewJourneyGoal(String(GOAL_DEFAULT));
    setSaveJourneyMode(false);
    setJourneysOpen(false);
  }

  async function restoreJourney(j) {
    const withoutRestored = journeys.filter((x) => x.id !== j.id);
    let nextJourneys = withoutRestored;
    if (sorted.length) {
      nextJourneys = [
        ...withoutRestored,
        { id: String(Date.now()), name: `(Tự động lưu) ${fmtDateVN(todayISO())}`, goal, entries: sorted, savedAt: todayISO() },
      ];
    }
    await persistJourneys(nextJourneys);
    await persist(j.entries);
    await setGoalPersisted(j.goal);
    setJourneysOpen(false);
  }

  const sorted = useMemo(
    () => [...entries].sort((a, b) => (a.date < b.date ? -1 : 1)),
    [entries]
  );

  const totalPnL = useMemo(() => sorted.reduce((s, e) => s + Number(e.pnl || 0), 0), [sorted]);
  const winCount = sorted.filter((e) => Number(e.pnl) > 0).length;
  const lossCount = sorted.filter((e) => Number(e.pnl) < 0).length;
  const beCount = sorted.filter((e) => Number(e.pnl) === 0).length;

  const checklistScore = (e) => {
    const vals = CHECKLIST.map((c) => !!e.checklist?.[c.id]);
    return vals.filter(Boolean).length / CHECKLIST.length;
  };

  const streak = useMemo(() => {
    let s = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (checklistScore(sorted[i]) === 1) s++;
      else break;
    }
    return s;
  }, [sorted]);

  const chartData = useMemo(() => {
    let running = 0;
    return sorted.map((e, i) => {
      running += Number(e.pnl || 0);
      return {
        label: fmtDateVN(e.date).slice(0, 5),
        pnl: Number(e.pnl || 0),
        cumulative: running,
        day: i + 1,
      };
    });
  }, [sorted]);

  const progress = Math.max(0, Math.min(1, totalPnL / goal));
  const entryMap = useMemo(() => Object.fromEntries(sorted.map((e) => [e.date, e])), [sorted]);
  const startDate = sorted.length ? sorted[0].date : viewDate;
  const dayNumber = Math.max(
    1,
    Math.round((new Date(viewDate + "T00:00:00") - new Date(startDate + "T00:00:00")) / 86400000) + 1
  );
  const viewEntry = entryMap[viewDate];
  const bestDay = sorted.length ? sorted.reduce((a, b) => (Number(b.pnl) > Number(a.pnl) ? b : a)) : null;
  const worstDay = sorted.length ? sorted.reduce((a, b) => (Number(b.pnl) < Number(a.pnl) ? b : a)) : null;
  const avgPnl = sorted.length ? totalPnL / sorted.length : 0;

  function toggleFChecklist(id) {
    setFChecklist((p) => ({ ...p, [id]: !p[id] }));
  }

  function openFormForDate(dateStr) {
    const existing = entryMap[dateStr];
    setFDate(dateStr);
    if (existing) {
      setFPnl(String(existing.pnl));
      setFNote(existing.note || "");
      setFChecklist({ ...existing.checklist });
    } else {
      setFPnl("");
      setFNote("");
      setFChecklist(CHECKLIST.reduce((acc, c) => ({ ...acc, [c.id]: false }), {}));
    }
    setFormOpen(true);
  }

  function openJournal(dateStr) {
    const d = dateStr || todayISO();
    const existing = entryMap[d];
    setJDate(d);
    setJBible(existing?.bible || "");
    setJNote(existing?.note || "");
    setJournalTab("write");
    setJournalOpen(true);
  }

  async function saveJournal() {
    const existing = entryMap[jDate];
    const base = existing
      ? { ...existing }
      : {
          date: jDate,
          pnl: 0,
          checklist: CHECKLIST.reduce((acc, c) => ({ ...acc, [c.id]: false }), {}),
        };
    base.bible = jBible;
    base.note = jNote;
    if (jBible.trim()) base.checklist = { ...base.checklist, bible: true };
    const next = sorted.filter((e) => e.date !== jDate);
    next.push(base);
    await persist(next);
    setJournalTab("read");
  }

  const journalEntries = useMemo(
    () =>
      [...sorted]
        .filter((e) => (e.note && e.note.trim()) || (e.bible && e.bible.trim()))
        .reverse(),
    [sorted]
  );

  async function saveEntry() {
    const existing = entryMap[fDate];
    const next = sorted.filter((e) => e.date !== fDate);
    next.push({
      date: fDate,
      pnl: Number(fPnl || 0),
      note: fNote,
      bible: existing?.bible || "",
      checklist: { ...fChecklist },
    });
    await persist(next);
    setFormOpen(false);
  }

  if (loading) {
    return (
      <div
        style={{ background: C.void, minHeight: "100vh", color: C.inkMuted, fontFamily: FONT_BODY }}
        className="flex items-center justify-center"
      >
        <div className="animate-pulse text-sm tracking-widest uppercase">Đang mở nhật ký…</div>
      </div>
    );
  }

  return (
    <div style={{ background: C.void, minHeight: "100vh", fontFamily: FONT_BODY, color: C.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,500;0,600;0,700;1,500&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');
        ::selection { background: ${C.goldSoft}; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.7); }
      `}</style>

      <div className="max-w-2xl md:max-w-5xl mx-auto px-5 md:px-8 pt-8 pb-24">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div
              style={{ color: C.gold, letterSpacing: "0.25em", fontFamily: FONT_MONO }}
              className="text-xs uppercase mb-2"
            >
              Nhật Ký 365 Ngày
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewDate((d) => addDays(d, -1))}
                style={{ background: C.panelAlt, borderColor: C.hair }}
                className="p-1.5 rounded-full border shrink-0"
              >
                <ChevronLeft size={16} color={C.inkMuted} />
              </button>
              <div style={{ fontFamily: FONT_DISPLAY }} className="text-4xl font-semibold leading-none">
                Ngày {String(dayNumber).padStart(3, "0")}
              </div>
              <button
                onClick={() => setViewDate((d) => addDays(d, 1))}
                style={{ background: C.panelAlt, borderColor: C.hair }}
                className="p-1.5 rounded-full border shrink-0"
              >
                <ChevronRight size={16} color={C.inkMuted} />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span style={{ color: C.inkMuted, fontFamily: FONT_MONO }} className="text-sm">
                / 365 · {fmtDateVN(viewDate)}
              </span>
              {viewDate !== todayISO() && (
                <button
                  onClick={() => setViewDate(todayISO())}
                  style={{ color: C.gold, fontFamily: FONT_MONO }}
                  className="text-xs underline"
                >
                  hôm nay
                </button>
              )}
              {viewEntry && (
                <span
                  style={{
                    color: pnlColor(viewEntry.pnl),
                    background: C.panelAlt,
                    fontFamily: FONT_MONO,
                  }}
                  className="text-xs px-2 py-0.5 rounded-full"
                >
                  {viewEntry.pnl > 0 ? "+" : ""}
                  {fmtUSD(viewEntry.pnl)}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => openJournal(viewDate)}
              style={{ background: C.gold, color: C.void, fontFamily: FONT_MONO }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold"
            >
              <PenLine size={14} /> Nhật ký
            </button>
            <div
              style={{ background: C.panelAlt, borderColor: C.hair }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
            >
              <Flame size={14} color={streak > 0 ? C.gold : C.inkMuted} />
              <span style={{ fontFamily: FONT_MONO }} className="text-sm">
                {streak}
              </span>
            </div>
          </div>
        </div>

        {/* View switcher */}
        <div
          style={{ background: C.panelAlt, borderColor: C.hair }}
          className="flex rounded-full border p-1 mb-6 w-fit"
        >
          <button
            onClick={() => setView("overview")}
            style={{
              background: view === "overview" ? C.goldSoft : "transparent",
              color: view === "overview" ? C.gold : C.inkMuted,
              fontFamily: FONT_MONO,
            }}
            className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-full"
          >
            <LayoutGrid size={13} /> Tổng quan
          </button>
          <button
            onClick={() => setView("calendar")}
            style={{
              background: view === "calendar" ? C.goldSoft : "transparent",
              color: view === "calendar" ? C.gold : C.inkMuted,
              fontFamily: FONT_MONO,
            }}
            className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-full"
          >
            <CalendarDays size={13} /> Lịch
          </button>
        </div>

        {view === "calendar" && (
          <CalendarView
            year={calMonth.y}
            month={calMonth.m}
            entryMap={entryMap}
            todayStr={todayISO()}
            onPrev={() =>
              setCalMonth((p) => (p.m === 0 ? { y: p.y - 1, m: 11 } : { y: p.y, m: p.m - 1 }))
            }
            onNext={() =>
              setCalMonth((p) => (p.m === 11 ? { y: p.y + 1, m: 0 } : { y: p.y, m: p.m + 1 }))
            }
            onToday={() => {
              const d = new Date();
              setCalMonth({ y: d.getFullYear(), m: d.getMonth() });
            }}
            onSelectDay={openFormForDate}
          />
        )}

        {view === "overview" && (
        <>
        <div className="md:grid md:grid-cols-[360px_1fr] md:gap-5 md:items-start">
        <div>
        {/* Voyage progress to goal */}
        <div
          style={{ background: C.panel, borderColor: C.hair }}
          className="rounded-2xl border p-5 mb-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Anchor size={16} color={C.gold} />
              <span style={{ fontFamily: FONT_DISPLAY }} className="text-lg">
                Hành trình đến {fmtUSD(goal)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSaveJourneyMode(false);
                  setJourneysOpen(true);
                }}
                style={{ background: C.panelAlt, borderColor: C.hair }}
                className="p-1.5 rounded-full border"
              >
                <History size={14} color={C.inkMuted} />
              </button>
              <span style={{ color: C.gold, fontFamily: FONT_MONO }} className="text-sm">
                {Math.round(progress * 100)}%
              </span>
            </div>
          </div>

          <div className="relative pt-2 pb-6">
            <div
              style={{ background: C.hair, height: 2 }}
              className="w-full rounded-full relative"
            >
              <div
                style={{
                  width: `${progress * 100}%`,
                  background: `linear-gradient(90deg, ${C.goldDim}, ${C.gold})`,
                  height: 2,
                }}
                className="rounded-full absolute left-0 top-0"
              />
              {[0.2, 0.4, 0.6, 0.8].map((t) => (
                <div
                  key={t}
                  style={{
                    left: `${t * 100}%`,
                    background: t <= progress ? C.gold : C.inkMuted,
                    top: -3,
                    width: 2,
                    height: 8,
                  }}
                  className="absolute rounded-full"
                />
              ))}
              <div
                style={{
                  left: `calc(${progress * 100}% - 7px)`,
                  top: -6,
                  width: 14,
                  height: 14,
                  background: C.void,
                  border: `2px solid ${C.gold}`,
                }}
                className="absolute rounded-full"
              />
            </div>
            <div
              style={{
                position: "absolute",
                left: `calc(${Math.min(progress, 0.92) * 100}% - 8px)`,
                top: 16,
                color: C.gold,
                fontFamily: FONT_MONO,
              }}
              className="text-xs whitespace-nowrap"
            >
              {fmtUSD(totalPnL)}
            </div>
          </div>

          <div className="flex justify-between text-xs" style={{ color: C.inkMuted, fontFamily: FONT_MONO }}>
            <span>$0</span>
            <span>còn {fmtUSD(Math.max(0, goal - totalPnL))}</span>
            <span>{fmtUSD(goal)}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatCard label="Thắng" value={winCount} icon={<TrendingUp size={14} color={C.sage} />} color={C.sage} />
          <StatCard label="Thua" value={lossCount} icon={<TrendingDown size={14} color={C.rose} />} color={C.rose} />
          <StatCard label="Hoà" value={beCount} icon={<Minus size={14} color={C.inkMuted} />} color={C.inkMuted} />
        </div>

        {sorted.length > 0 && (
          <div style={{ background: C.panel, borderColor: C.hair }} className="rounded-2xl border p-5 mb-5">
            <span style={{ fontFamily: FONT_DISPLAY }} className="text-lg block mb-3">
              Kỷ lục
            </span>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5" style={{ color: C.inkMuted, fontFamily: FONT_MONO }}>
                  <Trophy size={13} color={C.sage} /> Ngày tốt nhất
                </div>
                <span style={{ color: pnlColor(bestDay?.pnl), fontFamily: FONT_MONO }} className="text-sm">
                  {bestDay ? `${bestDay.pnl > 0 ? "+" : ""}${fmtUSD(bestDay.pnl)} · ${fmtDateVN(bestDay.date)}` : "—"}
                </span>
              </div>
              {sorted.length > 1 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5" style={{ color: C.inkMuted, fontFamily: FONT_MONO }}>
                    <Skull size={13} color={C.rose} /> Ngày tệ nhất
                  </div>
                  <span style={{ color: pnlColor(worstDay?.pnl), fontFamily: FONT_MONO }} className="text-sm">
                    {worstDay ? `${worstDay.pnl > 0 ? "+" : ""}${fmtUSD(worstDay.pnl)} · ${fmtDateVN(worstDay.date)}` : "—"}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div style={{ color: C.inkMuted, fontFamily: FONT_MONO }}>Trung bình / ngày</div>
                <span style={{ color: pnlColor(avgPnl), fontFamily: FONT_MONO }} className="text-sm">
                  {avgPnl > 0 ? "+" : ""}
                  {fmtUSD(Math.round(avgPnl))}
                </span>
              </div>
            </div>
          </div>
        )}
        </div>

        <div>
        {/* Chart */}
        <div style={{ background: C.panel, borderColor: C.hair }} className="rounded-2xl border p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontFamily: FONT_DISPLAY }} className="text-lg">
              PnL
            </span>
            <div style={{ background: C.panelAlt, borderColor: C.hair }} className="flex rounded-full border p-0.5">
              <button
                onClick={() => setChartMode("cumulative")}
                style={{
                  background: chartMode === "cumulative" ? C.goldSoft : "transparent",
                  color: chartMode === "cumulative" ? C.gold : C.inkMuted,
                  fontFamily: FONT_MONO,
                }}
                className="px-3 py-1 rounded-full text-xs"
              >
                Lũy kế
              </button>
              <button
                onClick={() => setChartMode("daily")}
                style={{
                  background: chartMode === "daily" ? C.goldSoft : "transparent",
                  color: chartMode === "daily" ? C.gold : C.inkMuted,
                  fontFamily: FONT_MONO,
                }}
                className="px-3 py-1 rounded-full text-xs"
              >
                Theo ngày
              </button>
            </div>
          </div>

          {chartData.length === 0 ? (
            <div style={{ color: C.inkMuted }} className="text-sm py-8 text-center">
              Chưa có dữ liệu. Ghi lại ngày đầu tiên bên dưới.
            </div>
          ) : (
            <div style={{ width: "100%", height: 200 }}>
              <ResponsiveContainer>
                {chartMode === "cumulative" ? (
                  <LineChart data={chartData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={C.hair} vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: C.inkMuted, fontSize: 10 }} axisLine={{ stroke: C.hair }} tickLine={false} />
                    <YAxis tick={{ fill: C.inkMuted, fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                    <ReferenceLine y={goal} stroke={C.gold} strokeDasharray="4 4" />
                    <Tooltip
                      contentStyle={{ background: C.panelAlt, border: `1px solid ${C.hair}`, borderRadius: 8, fontFamily: FONT_MONO, fontSize: 12 }}
                      labelStyle={{ color: C.inkMuted }}
                      formatter={(v) => [fmtUSD(v), "Lũy kế"]}
                    />
                    <Line type="monotone" dataKey="cumulative" stroke={C.gold} strokeWidth={2} dot={{ r: 3, fill: C.gold }} />
                  </LineChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={C.hair} vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: C.inkMuted, fontSize: 10 }} axisLine={{ stroke: C.hair }} tickLine={false} />
                    <YAxis tick={{ fill: C.inkMuted, fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                      contentStyle={{ background: C.panelAlt, border: `1px solid ${C.hair}`, borderRadius: 8, fontFamily: FONT_MONO, fontSize: 12 }}
                      labelStyle={{ color: C.inkMuted }}
                      formatter={(v) => [fmtUSD(v), "PnL"]}
                    />
                    <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                      {chartData.map((d, i) => (
                        <Cell key={i} fill={d.pnl >= 0 ? C.sage : C.rose} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Log entries */}
        <div style={{ background: C.panel, borderColor: C.hair }} className="rounded-2xl border p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontFamily: FONT_DISPLAY }} className="text-lg">
              Nhật ký gần đây
            </span>
            <button
              onClick={() => openFormForDate(viewDate)}
              style={{ background: C.goldSoft, color: C.gold, fontFamily: FONT_MONO }}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full"
            >
              <Plus size={14} /> Ghi ngày mới
            </button>
          </div>

          {sorted.length === 0 && (
            <div style={{ color: C.inkMuted }} className="text-sm text-center py-6">
              Trang đầu tiên còn trống.
            </div>
          )}

          <div className="flex flex-col gap-2">
            {[...sorted].reverse().slice(0, 8).map((e, idx) => {
              const score = checklistScore(e);
              return (
                <div
                  key={e.date}
                  style={{ borderColor: C.hair }}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <div style={{ fontFamily: FONT_MONO }} className="text-sm">
                      {fmtDateVN(e.date)}
                    </div>
                    <div style={{ color: C.inkMuted }} className="text-xs">
                      checklist {Math.round(score * 100)}%
                    </div>
                  </div>
                  <div
                    style={{
                      color: e.pnl > 0 ? C.sage : e.pnl < 0 ? C.rose : C.inkMuted,
                      fontFamily: FONT_MONO,
                    }}
                    className="text-sm font-medium"
                  >
                    {e.pnl > 0 ? "+" : ""}
                    {fmtUSD(e.pnl)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>
        </div>

        {saveError && (
          <div style={{ color: C.rose }} className="text-xs text-center mb-4">
            Không lưu được — dữ liệu chỉ tồn tại trong phiên này.
          </div>
        )}
        </>
        )}
      </div>

      {/* Entry form sheet */}
      {formOpen && (
        <div
          style={{ background: "rgba(15,17,25,0.85)" }}
          className="fixed inset-0 flex items-end justify-center z-50"
          onClick={() => setFormOpen(false)}
        >
          <div
            style={{ background: C.panel, borderColor: C.hair, maxHeight: "88vh" }}
            className="w-full max-w-2xl rounded-t-3xl border-t border-l border-r overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 pb-3" style={{ borderBottom: `1px solid ${C.hair}` }}>
              <span style={{ fontFamily: FONT_DISPLAY }} className="text-xl">
                Ghi lại một ngày
              </span>
              <button onClick={() => setFormOpen(false)}>
                <X size={20} color={C.inkMuted} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div>
                <label style={{ color: C.inkMuted, fontFamily: FONT_MONO }} className="text-xs uppercase block mb-1">
                  Ngày
                </label>
                <input
                  type="date"
                  value={fDate}
                  onChange={(ev) => setFDate(ev.target.value)}
                  style={{ background: C.panelAlt, borderColor: C.hair, color: C.ink, fontFamily: FONT_MONO }}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label style={{ color: C.inkMuted, fontFamily: FONT_MONO }} className="text-xs uppercase block mb-1">
                  PnL ($) — âm nếu lỗ
                </label>
                <input
                  type="number"
                  value={fPnl}
                  onChange={(ev) => setFPnl(ev.target.value)}
                  placeholder="0"
                  style={{ background: C.panelAlt, borderColor: C.hair, color: C.ink, fontFamily: FONT_MONO }}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label style={{ color: C.inkMuted, fontFamily: FONT_MONO }} className="text-xs uppercase block mb-2">
                  Checklist
                </label>
                <div className="flex flex-col gap-3">
                  {["Kỷ luật", "Setup", "Rủi ro"].map((group) => (
                    <div key={group}>
                      <div style={{ color: C.gold, fontFamily: FONT_MONO }} className="text-xs mb-1.5">
                        {group}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {CHECKLIST.filter((c) => c.group === group).map((c) => (
                          <button
                            key={c.id}
                            onClick={() => toggleFChecklist(c.id)}
                            style={{ background: C.panelAlt, borderColor: C.hair }}
                            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-left"
                          >
                            <div
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: 5,
                                border: `1.5px solid ${fChecklist[c.id] ? C.sage : C.inkMuted}`,
                                background: fChecklist[c.id] ? C.sageSoft : "transparent",
                              }}
                              className="flex items-center justify-center shrink-0"
                            >
                              {fChecklist[c.id] && <Check size={12} color={C.sage} />}
                            </div>
                            <span style={{ color: C.ink }} className="text-sm">
                              {c.id === "bible" && <BookOpen size={12} className="inline mr-1" color={C.gold} />}
                              {c.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ color: C.inkMuted, fontFamily: FONT_MONO }} className="text-xs flex items-center gap-1.5">
                <PenLine size={12} color={C.gold} /> Ghi cảm nhận & chương Kinh Thánh trong nút "Nhật ký" nhé.
              </div>

              <button
                onClick={saveEntry}
                style={{ background: C.gold, color: C.void, fontFamily: FONT_MONO }}
                className="w-full rounded-full py-3 text-sm font-semibold mt-1"
              >
                Lưu ngày này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Journal sheet */}
      {journalOpen && (
        <div
          style={{ background: "rgba(15,17,25,0.85)" }}
          className="fixed inset-0 flex items-end justify-center z-50"
          onClick={() => setJournalOpen(false)}
        >
          <div
            style={{ background: C.panel, borderColor: C.hair, maxHeight: "88vh" }}
            className="w-full max-w-2xl rounded-t-3xl border-t border-l border-r overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 pb-3" style={{ borderBottom: `1px solid ${C.hair}` }}>
              <span style={{ fontFamily: FONT_DISPLAY }} className="text-xl">
                Nhật ký
              </span>
              <button onClick={() => setJournalOpen(false)}>
                <X size={20} color={C.inkMuted} />
              </button>
            </div>

            <div className="px-5 pt-4">
              <div style={{ background: C.panelAlt, borderColor: C.hair }} className="flex rounded-full border p-1 w-fit">
                <button
                  onClick={() => setJournalTab("write")}
                  style={{
                    background: journalTab === "write" ? C.goldSoft : "transparent",
                    color: journalTab === "write" ? C.gold : C.inkMuted,
                    fontFamily: FONT_MONO,
                  }}
                  className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-full"
                >
                  <PenLine size={13} /> Viết
                </button>
                <button
                  onClick={() => setJournalTab("read")}
                  style={{
                    background: journalTab === "read" ? C.goldSoft : "transparent",
                    color: journalTab === "read" ? C.gold : C.inkMuted,
                    fontFamily: FONT_MONO,
                  }}
                  className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-full"
                >
                  <ScrollText size={13} /> Đọc lại
                </button>
              </div>
            </div>

            {journalTab === "write" ? (
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <label style={{ color: C.inkMuted, fontFamily: FONT_MONO }} className="text-xs uppercase block mb-1">
                    Ngày
                  </label>
                  <input
                    type="date"
                    value={jDate}
                    onChange={(ev) => setJDate(ev.target.value)}
                    style={{ background: C.panelAlt, borderColor: C.hair, color: C.ink, fontFamily: FONT_MONO }}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label style={{ color: C.inkMuted, fontFamily: FONT_MONO }} className="text-xs uppercase block mb-1 flex items-center gap-1.5">
                    <BookOpen size={12} color={C.gold} /> Chương Kinh Thánh hôm nay
                  </label>
                  <input
                    type="text"
                    value={jBible}
                    onChange={(ev) => setJBible(ev.target.value)}
                    placeholder="VD: Giăng 10–12"
                    style={{ background: C.panelAlt, borderColor: C.hair, color: C.ink, fontFamily: FONT_MONO }}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label style={{ color: C.inkMuted, fontFamily: FONT_MONO }} className="text-xs uppercase block mb-1">
                    Nhật ký hôm nay
                  </label>
                  <textarea
                    value={jNote}
                    onChange={(ev) => setJNote(ev.target.value)}
                    rows={6}
                    style={{ background: C.panelAlt, borderColor: C.hair, color: C.ink }}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="Hôm nay bạn học được gì, cảm thấy thế nào…"
                  />
                </div>

                <button
                  onClick={saveJournal}
                  style={{ background: C.gold, color: C.void, fontFamily: FONT_MONO }}
                  className="w-full rounded-full py-3 text-sm font-semibold mt-1"
                >
                  Lưu vào nhật ký
                </button>
              </div>
            ) : (
              <div className="p-5 flex flex-col gap-3">
                {journalEntries.length === 0 ? (
                  <div style={{ color: C.inkMuted }} className="text-sm text-center py-8">
                    Chưa có trang nhật ký nào. Viết trang đầu tiên nhé.
                  </div>
                ) : (
                  journalEntries.map((e) => (
                    <button
                      key={e.date}
                      onClick={() => {
                        setJDate(e.date);
                        setJBible(e.bible || "");
                        setJNote(e.note || "");
                        setJournalTab("write");
                      }}
                      style={{ background: C.panelAlt, borderColor: C.hair }}
                      className="rounded-xl border p-4 text-left"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span style={{ fontFamily: FONT_MONO, color: C.gold }} className="text-xs">
                          {fmtDateVN(e.date)}
                        </span>
                        {e.bible && (
                          <span
                            style={{ background: C.goldSoft, color: C.gold, fontFamily: FONT_MONO }}
                            className="text-xs px-2 py-0.5 rounded-full"
                          >
                            {e.bible}
                          </span>
                        )}
                      </div>
                      {e.note && (
                        <p style={{ color: C.inkDim }} className="text-sm line-clamp-3">
                          {e.note}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Journeys sheet */}
      {journeysOpen && (
        <div
          style={{ background: "rgba(15,17,25,0.85)" }}
          className="fixed inset-0 flex items-end justify-center z-50"
          onClick={() => setJourneysOpen(false)}
        >
          <div
            style={{ background: C.panel, borderColor: C.hair, maxHeight: "88vh" }}
            className="w-full max-w-2xl rounded-t-3xl border-t border-l border-r overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 pb-3" style={{ borderBottom: `1px solid ${C.hair}` }}>
              <span style={{ fontFamily: FONT_DISPLAY }} className="text-xl">
                Hành trình
              </span>
              <button onClick={() => setJourneysOpen(false)}>
                <X size={20} color={C.inkMuted} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-5">
              {!saveJourneyMode ? (
                <button
                  onClick={() => setSaveJourneyMode(true)}
                  style={{ background: C.goldSoft, color: C.gold, borderColor: C.hair, fontFamily: FONT_MONO }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border py-3 text-sm"
                >
                  <Save size={15} /> Lưu hành trình hiện tại & bắt đầu hành trình mới
                </button>
              ) : (
                <div style={{ background: C.panelAlt, borderColor: C.hair }} className="rounded-xl border p-4 flex flex-col gap-3">
                  <div style={{ color: C.inkMuted, fontFamily: FONT_MONO }} className="text-xs">
                    Hành trình hiện tại: {sorted.length} ngày · {fmtUSD(totalPnL)} / {fmtUSD(goal)}
                  </div>
                  <div>
                    <label style={{ color: C.inkMuted, fontFamily: FONT_MONO }} className="text-xs uppercase block mb-1">
                      Tên hành trình (VD: Tài khoản Topstep 50k)
                    </label>
                    <input
                      type="text"
                      value={newJourneyName}
                      onChange={(ev) => setNewJourneyName(ev.target.value)}
                      placeholder="Hành trình của tôi"
                      style={{ background: C.panel, borderColor: C.hair, color: C.ink, fontFamily: FONT_MONO }}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label style={{ color: C.inkMuted, fontFamily: FONT_MONO }} className="text-xs uppercase block mb-1">
                      Mục tiêu hành trình mới ($)
                    </label>
                    <input
                      type="number"
                      value={newJourneyGoal}
                      onChange={(ev) => setNewJourneyGoal(ev.target.value)}
                      style={{ background: C.panel, borderColor: C.hair, color: C.ink, fontFamily: FONT_MONO }}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSaveJourneyMode(false)}
                      style={{ background: C.panel, color: C.inkMuted, borderColor: C.hair, fontFamily: FONT_MONO }}
                      className="flex-1 rounded-full border py-2.5 text-sm"
                    >
                      Huỷ
                    </button>
                    <button
                      onClick={saveCurrentAndStartNew}
                      style={{ background: C.gold, color: C.void, fontFamily: FONT_MONO }}
                      className="flex-1 rounded-full py-2.5 text-sm font-semibold"
                    >
                      Lưu & bắt đầu mới
                    </button>
                  </div>
                </div>
              )}

              <div>
                <span style={{ fontFamily: FONT_DISPLAY }} className="text-lg block mb-3">
                  Đã lưu
                </span>
                {journeys.length === 0 ? (
                  <div style={{ color: C.inkMuted }} className="text-sm text-center py-4">
                    Chưa có hành trình nào được lưu.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {[...journeys].reverse().map((j) => {
                      const jTotal = j.entries.reduce((s, e) => s + Number(e.pnl || 0), 0);
                      return (
                        <div
                          key={j.id}
                          style={{ background: C.panelAlt, borderColor: C.hair }}
                          className="rounded-xl border p-4 flex items-center justify-between gap-3"
                        >
                          <div>
                            <div style={{ fontFamily: FONT_MONO }} className="text-sm">
                              {j.name}
                            </div>
                            <div style={{ color: C.inkMuted, fontFamily: FONT_MONO }} className="text-xs mt-0.5">
                              {j.entries.length} ngày · {fmtUSD(jTotal)} / {fmtUSD(j.goal)} · lưu {fmtDateVN(j.savedAt)}
                            </div>
                          </div>
                          <button
                            onClick={() => restoreJourney(j)}
                            style={{ background: C.goldSoft, color: C.gold, fontFamily: FONT_MONO }}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full shrink-0"
                          >
                            <RotateCcw size={12} /> Khôi phục
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const WEEKDAYS_VN = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS_VN = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

function CalendarView({ year, month, entryMap, todayStr, onPrev, onNext, onToday, onSelectDay }) {
  const startOffset = new Date(year, month, 1).getDay();
  const numDays = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= numDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const wins = Object.values(entryMap).filter(
    (e) => e.date.slice(0, 4) == year && Number(e.date.slice(5, 7)) - 1 === month && Number(e.pnl) > 0
  ).length;
  const losses = Object.values(entryMap).filter(
    (e) => e.date.slice(0, 4) == year && Number(e.date.slice(5, 7)) - 1 === month && Number(e.pnl) < 0
  ).length;

  return (
    <div style={{ background: C.panel, borderColor: C.hair }} className="rounded-2xl border p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <span style={{ fontFamily: FONT_DISPLAY }} className="text-lg">
          {MONTHS_VN[month]} {year}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrev}
            style={{ background: C.panelAlt, borderColor: C.hair }}
            className="p-1.5 rounded-full border"
          >
            <ChevronLeft size={14} color={C.inkMuted} />
          </button>
          <button
            onClick={onToday}
            style={{ background: C.panelAlt, color: C.gold, borderColor: C.hair, fontFamily: FONT_MONO }}
            className="text-xs px-3 py-1.5 rounded-full border"
          >
            Hôm nay
          </button>
          <button
            onClick={onNext}
            style={{ background: C.panelAlt, borderColor: C.hair }}
            className="p-1.5 rounded-full border"
          >
            <ChevronRight size={14} color={C.inkMuted} />
          </button>
        </div>
      </div>

      <div style={{ color: C.inkMuted, fontFamily: FONT_MONO }} className="text-xs mb-3">
        {wins} thắng · {losses} thua trong tháng
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {WEEKDAYS_VN.map((w) => (
          <div key={w} style={{ color: C.inkMuted, fontFamily: FONT_MONO }} className="text-center text-[10px]">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const e = entryMap[dateStr];
          const isToday = dateStr === todayStr;
          let bg = "transparent";
          let border = C.hair;
          let dotColor = null;
          if (e) {
            if (Number(e.pnl) > 0) {
              bg = C.sageSoft;
              border = "transparent";
              dotColor = C.sage;
            } else if (Number(e.pnl) < 0) {
              bg = C.roseSoft;
              border = "transparent";
              dotColor = C.rose;
            } else {
              bg = C.panelAlt;
              dotColor = C.inkMuted;
            }
          }
          return (
            <button
              key={i}
              onClick={() => onSelectDay(dateStr)}
              style={{
                background: bg,
                borderColor: isToday ? C.gold : border,
                borderWidth: isToday ? 1.5 : 1,
                borderStyle: "solid",
                color: C.inkDim,
                fontFamily: FONT_MONO,
              }}
              className="aspect-square rounded-lg flex flex-col items-center justify-center text-xs gap-0.5"
            >
              <span>{d}</span>
              {dotColor && (
                <span style={{ width: 4, height: 4, borderRadius: 999, background: dotColor }} />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: C.inkMuted, fontFamily: FONT_MONO }}>
        <div className="flex items-center gap-1.5">
          <span style={{ width: 8, height: 8, borderRadius: 999, background: C.sage }} /> Thắng
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ width: 8, height: 8, borderRadius: 999, background: C.rose }} /> Thua
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ width: 8, height: 8, border: `1.5px solid ${C.gold}`, borderRadius: 4 }} /> Hôm nay
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ background: C.panel, borderColor: C.hair }} className="rounded-2xl border p-4 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <span style={{ color: "#787C8C", fontFamily: FONT_MONO }} className="text-xs">
          {label}
        </span>
      </div>
      <div style={{ color, fontFamily: FONT_MONO }} className="text-2xl font-semibold">
        {value}
      </div>
    </div>
  );
}
