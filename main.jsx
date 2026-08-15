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
