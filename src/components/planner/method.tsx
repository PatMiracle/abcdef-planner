import { useState } from "react";
import { LETTERS, LETTER_META, RULES, TIMES, weekKey } from "@/lib/planner/model";
import { usePlanner } from "@/lib/planner/store";

export function Method({ day }: { day: string }) {
  const weeks = usePlanner((s) => s.weeks);
  const toggleTime = usePlanner((s) => s.toggleTime);
  const resetAll = usePlanner((s) => s.resetAll);
  const [armed, setArmed] = useState(false);
  const plan = weeks[weekKey(day)] ?? { three: ["", "", ""] as [string, string, string], protectedTimes: [] };

  return (
    <div className="flex flex-col gap-8 pb-8">
      <section>
        <p className="text-xs tracking-widest uppercase text-muted">The method</p>
        <h2 className="mt-2 font-display text-3xl font-semibold leading-tight">
          Rank the day by consequences
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Brian Tracy’s ABCDE method, taught in Master Your Time, Master Your Life: write the list,
          put a letter in the margin, and work from A-1 down. This planner adds F — file it — so later
          work doesn’t sit on today’s page.
        </p>
      </section>

      <section className="flex flex-col">
        {RULES.map((rule, index) => (
          <article key={rule.title} className="flex gap-4 border-t border-line py-4">
            <span className="w-8 shrink-0 font-display text-2xl font-semibold text-frog">{index + 1}</span>
            <div>
              <h3 className="font-display text-xl font-semibold">{rule.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{rule.body}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-2xl font-semibold">The letters</h2>
        {LETTERS.map((letter) => (
          <article key={letter} className="flex gap-4 rounded-2xl border border-line bg-card p-4">
            <span
              className={
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg font-display text-xl font-semibold " +
                (letter === "A" ? "bg-frog text-frog-ink" : "bg-ink text-paper")
              }
            >
              {letter}
            </span>
            <div>
              <h3 className="font-display text-lg font-semibold">{LETTER_META[letter].name}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{LETTER_META[letter].hint}</p>
            </div>
          </article>
        ))}
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold">Ten kinds of time</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          The book’s point is that time is not one thing. Planning, deep work, family, and rest don’t
          mix. Mark the kinds you will protect this week.
        </p>
        <ul className="mt-4 flex flex-col">
          {TIMES.map((time) => {
            const on = plan.protectedTimes.includes(time.id);
            return (
              <li key={time.id} className="border-t border-line py-3">
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleTime(day, time.id)}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <span
                    className={
                      "mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 " +
                      (on ? "bg-frog justify-end" : "bg-line justify-start")
                    }
                    aria-hidden="true"
                  >
                    <span className="h-5 w-5 rounded-full bg-card" />
                  </span>
                  <span>
                    <span className="block font-medium">{time.name}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted">{time.gloss}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="font-display text-xl font-semibold">On this device</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Nothing is sent anywhere. Erasing clears the lists saved in this browser.
        </p>
        {armed ? (
          <div className="mt-3 flex gap-3">
            <button type="button" onClick={() => resetAll()} className="min-h-11 rounded-lg bg-ink px-4 text-sm text-paper">
              Yes, erase
            </button>
            <button type="button" onClick={() => setArmed(false)} className="min-h-11 px-2 text-sm text-muted">
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setArmed(true)} className="mt-3 text-sm font-medium text-frog">
            Erase this device’s lists
          </button>
        )}
      </section>
    </div>
  );
}
