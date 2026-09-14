export type EventCategory =
  | "israeli"
  | "jewish"
  | "world"
  | "culture"
  | "science";

export interface HistoricalEvent {
  id: string;
  monthDay: string;
  year?: number;
  titleHe: string;
  descriptionHe?: string;
  category: EventCategory;
  source?: string;
  tags?: string[];
}

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  israeli: "ישראלי",
  jewish: "יהודי",
  world: "עולמי",
  culture: "תרבות",
  science: "מדע",
};
