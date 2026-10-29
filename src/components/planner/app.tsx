import { useEffect, useState } from "react";
import { BookOpen, Flag, ListChecks } from "lucide-react";
import { dayKey } from "@/lib/planner/model";
import { usePlanner } from "@/lib/planner/store";
import { Focus } from "@/components/planner/focus";
import { Goals } from "@/components/planner/goals";
import { Method } from "@/components/planner/method";
import { Today } from "@/components/planner/today";

type Tab = "today" | "goals" | "method";

const TABS: { id: Tab; label: string; icon: typeof ListChecks }[] = [
  { id: "today", label: "Today", icon: ListChecks },
  { id: "goals", label: "Goals", icon: Flag },
  { id: "method", label: "Method", icon: BookOpen },
];

export function PlannerApp() {
  const hydrated = usePlanner((s) => s.hydrated);
  const tasks = usePlanner((s) => s.tasks);
  const focusId = usePlanner((s) => s.focusId);
  const [tab, setTab] = useState<Tab>("today");
  const [day, setDay] = useState(dayKey);

  useEffect(() => {
    void usePlanner.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (!hydrated || !focusId) return;
    const live = tasks.some((t) => t.id === focusId && t.status === "open");
    if (!live) usePlanner.getState().setFocus(null);
  }, [hydrated, focusId, tasks]);

  if (!hydrated) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col px-5 pt-8">
        <p className="text-xs tracking-widest uppercase text-muted">Master the day</p>
        <h1 className="font-display text-4xl font-semibold">ABCDEF</h1>
        <p className="mt-3 max-w-xs text-base text-muted">Opening your list.</p>
      </main>
    );
  }

  const focusTask = tasks.find((t) => t.id === focusId && t.status === "open") ?? null;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <main className="mx-auto flex min-h-screen max-w-xl flex-col px-5 pt-6 pb-28">
        <header className="mb-6">
          <p className="text-xs tracking-widest uppercase text-muted">Master the day</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">ABCDEF</h1>
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted">
            Write the list. Stamp a letter. Start at A-1 and stay there.
          </p>
        </header>
        {tab === "today" ? <Today day={day} setDay={setDay} /> : null}
        {tab === "goals" ? <Goals /> : null}
        {tab === "method" ? <Method day={day} /> : null}
      </main>

      <nav className="dock fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card" aria-label="Sections">
        <div className="mx-auto flex max-w-xl">
          {TABS.map((item) => {
            const Icon = item.icon;
            const on = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={on ? "page" : undefined}
                onClick={() => setTab(item.id)}
                className={
                  "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs " +
                  (on ? "text-ink" : "text-muted")
                }
              >
                <Icon className="size-5" aria-hidden="true" strokeWidth={on ? 2.25 : 1.75} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {focusTask ? <Focus task={focusTask} tasks={tasks} /> : null}
    </div>
  );
}
