import { assetLabel } from "@/types/path";
import type { FindPathsInput } from "@/types/path";

interface Props {
  input: FindPathsInput | null;
}

const LARGE_AMOUNT_THRESHOLD = 1000;

function buildSuggestions(input: FindPathsInput | null): string[] {
  const suggestions: string[] = [];
  if (!input) return suggestions;

  const { direction, amount, source, destination } = input;

  suggestions.push(
    direction === "strict-send"
      ? "Try switching to strict receive — pinning the amount you want to receive instead can sometimes turn up routes that strict send misses."
      : "Try switching to strict send — pinning the amount you want to send instead can sometimes turn up routes that strict receive misses.",
  );

  const numericAmount = Number(amount);
  if (Number.isFinite(numericAmount) && numericAmount > LARGE_AMOUNT_THRESHOLD) {
    suggestions.push(
      "This is a fairly large amount — there may not be enough liquidity to fill it right now. Trying a smaller amount is worth a shot.",
    );
  }

  const sourceIsNative = source.type === "native";
  const destinationIsNative = destination.type === "native";
  if (!sourceIsNative && !destinationIsNative) {
    suggestions.push(
      `Both ${assetLabel(source)} and ${assetLabel(destination)} are non-native assets. Routing through XLM tends to have the deepest liquidity, so try setting your source or destination to XLM first and see if that connects.`,
    );
  }

  if (suggestions.length < 2) {
    suggestions.push(
      "It's also possible there just isn't a live offer connecting these assets right now — waiting a moment and searching again can help.",
    );
  }

  return suggestions;
}

export function NoRoutesEmptyState({ input }: Props) {
  const suggestions = buildSuggestions(input);

  return (
    <section className="mt-6 rounded-xl border border-sky-800/50 bg-sky-950/20 p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-sky-200">No routes found</p>
        <p className="text-xs text-sky-300/70">
          We couldn&apos;t find a path between these assets at this amount.
          Here&apos;s what you could try next:
        </p>
      </div>
      <ul className="mt-4 space-y-2.5">
        {suggestions.map((suggestion) => (
          <li
            key={suggestion}
            className="flex gap-2 text-sm text-slate-300"
          >
            <span aria-hidden="true" className="text-sky-400">
              ·
            </span>
            <span>{suggestion}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
