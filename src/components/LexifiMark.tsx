/* The Lexifi dot-grid mark: an L and a T on a 7×7 grid of dots. */

const ON: [number, number][] = [
  [0, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0],
  ...[1, 2, 3, 4, 5].flatMap((r) => [[0, r], [4, r]] as [number, number][]),
  [0, 6], [1, 6], [2, 6], [4, 6],
];
const isOn = (c: number, r: number) => ON.some(([x, y]) => x === c && y === r);

export function LexifiMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  const cells = Array.from({ length: 49 }, (_, i) => [i % 7, Math.floor(i / 7)] as const);
  return (
    <svg width={size} height={size} viewBox="0 0 70 70" className={className} role="img" aria-label="Lexifi">
      {cells.map(([c, r]) =>
        isOn(c, r) ? (
          <circle key={`${c}-${r}`} cx={5 + c * 10} cy={5 + r * 10} r={4} fill="#22d3ee" />
        ) : (
          <circle key={`${c}-${r}`} cx={5 + c * 10} cy={5 + r * 10} r={1.7} fill="#1e2b36" />
        ),
      )}
    </svg>
  );
}
