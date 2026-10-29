import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight } from "lucide-react";
import {
  LETTER_META,
  TIMES,
  addDays,
  blockedBy,
  dayKey,
  dayStatus,
  formatDay,
  formatLong,
  isWorkLetter,
  letterLabel,
  weekKey,
  type Letter,
  type Task,
} from "@/lib/planner/model";
import { usePlanner } from "@/lib/planner/store";
import { Stamps } from "@/components/planner/stamps";

type Undo = {
  id: string;
  letter: Task["letter"];
  status: Task["status"];
  doneAt: number | null;
};

export function Today({ day, setDay }: { day: string; setDay: (day: string) => void }) {
  const tasks = usePlanner((s) => s.tasks);
  const goals = usePlanner((s) => s.goals);
  const weeks = usePlanner((s) => s.weeks);
  const sample = usePlanner((s) => s.sample);
  const addTask = usePlanner((s) => s.addTask);
  const setLetter = usePlanner((s) => s.setLetter);
  const fileTask = usePlanner((s) => s.fileTask);
  const completeTask = usePlanner((s) => s.completeTask);
  const reopenTask = usePlanner((s) => s.reopenTask);
  const updateTask = usePlanner((s) => s.updateTask);
  const removeTask = usePlanner((s) => s.removeTask);
  const moveTask = usePlanner((s) => s.moveTask);
  const bringForward = usePlanner((s) => s.bringForward);
  const setFocus = usePlanner((s) => s.setFocus);
  const clearSample = usePlanner((s) => s.clearSample);
  const setThree = usePlanner((s) => s.setThree);

  const [title, setTitle] = useState("");
  const [stamp, setStamp] = useState<Letter | null>(null);
  const [fileOn, setFileOn] = useState(addDays(day, 1));
  const [openId, setOpenId] = useState<string | null>(null);
  const [filingId, setFilingId] = useState<string | null>(null);
  const [rowFileOn, setRowFileOn] = useState(addDays(day, 1));
  const [warnId, setWarnId] = useState<string | null>(null);
  const [undo, setUndo] = useState<Undo | null>(null);
  const [threeOpen, setThreeOpen] = useState(false);

  const today = dayKey();
  const onDay = tasks.filter((t) => t.day === day);
  const current = useMemo(() => {
    const open = onDay.filter((t) => t.status === "open" && isWorkLetter(t.letter));
    open.sort((a, b) => {
      const rank = { A: 0, B: 1, C: 2 };
      const d = rank[a.letter as "A" | "B" | "C"] - rank[b.letter as "A" | "B" | "C"];
      return d !== 0 ? d : a.sort - b.sort;
    });
    return open[0] ?? null;
  }, [onDay]);

  const waiting = onDay
    .filter((t) => t.letter === null && t.status === "open")
    .sort((a, b) => a.sort - b.sort);
  const grouped = (letter: Letter) =>
    onDay.filter((t) => t.letter === letter).sort((a, b) => a.sort - b.sort);

  const carriedCount = tasks.filter(
    (t) => t.day < today && t.status === "open" && t.letter !== "D" && t.letter !== "E",
  ).length;
  const filed = tasks
    .filter((t) => t.day > day && t.origin === "filed" && t.status === "open")
    .sort((a, b) => a.day.localeCompare(b.day) || a.sort - b.sort);

  const plan = weeks[weekKey(day)] ?? { three: ["", "", ""] as [string, string, string], protectedTimes: [] };
  const protectedNames = TIMES.filter((t) => plan.protectedTimes.includes(t.id)).map((t) => t.name);
  const evening = new Date().getHours() >= 17;
  const status = dayStatus(tasks, day);

  function submit() {
    if (!title.trim()) return;
    addTask(day, title, stamp, stamp === "F" ? fileOn : undefined);
    setTitle("");
    if (stamp === "D") {
      const newest = [...usePlanner.getState().tasks].reverse().find((t) => t.title === title.trim());
      if (newest) setOpenId(newest.id);
    }
  }

  function tryComplete(task: Task) {
    const blocker = blockedBy(tasks, task);
    if (blocker) {
      setWarnId(task.id);
      setOpenId(task.id);
      return;
    }
    completeTask(task.id);
  }

  function pickLetter(task: Task, letter: Letter) {
    if (letter === "F") {
      setFilingId(task.id);
      setRowFileOn(addDays(day, 1));
      setOpenId(task.id);
      return;
    }
    if (letter === "E") {
      setUndo({ id: task.id, letter: task.letter, status: task.status, doneAt: task.doneAt });
      setLetter(task.id, "E");
      return;
    }
    setLetter(task.id, letter);
    if (letter === "D") setOpenId(task.id);
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Previous day"
          onClick={() => setDay(addDays(day, -1))}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-card"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <div className="text-center">
          <p className="font-display text-xl font-semibold">{formatLong(day)}</p>
          {day !== today ? (
            <button type="button" onClick={() => setDay(today)} className="text-sm text-frog">
              Back to today
            </button>
          ) : (
            <p className="text-sm text-muted">Think on paper before you begin</p>
          )}
        </div>
        <button
          type="button"
          aria-label="Next day"
          onClick={() => setDay(addDays(day, 1))}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-card"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>

      {sample ? (
        <div className="rounded-2xl border border-line bg-card px-4 py-3">
          <p className="text-sm leading-relaxed">
            A sample day is here so you can see the method. Lists stay on this device.
          </p>
          <button type="button" onClick={clearSample} className="mt-2 text-sm font-medium text-frog">
            Clear the sample
          </button>
        </div>
      ) : null}

      {day === today && evening ? (
        <button
          type="button"
          onClick={() => setDay(addDays(today, 1))}
          className="rounded-2xl bg-ink px-4 py-3 text-left text-sm leading-relaxed text-paper"
        >
          Plan tomorrow before you stop. One minute of planning saves about ten of doing.
        </button>
      ) : null}

      {day === today && carriedCount > 0 ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3">
          <p className="text-sm">
            {carriedCount} open {carriedCount === 1 ? "task" : "tasks"} from earlier days.
          </p>
          <button
            type="button"
            onClick={() => bringForward(today)}
            className="shrink-0 text-sm font-medium text-frog"
          >
            Bring forward
          </button>
        </div>
      ) : null}

      <section className="rounded-2xl border border-line bg-card px-4 py-3">
        <button
          type="button"
          onClick={() => setThreeOpen((v) => !v)}
          className="flex w-full items-baseline justify-between gap-3 text-left"
          aria-expanded={threeOpen}
        >
          <span className="text-xs tracking-widest uppercase text-muted">Law of Three</span>
          <span className="text-xs text-muted">{threeOpen ? "Close" : "Edit"}</span>
        </button>
        {threeOpen ? (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-sm text-muted">Three results that would make this week a success.</p>
            {plan.three.map((line, index) => (
              <input
                key={index}
                value={line}
                aria-label={`Week result ${index + 1}`}
                onChange={(e) => setThree(day, index as 0 | 1 | 2, e.target.value)}
                placeholder={`${index + 1}.`}
                className="min-h-11 rounded-lg border border-line bg-paper px-3 text-base outline-none"
              />
            ))}
          </div>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {plan.three.every((line) => !line.trim()) ? (
              <li className="text-sm text-muted">Name the three results that matter this week.</li>
            ) : (
              plan.three.map((line, index) =>
                  line.trim() ? (
                    <li key={`${index}-${line}`} className="text-sm">
                      {line}
                    </li>
                  ) : null,
                )
            )}
          </ul>
        )}
        {protectedNames.length > 0 ? (
          <p className="mt-3 text-xs text-muted">Protected this week: {protectedNames.join(", ")}</p>
        ) : null}
      </section>

      <form
        className="rounded-2xl border border-line bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="new-task" className="text-xs tracking-widest uppercase text-muted">
          Add to the list
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="new-task"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What might you do?"
            autoComplete="off"
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 text-base outline-none"
          />
          <button
            type="submit"
            className="min-h-11 shrink-0 rounded-lg bg-ink px-4 text-sm font-medium text-paper"
          >
            Add
          </button>
        </div>
        <div className="mt-3">
          <Stamps value={stamp} onPick={(letter) => setStamp(stamp === letter ? null : letter)} label="Letter for the new task" />
        </div>
        <p className="mt-2 text-sm text-muted">
          {stamp ? LETTER_META[stamp].hint : "No letter yet — you can stamp it after it lands on the list."}
        </p>
        {stamp === "F" ? (
          <label className="mt-2 flex items-center gap-2 text-sm">
            File onto
            <input
              type="date"
              value={fileOn}
              min={addDays(day, 1)}
              onChange={(e) => setFileOn(e.target.value)}
              className="min-h-11 rounded-lg border border-line bg-paper px-2 text-base"
            />
          </label>
        ) : null}
      </form>

      <p className="px-1 text-sm leading-relaxed text-muted">{status}</p>

      {current ? (
        <article className="overflow-hidden rounded-2xl bg-ink text-paper">
          <div className="flex">
            <div className="flex w-16 shrink-0 items-center justify-center bg-frog font-display text-xl font-semibold text-frog-ink">
              {letterLabel(current, tasks)}
            </div>
            <div className="flex-1 px-4 py-4">
              <p className="text-xs tracking-widest uppercase opacity-70">
                {current.letter === "A" && letterLabel(current, tasks) === "A-1"
                  ? "Eat this first"
                  : "Do this next"}
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold leading-tight">{current.title}</h2>
              {current.carried ? <p className="mt-1 text-xs opacity-70">Carried from an earlier day</p> : null}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setFocus(current.id)}
                  className="min-h-11 rounded-lg bg-frog px-4 text-sm font-medium text-frog-ink"
                >
                  Begin
                </button>
                <button
                  type="button"
                  onClick={() => tryComplete(current)}
                  className="min-h-11 rounded-lg border border-paper/30 px-4 text-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </article>
      ) : null}

      {waiting.length > 0 ? (
        <Section title="Waiting for a letter" count={waiting.length}>
          {waiting.map((task) => (
            <Row
              key={task.id}
              task={task}
              tasks={tasks}
              goals={goals}
              open={openId === task.id}
              warn={warnId === task.id}
              filing={filingId === task.id}
              fileOn={rowFileOn}
              onToggle={() => setOpenId(openId === task.id ? null : task.id)}
              onComplete={() => tryComplete(task)}
              onReopen={() => reopenTask(task.id)}
              onLetter={(letter) => pickLetter(task, letter)}
              onFileDate={setRowFileOn}
              onFile={() => {
                if (!rowFileOn || rowFileOn <= day) return;
                fileTask(task.id, rowFileOn);
                setFilingId(null);
              }}
              onChange={(patch) => updateTask(task.id, patch)}
              onRemove={() => removeTask(task.id)}
              onMove={(dir) => moveTask(task.id, dir)}
              onAnyway={() => {
                completeTask(task.id);
                setWarnId(null);
              }}
              onStay={() => {
                if (current) setFocus(current.id);
                setWarnId(null);
              }}
            />
          ))}
        </Section>
      ) : null}

      {(["A", "B", "C", "D"] as const).map((letter) => {
        const items = grouped(letter);
        if (items.length === 0) return null;
        return (
          <Section key={letter} title={`${letter} · ${LETTER_META[letter].name}`} count={items.length}>
            {items.map((task) => (
              <Row
                key={task.id}
                task={task}
                tasks={tasks}
                goals={goals}
                open={openId === task.id}
                warn={warnId === task.id}
                filing={filingId === task.id}
                fileOn={rowFileOn}
                onToggle={() => setOpenId(openId === task.id ? null : task.id)}
                onComplete={() => tryComplete(task)}
                onReopen={() => reopenTask(task.id)}
                onLetter={(letter) => pickLetter(task, letter)}
                onFileDate={setRowFileOn}
                onFile={() => {
                  if (!rowFileOn || rowFileOn <= day) return;
                  fileTask(task.id, rowFileOn);
                  setFilingId(null);
                }}
                onChange={(patch) => updateTask(task.id, patch)}
                onRemove={() => removeTask(task.id)}
                onMove={(dir) => moveTask(task.id, dir)}
                onAnyway={() => {
                  completeTask(task.id);
                  setWarnId(null);
                }}
                onStay={() => {
                  if (current) setFocus(current.id);
                  setWarnId(null);
                }}
              />
            ))}
          </Section>
        );
      })}

      {day === today && filed.length > 0 ? (
        <Section title="Filed ahead" count={filed.length}>
          {filed.map((task) => (
            <div key={task.id} className="flex items-baseline justify-between gap-3 border-t border-line px-4 py-3 first:border-t-0">
              <div>
                <p className="text-sm">{task.title}</p>
                <p className="text-xs text-muted">{formatDay(task.day)}</p>
              </div>
              <button type="button" onClick={() => setDay(task.day)} className="text-sm text-frog">
                Open
              </button>
            </div>
          ))}
        </Section>
      ) : null}

      {grouped("E").length > 0 ? (
        <Section title="E · Eliminated" count={grouped("E").length}>
          {grouped("E").map((task) => (
            <div key={task.id} className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 first:border-t-0">
              <p className="text-sm text-muted line-through">{task.title}</p>
              <button type="button" onClick={() => reopenTask(task.id)} className="text-sm text-ink">
                Restore
              </button>
            </div>
          ))}
        </Section>
      ) : null}

      {undo ? (
        <div className="fixed inset-x-0 bottom-24 z-30 mx-auto flex w-full max-w-xl items-center justify-between gap-3 px-5">
          <div className="flex w-full items-center justify-between gap-3 rounded-xl bg-ink px-4 py-3 text-sm text-paper">
            <span>Eliminated. It’s off the list.</span>
            <button
              type="button"
              className="font-medium text-frog-ink"
              onClick={() => {
                updateTask(undo.id, {
                  letter: undo.letter,
                  status: undo.status,
                  doneAt: undo.doneAt,
                });
                setUndo(null);
              }}
            >
              Undo
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-card">
      <header className="flex items-baseline justify-between px-4 py-3">
        <h3 className="text-xs tracking-widest uppercase text-muted">{title}</h3>
        <span className="text-xs tabular-nums text-muted">{count}</span>
      </header>
      {children}
    </section>
  );
}

function Row({
  task,
  tasks,
  goals,
  open,
  warn,
  filing,
  fileOn,
  onToggle,
  onComplete,
  onReopen,
  onLetter,
  onFileDate,
  onFile,
  onChange,
  onRemove,
  onMove,
  onAnyway,
  onStay,
}: {
  task: Task;
  tasks: Task[];
  goals: { id: string; title: string; definite: boolean }[];
  open: boolean;
  warn: boolean;
  filing: boolean;
  fileOn: string;
  onToggle: () => void;
  onComplete: () => void;
  onReopen: () => void;
  onLetter: (letter: Letter) => void;
  onFileDate: (day: string) => void;
  onFile: () => void;
  onChange: (patch: Partial<Task>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onAnyway: () => void;
  onStay: () => void;
}) {
  const label = letterLabel(task, tasks);
  const done = task.status === "done";
  const delegated = task.status === "delegated";
  const blocker = warn ? blockedBy(tasks, task) : null;

  return (
    <div className="border-t border-line">
      <div className="flex items-stretch">
        <div
          className={
            "flex w-16 shrink-0 items-center justify-center border-r border-line font-display text-base font-semibold " +
            (task.letter === "A" ? "text-frog" : "text-ink")
          }
        >
          {label}
        </div>
        <button type="button" onClick={onToggle} className="flex-1 px-3 py-3 text-left">
          <span className={"block text-base leading-snug " + (done ? "text-muted line-through" : "")}>
            {task.title}
          </span>
          {delegated ? (
            <span className="mt-1 block text-xs text-muted">
              Handed {task.delegateTo ? `to ${task.delegateTo}` : "off — name who"}
            </span>
          ) : null}
          {task.carried && !delegated ? (
            <span className="mt-1 block text-xs text-muted">From an earlier day</span>
          ) : null}
          {task.origin === "filed" && task.letter === null ? (
            <span className="mt-1 block text-xs text-muted">Filed onto this day</span>
          ) : null}
        </button>
        {isWorkLetter(task.letter) ? (
          <button
            type="button"
            aria-label={done ? `Reopen ${task.title}` : `Mark ${task.title} done`}
            onClick={done ? onReopen : onComplete}
            className={
              "m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border " +
              (done ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink")
            }
          >
            {done ? <Check className="size-4" aria-hidden="true" /> : null}
          </button>
        ) : (
          <span className="w-2" />
        )}
      </div>

      {blocker ? (
        <div className="mx-4 mb-3 rounded-xl bg-paper px-3 py-3 text-sm">
          <p>
            {letterLabel(blocker, tasks)} is still open. Finish that before this one.
          </p>
          <div className="mt-2 flex gap-3">
            <button type="button" onClick={onStay} className="font-medium text-frog">
              Stay with {letterLabel(blocker, tasks)}
            </button>
            <button type="button" onClick={onAnyway} className="text-muted">
              Do it anyway
            </button>
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="flex flex-col gap-3 px-4 pb-4">
          <input
            value={task.title}
            aria-label="Task title"
            onChange={(e) => onChange({ title: e.target.value })}
            className="min-h-11 rounded-lg border border-line bg-paper px-3 text-base outline-none"
          />
          <Stamps value={filing ? "F" : task.letter} onPick={onLetter} />
          {filing ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={fileOn}
                min={addDays(task.day, 1)}
                onChange={(e) => onFileDate(e.target.value)}
                className="min-h-11 rounded-lg border border-line bg-paper px-2 text-base"
              />
              <button type="button" onClick={onFile} className="min-h-11 rounded-lg bg-ink px-4 text-sm text-paper">
                File it
              </button>
            </div>
          ) : null}
          {task.letter === "D" || delegated ? (
            <label className="text-sm">
              <span className="mb-1 block text-muted">Hand to</span>
              <input
                value={task.delegateTo}
                onChange={(e) => onChange({ delegateTo: e.target.value, status: "delegated", letter: "D" })}
                placeholder="Name"
                className="min-h-11 w-full rounded-lg border border-line bg-paper px-3 text-base outline-none"
              />
            </label>
          ) : null}
          <label className="text-sm">
            <span className="mb-1 block text-muted">Note</span>
            <textarea
              value={task.note}
              onChange={(e) => onChange({ note: e.target.value })}
              rows={2}
              className="w-full resize-none rounded-lg border border-line bg-paper px-3 py-2 text-base outline-none"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Serves</span>
            <select
              value={task.goalId ?? ""}
              onChange={(e) => onChange({ goalId: e.target.value || null })}
              className="min-h-11 w-full rounded-lg border border-line bg-paper px-3 text-base"
            >
              <option value="">No goal</option>
              {goals
                .filter((g) => g.title.trim())
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.definite ? "Purpose — " : ""}
                    {g.title}
                  </option>
                ))}
            </select>
          </label>
          {isWorkLetter(task.letter) ? (
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Move up"
                onClick={() => onMove(-1)}
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-line"
              >
                <ArrowUp className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Move down"
                onClick={() => onMove(1)}
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-line"
              >
                <ArrowDown className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : null}
          <div className="flex gap-4 text-sm">
            {delegated ? (
              <button
                type="button"
                onClick={() => onChange({ status: "open", letter: null, delegateTo: "" })}
                className="text-ink"
              >
                Take it back
              </button>
            ) : null}
            <button type="button" onClick={onRemove} className="text-muted">
              Remove
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
