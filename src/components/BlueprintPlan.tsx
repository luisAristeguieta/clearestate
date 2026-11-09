import { useState } from "react";

interface LotCell {
  lotId: string;
  blockLabel: string;
  xPosition: number;
  yPosition: number;
  status: "available" | "sold" | "featured";
}

const BLOCKS = [
  { blockLabel: "A", originX: 20, originY: 20 },
  { blockLabel: "B", originX: 170, originY: 20 },
  { blockLabel: "C", originX: 20, originY: 130 },
  { blockLabel: "D", originX: 170, originY: 130 },
];

const FEATURED_LOTS = new Set(["A-3", "B-6", "C-2", "D-7"]);
const SOLD_LOTS = new Set(["A-1", "A-5", "B-2", "B-3", "C-6", "C-8", "D-1", "D-4"]);

const buildLots = (): LotCell[] =>
  BLOCKS.flatMap((block) =>
    Array.from({ length: 8 }, (_, lotIndex) => {
      const lotId = `${block.blockLabel}-${lotIndex + 1}`;
      return {
        lotId,
        blockLabel: block.blockLabel,
        xPosition: block.originX + (lotIndex % 4) * 30,
        yPosition: block.originY + Math.floor(lotIndex / 4) * 40,
        status: FEATURED_LOTS.has(lotId) ? "featured" : SOLD_LOTS.has(lotId) ? "sold" : "available",
      } satisfies LotCell;
    }),
  );

const LOTS = buildLots();

const lotFillClass: Record<LotCell["status"], string> = {
  available: "fill-background",
  sold: "fill-primary",
  featured: "fill-highlight",
};

/** Interactive lot-subdivision blueprint: hover any lot to read its block and status. */
export function BlueprintPlan() {
  const [hoveredLotId, setHoveredLotId] = useState<string | null>(null);
  const hoveredLot = LOTS.find((lot) => lot.lotId === hoveredLotId);

  return (
    <div className="relative">
      <svg viewBox="0 0 320 240" className="w-full" role="img" aria-label="Plano de lotización">
        <defs>
          <pattern id="blueprint-grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M10 0H0V10" className="fill-none stroke-border" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="320" height="240" fill="url(#blueprint-grid)" />
        <rect
          x="10"
          y="10"
          width="300"
          height="220"
          rx="6"
          className="fill-none stroke-foreground"
          strokeWidth="1"
          strokeDasharray="4 3"
        />
        <line
          x1="10"
          y1="120"
          x2="310"
          y2="120"
          className="stroke-muted-foreground"
          strokeWidth="0.6"
          strokeDasharray="6 4"
        />
        <line
          x1="160"
          y1="10"
          x2="160"
          y2="230"
          className="stroke-muted-foreground"
          strokeWidth="0.6"
          strokeDasharray="6 4"
        />
        {LOTS.map((lot) => (
          <rect
            key={lot.lotId}
            x={lot.xPosition}
            y={lot.yPosition}
            width="26"
            height="36"
            rx="2"
            className={`${lotFillClass[lot.status]} cursor-pointer stroke-foreground transition-opacity ${hoveredLotId && hoveredLotId !== lot.lotId ? "opacity-60" : ""}`}
            strokeWidth={hoveredLotId === lot.lotId ? 1.8 : 0.8}
            onMouseEnter={() => setHoveredLotId(lot.lotId)}
            onMouseLeave={() => setHoveredLotId(null)}
          />
        ))}
        {BLOCKS.map((block) => (
          <text
            key={block.blockLabel}
            x={block.originX + 60}
            y={block.originY + 95}
            textAnchor="middle"
            className="fill-foreground text-[8px] font-semibold tracking-widest"
          >
            MZ {block.blockLabel}
          </text>
        ))}
      </svg>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          Vendido
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-highlight" />
          Destacado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-foreground bg-background" />
          Disponible
        </span>
        <span className="ml-auto font-medium text-foreground">
          {hoveredLot ? `Lote ${hoveredLot.lotId}` : "Pasa el cursor sobre un lote"}
        </span>
      </div>
    </div>
  );
}
