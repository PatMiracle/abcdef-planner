import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  addDays,
  dayKey,
  emptyWeek,
  nextSort,
  uid,
  weekKey,
  type Goal,
  type Letter,
  type Task,
  type WeekPlan,
} from "@/lib/planner/model";

type Data = {
  tasks: Task[];
  goals: Goal[];
  weeks: Record<string, WeekPlan>;
  bootstrapped: boolean;
  sample: boolean;
  sampleWeek: string | null;
  focusId: string | null;
  focusStartedAt: number | null;
};

type Store = Data & {
  hydrated: boolean;
  addTask: (day: string, title: string, letter: Letter | null, fileOn?: string) => void;
  setLetter: (id: string, letter: Exclude<Letter, "F">) => void;
  fileTask: (id: string, day: string) => void;
  completeTask: (id: string) => void;
  reopenTask: (id: string) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  removeTask: (id: string) => void;
  moveTask: (id: string, dir: -1 | 1) => void;
  bringForward: (toDay: string) => void;
  setFocus: (id: string | null) => void;
  saveGoal: (goal: Goal) => void;
  removeGoal: (id: string) => void;
  setThree: (day: string, index: 0 | 1 | 2, text: string) => void;
  toggleTime: (day: string, timeId: string) => void;
  clearSample: () => void;
  resetAll: () => void;
};

function blankTask(partial: Pick<Task, "title" | "day" | "letter"> & Partial<Task>): Task {
  return {
    id: uid(),
    sort: 10,
    status: "open",
    delegateTo: "",
    note: "",
    goalId: null,
    carried: false,
    origin: null,
    createdAt: Date.now(),
    doneAt: null,
    ...partial,
  };
}

export function createSeed(): Data {
  const today = dayKey();
  const tomorrow = addDays(today, 1);
  const week = weekKey(today);
  const purposeId = uid();

  const proposal = blankTask({
    title: "Finish the client proposal",
    day: today,
    letter: "A",
    sort: 10,
    goalId: purposeId,
    sample: true,
  });
  const bank = blankTask({
    title: "Call the bank about the transfer",
    day: today,
    letter: "A",
    sort: 20,
    sample: true,
  });
  const vendor = blankTask({
    title: "Reply to the vendor",
    day: today,
    letter: "B",
    sort: 10,
    sample: true,
  });
  const dentist = blankTask({
    title: "Book the dentist",
    day: today,
    letter: "B",
    sort: 20,
    sample: true,
  });
  const bookmarks = blankTask({
    title: "Reorganize bookmarks",
    day: today,
    letter: "C",
    sort: 10,
    sample: true,
  });
  const handouts = blankTask({
    title: "Print the workshop handouts",
    day: today,
    letter: "D",
    sort: 10,
    status: "delegated",
    delegateTo: "Sam",
    sample: true,
  });
  const files = blankTask({
    title: "Color-code last year's files",
    day: today,
    letter: "E",
    sort: 10,
    status: "eliminated",
    doneAt: Date.now(),
    sample: true,
  });
  const card = blankTask({
    title: "Buy a birthday card",
    day: today,
    letter: null,
    sort: 10,
    sample: true,
  });
  const newsletter = blankTask({
    title: "Outline the October newsletter",
    day: tomorrow,
    letter: null,
    sort: 10,
    origin: "filed",
    sample: true,
  });

  return {
    tasks: [proposal, bank, vendor, dentist, bookmarks, handouts, files, card, newsletter],
    goals: [
      {
        id: purposeId,
        title: "Build a consulting practice I can run four days a week",
        deadline: "",
        definite: true,
        sample: true,
      },
      {
        id: uid(),
        title: "Be home for dinner four nights this week",
        deadline: "",
        definite: false,
        sample: true,
      },
    ],
    weeks: {
      [week]: {
        three: ["Send the proposal", "One hour on the offer", "Dinner with no phone"],
        protectedTimes: ["people", "quiet"],
      },
    },
    bootstrapped: true,
    sample: true,
    sampleWeek: week,
    focusId: null,
    focusStartedAt: null,
  };
}

const emptyData = (): Data => ({
  tasks: [],
  goals: [],
  weeks: {},
  bootstrapped: true,
  sample: false,
  sampleWeek: null,
  focusId: null,
  focusStartedAt: null,
});

function weekOf(weeks: Record<string, WeekPlan>, day: string): { key: string; plan: WeekPlan } {
  const key = weekKey(day);
  return { key, plan: weeks[key] ?? emptyWeek() };
}

export const usePlanner = create<Store>()(
  persist(
    (set) => ({
      ...emptyData(),
      bootstrapped: false,
      hydrated: false,
      addTask: (day, title, letter, fileOn) =>
        set((state) => {
          const trimmed = title.trim();
          if (!trimmed) return state;
          if (letter === "F") {
            const target = fileOn && fileOn > day ? fileOn : addDays(day, 1);
            const task = blankTask({
              title: trimmed,
              day: target,
              letter: null,
              sort: nextSort(state.tasks, target, null),
              origin: "filed",
            });
            return { tasks: [...state.tasks, task] };
          }
          if (letter === "E") {
            const task = blankTask({
              title: trimmed,
              day,
              letter,
              sort: nextSort(state.tasks, day, letter),
              status: "eliminated",
              doneAt: Date.now(),
            });
            return { tasks: [...state.tasks, task] };
          }
          if (letter === "D") {
            const task = blankTask({
              title: trimmed,
              day,
              letter,
              sort: nextSort(state.tasks, day, letter),
              status: "delegated",
            });
            return { tasks: [...state.tasks, task] };
          }
          const task = blankTask({
            title: trimmed,
            day,
            letter,
            sort: nextSort(state.tasks, day, letter),
          });
          return { tasks: [...state.tasks, task] };
        }),
      setLetter: (id, letter) =>
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== id) return t;
            const sort = nextSort(
              state.tasks.filter((other) => other.id !== id),
              t.day,
              letter,
            );
            if (letter === "E") {
              return { ...t, letter, sort, status: "eliminated", doneAt: Date.now() };
            }
            if (letter === "D") {
              return { ...t, letter, sort, status: "delegated", doneAt: null };
            }
            return { ...t, letter, sort, status: "open", doneAt: null };
          }),
        })),
      fileTask: (id, day) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  day,
                  letter: null,
                  status: "open",
                  origin: "filed",
                  carried: false,
                  doneAt: null,
                  sort: nextSort(
                    state.tasks.filter((other) => other.id !== id),
                    day,
                    null,
                  ),
                }
              : t,
          ),
        })),
      completeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status: "done", doneAt: Date.now() } : t,
          ),
          focusId: state.focusId === id ? null : state.focusId,
          focusStartedAt: state.focusId === id ? null : state.focusStartedAt,
        })),
      reopenTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status: "open", letter: t.letter === "E" ? null : t.letter, doneAt: null } : t,
          ),
        })),
      updateTask: (id, patch) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patch, id: t.id } : t)),
        })),
      removeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          focusId: state.focusId === id ? null : state.focusId,
          focusStartedAt: state.focusId === id ? null : state.focusStartedAt,
        })),
      moveTask: (id, dir) =>
        set((state) => {
          const task = state.tasks.find((t) => t.id === id);
          if (!task || !task.letter) return state;
          const peers = state.tasks
            .filter(
              (t) =>
                t.day === task.day &&
                t.letter === task.letter &&
                t.status !== "eliminated",
            )
            .sort((a, b) => a.sort - b.sort);
          const index = peers.findIndex((t) => t.id === id);
          const swap = peers[index + dir];
          if (!swap) return state;
          return {
            tasks: state.tasks.map((t) => {
              if (t.id === task.id) return { ...t, sort: swap.sort };
              if (t.id === swap.id) return { ...t, sort: task.sort };
              return t;
            }),
          };
        }),
      bringForward: (toDay) =>
        set((state) => {
          let tasks = state.tasks;
          const moving = tasks.filter(
            (t) => t.day < toDay && t.status === "open" && t.letter !== "D" && t.letter !== "E",
          );
          for (const task of moving) {
            const sort = nextSort(
              tasks.filter((t) => t.id !== task.id),
              toDay,
              task.letter,
            );
            tasks = tasks.map((t) =>
              t.id === task.id ? { ...t, day: toDay, carried: true, sort } : t,
            );
          }
          return { tasks };
        }),
      setFocus: (id) =>
        set(() => ({
          focusId: id,
          focusStartedAt: id ? Date.now() : null,
        })),
      saveGoal: (goal) =>
        set((state) => {
          const goals = state.goals.some((g) => g.id === goal.id)
            ? state.goals.map((g) => (g.id === goal.id ? goal : g))
            : [...state.goals, goal];
          const next = goal.definite
            ? goals.map((g) => (g.id === goal.id ? g : { ...g, definite: false }))
            : goals;
          return { goals: next };
        }),
      removeGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
          tasks: state.tasks.map((t) => (t.goalId === id ? { ...t, goalId: null } : t)),
        })),
      setThree: (day, index, text) =>
        set((state) => {
          const { key, plan } = weekOf(state.weeks, day);
          const three: [string, string, string] = [...plan.three];
          three[index] = text;
          return { weeks: { ...state.weeks, [key]: { ...plan, three } } };
        }),
      toggleTime: (day, timeId) =>
        set((state) => {
          const { key, plan } = weekOf(state.weeks, day);
          const has = plan.protectedTimes.includes(timeId);
          const protectedTimes = has
            ? plan.protectedTimes.filter((id) => id !== timeId)
            : [...plan.protectedTimes, timeId];
          return { weeks: { ...state.weeks, [key]: { ...plan, protectedTimes } } };
        }),
      clearSample: () =>
        set((state) => {
          const weeks = { ...state.weeks };
          if (state.sampleWeek) delete weeks[state.sampleWeek];
          return {
            tasks: state.tasks.filter((t) => !t.sample),
            goals: state.goals.filter((g) => !g.sample),
            weeks,
            sample: false,
            sampleWeek: null,
            focusId: null,
            focusStartedAt: null,
          };
        }),
      resetAll: () => set(() => ({ ...emptyData(), hydrated: true })),
    }),
    {
      name: "abcdef-planner-v1",
      skipHydration: true,
      partialize: (state) => ({
        tasks: state.tasks,
        goals: state.goals,
        weeks: state.weeks,
        bootstrapped: state.bootstrapped,
        sample: state.sample,
        sampleWeek: state.sampleWeek,
        focusId: state.focusId,
        focusStartedAt: state.focusStartedAt,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          usePlanner.setState({ hydrated: true });
          return;
        }
        const current = usePlanner.getState();
        if (!current.bootstrapped) {
          usePlanner.setState({ ...createSeed(), hydrated: true });
          return;
        }
        usePlanner.setState({ hydrated: true });
      },
    },
  ),
);
