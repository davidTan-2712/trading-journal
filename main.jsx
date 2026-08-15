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
    setJNote(existing?.
