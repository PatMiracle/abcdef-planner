import { useEffect, useState } from "react";
import { letterLabel, type Task } from "@/lib/planner/model";
import { usePlanner } from "@/lib/planner/store";

function elapsedLabel(started: number, now: number): string {
  const seconds = Math.max(0, Math.floor((now - started) / 1000));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function Focus({ task, tasks }: { task: Task; tasks: Task[] }) {
  const completeTask = usePlanner((s) => s.completeTask);
  const setFocus = usePlanner((s) => s.setFocus);
  const updateTask = usePlanner((s) => s.updateTask);
  const started = usePlanner((s) => s.focusStartedAt) ?? Date.now();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const label = letterLabel(task, tasks);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-ink text-paper">
      <div className="focus-screen mx-auto flex w-full max-w-xl flex-1 flex-col px-6 pt-8">
        <p className="text-xs tracking-widest uppercase opacity-70">Stay with this</p>
        <p className="mt-6 font-display text-5xl font-semibold text-frog-ink">{label}</p>
        <h2 className="mt-3 font-display text-3xl font-semibold leading-tight">{task.title}</h2>
        <p className="mt-4 max-w-sm text-base leading-relaxed opacity-80">
          Start this one job and don’t switch until it is finished. That is the whole method.
        </p>
        <p className="mt-8 font-display text-4xl tabular-nums">{elapsedLabel(started, now)}</p>
        <label className="mt-8 block text-sm opacity-70" htmlFor="focus-note">
          Note while you work
        </label>
        <textarea
          id="focus-note"
          value={task.note}
          onChange={(e) => updateTask(task.id, { note: e.target.value })}
          rows={4}
          className="mt-2 w-full resize-none rounded-xl border border-paper/20 bg-paper/10 px-3 py-3 text-base text-paper outline-none"
        />
        <div className="mt-auto flex flex-col gap-3 pt-8">
          <button
            type="button"
            onClick={() => completeTask(task.id)}
            className="min-h-12 rounded-xl bg-frog px-4 py-3 text-base font-medium text-frog-ink"
          >
            It’s done
          </button>
          <button
            type="button"
            onClick={() => setFocus(null)}
            className="min-h-12 rounded-xl border border-paper/25 px-4 py-3 text-base text-paper"
          >
            Not yet — back to the list
          </button>
        </div>
      </div>
    </div>
  );
}
