import { LETTERS, LETTER_META, type Letter } from "@/lib/planner/model";

type Props = {
  value: Letter | null;
  onPick: (letter: Letter) => void;
  label?: string;
};

export function Stamps({ value, onPick, label = "Give this a letter" }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
      {LETTERS.map((letter) => {
        const on = value === letter;
        const meta = LETTER_META[letter];
        return (
          <button
            key={letter}
            type="button"
            aria-pressed={on}
            aria-label={`${letter}, ${meta.name}. ${meta.hint}`}
            onClick={() => onPick(letter)}
            className={
              "flex h-11 w-11 items-center justify-center rounded-lg border font-display text-lg font-semibold transition-colors " +
              (on
                ? letter === "A"
                  ? "border-frog bg-frog text-frog-ink"
                  : "border-ink bg-ink text-paper"
                : "border-line bg-card text-ink hover:border-ink")
            }
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}
