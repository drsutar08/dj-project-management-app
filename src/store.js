import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS, SEED } from './defaults';
import { n, uid } from './utils';

const KEY = 'regal-music-manager.v1';
const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, setState] = useState(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const d = JSON.parse(raw);
          setState({
            settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) },
            employees: d.employees || [],
            ledger: d.ledger || [],
            projects: d.projects || [],
            items: d.items || [],
            moves: d.moves || [],
            expenses: d.expenses || [],
          });
          return;
        }
      } catch (e) {}
      setState({ settings: { ...DEFAULT_SETTINGS }, items: [], moves: [], expenses: [], ...SEED });
    })();
  }, []);

  // Save shortly after every change.
  useEffect(() => {
    if (!state) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
    }, 250);
  }, [state]);

  const api = useMemo(() => {
    const upsert = (key) => (item) => {
      const id = item.id || uid();
      setState((s) => {
        const list = s[key].filter((x) => x.id !== id);
        return { ...s, [key]: [...list, { ts: Date.now(), ...item, id }] };
      });
      return id;
    };
    const remove = (key) => (id) => setState((s) => ({ ...s, [key]: s[key].filter((x) => x.id !== id) }));
    const patch = (key) => (id, changes) =>
      setState((s) => ({ ...s, [key]: s[key].map((x) => (x.id === id ? { ...x, ...changes } : x)) }));
    return {
      saveEmployee: upsert('employees'),
      deleteEmployee: remove('employees'),
      saveEntry: upsert('ledger'),
      deleteEntry: remove('ledger'),
      saveProject: upsert('projects'),
      patchProject: patch('projects'),
      deleteProject: remove('projects'),
      saveExpense: upsert('expenses'),
      deleteExpense: remove('expenses'),
      saveItem: upsert('items'),
      deleteItem: (id) =>
        setState((s) => ({
          ...s,
          items: s.items.filter((x) => x.id !== id),
          moves: s.moves.filter((m) => m.itemId !== id),
          projects: s.projects.map((p) => (p.gear ? { ...p, gear: p.gear.filter((g) => g.itemId !== id) } : p)),
        })),
      // Record a stock movement and update the item's counts in one step.
      addMove: (mv) =>
        setState((s) => {
          const move = { ts: Date.now(), ...mv, id: uid() };
          return { ...s, moves: [...s.moves, move], items: s.items.map((it) => (it.id === mv.itemId ? applyMove(it, move, 1) : it)) };
        }),
      // Delete a movement and undo its effect on the item.
      deleteMove: (id) =>
        setState((s) => {
          const move = s.moves.find((m) => m.id === id);
          if (!move) return s;
          return { ...s, moves: s.moves.filter((m) => m.id !== id), items: s.items.map((it) => (it.id === move.itemId ? applyMove(it, move, -1) : it)) };
        }),
      saveSettings: (settings) => setState((s) => ({ ...s, settings: { ...s.settings, ...settings } })),
      exportData: () => JSON.stringify(state),
      importData: (json) => {
        const d = JSON.parse(json);
        if (!d || !Array.isArray(d.projects) || !Array.isArray(d.employees) || !Array.isArray(d.ledger))
          throw new Error('This is not a backup from this app.');
        setState({
          settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) },
          employees: d.employees,
          ledger: d.ledger,
          projects: d.projects,
          items: d.items || [],
          moves: d.moves || [],
          expenses: d.expenses || [],
        });
      },
    };
  }, [state]);

  if (!state) return null;
  return <Ctx.Provider value={{ ...state, ...api }}>{children}</Ctx.Provider>;
}

export function useStore() {
  return useContext(Ctx);
}

// in: bought / added · out: used up, sold, lost · repair: sent for repair · fixed: back from repair
// adjust: stock count corrected (qty is the difference, can be negative).
function applyMove(it, m, sign) {
  const q = n(m.qty) * sign;
  const qty = n(it.qty), repair = n(it.repair);
  switch (m.type) {
    case 'in': case 'adjust': return { ...it, qty: qty + q };
    case 'out': return { ...it, qty: qty - q };
    case 'repair': return { ...it, repair: Math.max(0, repair + q) };
    case 'fixed': return { ...it, repair: Math.max(0, repair - q) };
    default: return it;
  }
}

// Sorted views used by several screens.
export function useSorted() {
  const s = useStore();
  return useMemo(
    () => ({
      employees: [...s.employees].sort((a, b) => String(a.name).localeCompare(String(b.name))),
      ledger: [...s.ledger].sort(
        (a, b) => String(b.date).localeCompare(String(a.date)) || (b.ts || 0) - (a.ts || 0)
      ),
      projects: [...s.projects].sort((a, b) => String(a.bookingDate).localeCompare(String(b.bookingDate))),
      items: [...s.items].sort((a, b) => String(a.category).localeCompare(String(b.category)) || String(a.name).localeCompare(String(b.name))),
      moves: [...s.moves].sort((a, b) => String(b.date).localeCompare(String(a.date)) || (b.ts || 0) - (a.ts || 0)),
      expenses: [...s.expenses].sort((a, b) => String(b.date).localeCompare(String(a.date)) || (b.ts || 0) - (a.ts || 0)),
    }),
    [s.employees, s.ledger, s.projects, s.items, s.moves, s.expenses]
  );
}
