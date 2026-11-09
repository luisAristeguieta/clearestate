import { CircleDot } from "lucide-react";

import type { TimelineEvent } from "@/config/phase2Config";

const formatEventDate = (isoDate: string): string =>
  new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));

export function RequisitionTimeline({ events }: { events: TimelineEvent[] }) {
  const orderedEvents = [...events].sort((first, second) => first.at.localeCompare(second.at));
  return (
    <ol className="relative space-y-5 border-l border-border pl-6">
      {orderedEvents.map((event) => (
        <li key={event.id} className="relative">
          <span className="absolute -left-[31px] top-0.5 grid h-5 w-5 place-items-center rounded-full bg-background">
            <CircleDot className="h-4 w-4 text-foreground" />
          </span>
          <p className="text-sm font-semibold text-foreground">{event.action}</p>
          <p className="text-xs text-muted-foreground">
            {event.actorName} · {formatEventDate(event.at)}
          </p>
          {event.note && <p className="mt-2 text-sm text-muted-foreground">{event.note}</p>}
        </li>
      ))}
    </ol>
  );
}
