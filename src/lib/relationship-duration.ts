export type RelationshipDuration = { label: string; years: number | null; months: number | null; approximate: boolean };

export function relationshipDuration(input: { occurredOn?: string | null; approximateDateText?: string | null; certainty?: string | null }, now = new Date()): RelationshipDuration {
  if (input.certainty === "exact" && input.occurredOn) {
    const start = new Date(`${input.occurredOn}T00:00:00Z`);
    if (!Number.isNaN(start.valueOf()) && start <= now) {
      let months = (now.getUTCFullYear() - start.getUTCFullYear()) * 12 + now.getUTCMonth() - start.getUTCMonth();
      if (now.getUTCDate() < start.getUTCDate()) months -= 1;
      const years = Math.floor(months / 12); const remainder = months % 12;
      const parts = [years ? `${years} year${years === 1 ? "" : "s"}` : "", remainder ? `${remainder} month${remainder === 1 ? "" : "s"}` : ""].filter(Boolean);
      return { label: `Known for ${parts.join(", ") || "less than a month"}`, years, months: remainder, approximate: false };
    }
  }
  if (input.certainty === "approximate" && input.approximateDateText) {
    const year = input.approximateDateText.match(/\b(19|20)\d{2}\b/)?.[0];
    if (year) { const years = Math.max(0, now.getUTCFullYear() - Number(year)); return { label: `Known for approximately ${years} year${years === 1 ? "" : "s"}`, years, months: null, approximate: true }; }
    return { label: `First meeting: approximately ${input.approximateDateText}`, years: null, months: null, approximate: true };
  }
  return { label: "First meeting date unknown", years: null, months: null, approximate: false };
}
