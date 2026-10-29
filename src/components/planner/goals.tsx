import { useState } from "react";
import { formatDay, uid, type Goal } from "@/lib/planner/model";
import { usePlanner } from "@/lib/planner/store";

export function Goals() {
  const goals = usePlanner((s) => s.goals);
  const tasks = usePlanner((s) => s.tasks);
  const saveGoal = usePlanner((s) => s.saveGoal);
  const removeGoal = usePlanner((s) => s.removeGoal);
  const [freshId, setFreshId] = useState<string | null>(null);

  const purpose = goals.find((g) => g.definite);
  const rest = goals.filter((g) => !g.definite);

  function writePurpose(patch: Partial<Goal>) {
    if (purpose) {
      saveGoal({ ...purpose, ...patch, definite: true });
      return;
    }
    saveGoal({
      id: uid(),
      title: "",
      deadline: "",
      definite: true,
      ...patch,
    });
  }

  function addGoal() {
    const id = uid();
    saveGoal({ id, title: "", deadline: "", definite: false });
    setFreshId(id);
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      <section className="rounded-2xl bg-ink px-5 py-5 text-paper">
        <p className="text-xs tracking-widest uppercase opacity-70">Major definite purpose</p>
        <h2 className="mt-2 font-display text-3xl font-semibold leading-tight">
          The one aim that would change things most
        </h2>
        <label htmlFor="purpose" className="mt-4 block text-sm opacity-70">
          Write it in one sentence
        </label>
        <textarea
          id="purpose"
          value={purpose?.title ?? ""}
          onChange={(e) => writePurpose({ title: e.target.value })}
          rows={3}
          placeholder="What you intend to achieve"
          className="mt-2 w-full resize-none rounded-xl border border-paper/20 bg-paper/10 px-3 py-3 text-base text-paper outline-none placeholder:text-paper/50"
        />
        <label className="mt-3 flex items-center justify-between gap-3 text-sm" htmlFor="purpose-deadline">
          <span className="opacity-70">Deadline</span>
          <input
            id="purpose-deadline"
            type="date"
            value={purpose?.deadline ?? ""}
            onChange={(e) => writePurpose({ deadline: e.target.value })}
            className="min-h-11 rounded-lg border border-paper/20 bg-paper/10 px-2 text-base text-paper"
          />
        </label>
        <PurposeTasks goalId={purpose?.id ?? null} />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-semibold">Written goals</h2>
          <button type="button" onClick={addGoal} className="text-sm font-medium text-frog">
            Add a goal
          </button>
        </div>
        <p className="text-sm leading-relaxed text-muted">
          A goal that isn’t written down is only a wish. Give it a deadline, then let today’s A tasks serve it.
        </p>
        {rest.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-sm text-muted">
            No other goals yet.
          </p>
        ) : (
          rest.map((goal) => (
            <article key={goal.id} className="rounded-2xl border border-line bg-card p-4">
              <input
                value={goal.title}
                autoFocus={freshId === goal.id}
                aria-label="Goal"
                onChange={(e) => saveGoal({ ...goal, title: e.target.value })}
                placeholder="Name the goal"
                className="w-full bg-transparent font-display text-xl font-semibold outline-none"
              />
              <label className="mt-3 flex items-center justify-between gap-3 text-sm text-muted">
                Deadline
                <input
                  type="date"
                  value={goal.deadline}
                  onChange={(e) => saveGoal({ ...goal, deadline: e.target.value })}
                  className="min-h-11 rounded-lg border border-line bg-paper px-2 text-base text-ink"
                />
              </label>
              {goal.deadline ? (
                <p className="mt-2 text-xs text-muted">Due {formatDay(goal.deadline)}</p>
              ) : null}
              <Linked goalId={goal.id} tasks={tasks} />
              <div className="mt-3 flex gap-4 text-sm">
                <button
                  type="button"
                  onClick={() => saveGoal({ ...goal, definite: true })}
                  className="font-medium text-ink"
                >
                  Make this the purpose
                </button>
                <button type="button" onClick={() => removeGoal(goal.id)} className="text-muted">
                  Remove
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

function PurposeTasks({ goalId }: { goalId: string | null }) {
  const tasks = usePlanner((s) => s.tasks);
  if (!goalId) return null;
  const linked = tasks.filter((t) => t.goalId === goalId && t.status === "open");
  if (linked.length === 0) {
    return <p className="mt-4 text-sm opacity-70">No open task is serving this yet. Link one from the day list.</p>;
  }
  return (
    <ul className="mt-4 flex flex-col gap-1 text-sm">
      {linked.map((t) => (
        <li key={t.id} className="opacity-90">
          {t.letter ? `${t.letter} · ` : ""}
          {t.title}
        </li>
      ))}
    </ul>
  );
}

function Linked({
  goalId,
  tasks,
}: {
  goalId: string;
  tasks: { id: string; goalId: string | null; status: string; title: string; letter: string | null }[];
}) {
  const linked = tasks.filter((t) => t.goalId === goalId && t.status === "open");
  if (linked.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-col gap-1">
      {linked.map((t) => (
        <li key={t.id} className="text-sm text-muted">
          {t.letter ? `${t.letter} · ` : ""}
          {t.title}
        </li>
      ))}
    </ul>
  );
}
