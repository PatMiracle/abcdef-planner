import { format, getISOWeek, getISOWeekYear } from "date-fns";

export const LETTERS = ["A", "B", "C", "D", "E", "F"] as const;
export type Letter = (typeof LETTERS)[number];

export type TaskStatus = "open" | "done" | "delegated" | "eliminated";

export type Task = {
  id: string;
  title: string;
  day: string;
  letter: Letter | null;
  sort: number;
  status: TaskStatus;
  delegateTo: string;
  note: string;
  goalId: string | null;
  carried: boolean;
  origin: "filed" | null;
  sample?: boolean;
  createdAt: number;
  doneAt: number | null;
};

export type Goal = {
  id: string;
  title: string;
  deadline: string;
  definite: boolean;
  sample?: boolean;
};

export type WeekPlan = {
  three: [string, string, string];
  protectedTimes: string[];
};

export const LETTER_META: Record<Letter, { name: string; hint: string }> = {
  A: {
    name: "Must",
    hint: "Serious consequences if you don't do it. These come first.",
  },
  B: {
    name: "Should",
    hint: "Mild consequences. Someone is inconvenienced. Nothing important breaks.",
  },
  C: {
    name: "Nice",
    hint: "No consequences either way. Only after every A and B is finished.",
  },
  D: {
    name: "Delegate",
    hint: "Someone else can do it. Hand it off and get back to your A's.",
  },
  E: {
    name: "Eliminate",
    hint: "It does not need doing. Take it off the list.",
  },
  F: {
    name: "File",
    hint: "Not today. Put it on the day you will actually do it.",
  },
};

export const RULES: { title: string; body: string }[] = [
  {
    title: "Think on paper first",
    body: "Write everything that might need doing before you start. The list is the plan, not a feeling.",
  },
  {
    title: "Consequences decide",
    body: "A task is only as important as what happens if it slips. Busy is not the same as valuable.",
  },
  {
    title: "Number the A's",
    body: "A-1 is the first frog. Begin it before anything else, and stay until it is finished.",
  },
  {
    title: "Keep the order",
    body: "Do not touch a B while an A is open. Do not touch a C while an A or a B is still open.",
  },
  {
    title: "Give work away",
    body: "Delegate what another person can do. Eliminate what nobody should do.",
  },
  {
    title: "Plan tomorrow tonight",
    body: "A minute spent planning the next day saves about ten minutes of doing it.",
  },
];

export const TIMES: { id: string; name: string; gloss: string }[] = [
  {
    id: "strategic",
    name: "Strategic planning",
    gloss: "Decide what you want and write it down. This time comes before motion.",
  },
  {
    id: "productive",
    name: "Productive",
    gloss: "Uninterrupted work on the highest-value task, until it is actually finished.",
  },
  {
    id: "income",
    name: "Income improvement",
    gloss: "The work that raises what you earn: skill, offers, and the activities that pay.",
  },
  {
    id: "spare",
    name: "Spare",
    gloss: "The scraps between things. Used on purpose, they compound. Left loose, they vanish.",
  },
  {
    id: "work",
    name: "Work",
    gloss: "The hours you are on the job. Spend them on results, not on looking busy.",
  },
  {
    id: "creative",
    name: "Creative",
    gloss: "Room for a better way. New ideas need a stretch of time that is not already full.",
  },
  {
    id: "problem",
    name: "Problem-solving",
    gloss: "A set time to face one decision, instead of carrying it around all day.",
  },
  {
    id: "people",
    name: "People and family",
    gloss: "Unhurried time with the people who matter. It does not mix with work time.",
  },
  {
    id: "rest",
    name: "Rest",
    gloss: "Sleep, a day off, a real break. Recovery is part of how you perform.",
  },
  {
    id: "quiet",
    name: "Quiet",
    gloss: "Silence, with nothing coming in. The pause that lets you hear what is next.",
  },
];

const RANK: Record<"A" | "B" | "C", number> = { A: 0, B: 1, C: 2 };

export function dayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDay(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(key: string, n: number): string {
  const d = parseDay(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

export function formatDay(key: string): string {
  return format(parseDay(key), "EEE, MMM d");
}

export function formatLong(key: string): string {
  return format(parseDay(key), "EEEE, MMMM d");
}

export function weekKey(day: string): string {
  const d = parseDay(day);
  return `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, "0")}`;
}

export function uid(): string {
  return crypto.randomUUID();
}

export function nextSort(tasks: Task[], day: string, letter: Letter | null): number {
  const sorts = tasks.filter((t) => t.day === day && t.letter === letter).map((t) => t.sort);
  if (sorts.length === 0) return 10;
  return Math.max(...sorts) + 10;
}

export function isWorkLetter(letter: Letter | null): letter is "A" | "B" | "C" {
  return letter === "A" || letter === "B" || letter === "C";
}

export function letterLabel(task: Task, tasks: Task[]): string {
  if (!task.letter) return "·";
  if (!isWorkLetter(task.letter)) return task.letter;
  const peers = tasks
    .filter(
      (t) => t.day === task.day && t.letter === task.letter && t.status !== "eliminated",
    )
    .sort((a, b) => a.sort - b.sort);
  const index = peers.findIndex((t) => t.id === task.id);
  return `${task.letter}-${index + 1}`;
}

export function comesBefore(a: Task, b: Task): boolean {
  if (!isWorkLetter(a.letter) || !isWorkLetter(b.letter)) return false;
  if (a.letter !== b.letter) return RANK[a.letter] < RANK[b.letter];
  return a.sort < b.sort;
}

export function blockedBy(tasks: Task[], task: Task): Task | null {
  if (task.status !== "open" || !isWorkLetter(task.letter)) return null;
  const earlier = tasks.filter(
    (t) =>
      t.day === task.day &&
      t.status === "open" &&
      t.id !== task.id &&
      isWorkLetter(t.letter) &&
      comesBefore(t, task),
  );
  if (earlier.length === 0) return null;
  earlier.sort((a, b) => (comesBefore(a, b) ? -1 : 1));
  return earlier[0] ?? null;
}

export function nowTask(tasks: Task[], day: string): Task | null {
  const open = tasks.filter(
    (t) => t.day === day && t.status === "open" && isWorkLetter(t.letter),
  );
  if (open.length === 0) return null;
  open.sort((a, b) => (comesBefore(a, b) ? -1 : 1));
  return open[0] ?? null;
}

export function emptyWeek(): WeekPlan {
  return { three: ["", "", ""], protectedTimes: [] };
}

export function dayStatus(tasks: Task[], day: string): string {
  const onDay = tasks.filter((t) => t.day === day);
  const as = onDay.filter((t) => t.letter === "A" && t.status !== "eliminated");
  const aOpen = as.filter((t) => t.status === "open");
  const bOpen = onDay.filter((t) => t.letter === "B" && t.status === "open");
  const cOpen = onDay.filter((t) => t.letter === "C" && t.status === "open");
  const waiting = onDay.filter((t) => t.letter === null && t.status === "open");

  if (onDay.length === 0) {
    return "Write the whole day down before you begin. Then give every item a letter.";
  }
  if (as.length === 0 && (waiting.length > 0 || bOpen.length > 0 || cOpen.length > 0)) {
    return "Nothing is an A yet. If everything is equal, nothing is a priority.";
  }
  if (aOpen.length > 0) {
    const done = as.length - aOpen.length;
    return `${done} of ${as.length} must-dos finished. Stay with the first one still open.`;
  }
  if (bOpen.length > 0) {
    return "The must-dos are done. Should-dos are next — not the nice-to-dos.";
  }
  if (cOpen.length > 0) {
    return "Only nice-to-dos are left. They can wait, or they can go.";
  }
  if (waiting.length > 0) {
    return "A few items still have no letter. Stamp them before they steal the day.";
  }
  return "Today’s list is handled. Plan tomorrow before the day ends.";
}
