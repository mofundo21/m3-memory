/**
 * Museum archive adapter.
 *
 * The museum reads data only through this interface. The only implementation
 * today is the placeholder adapter below. Every entity and counter says where it
 * came from. Nothing here is real personal history.
 *
 * Privacy: a public-safe archive view does not exist yet (decision D3). The
 * client never queries Supabase tables directly. When an approved public-safe
 * endpoint exists, it becomes a second implementation of MuseumArchiveAdapter.
 */

export type MuseumSource = 'placeholder' | 'archive';

export type MuseumCounterId =
  | 'people'
  | 'encounters'
  | 'places'
  | 'memories'
  | 'photographs'
  | 'years';

export interface MuseumCounter {
  id: MuseumCounterId;
  label: string;
  /** null when the value cannot be computed. Rendered as an em dash. */
  value: number | null;
  /** placeholder: dev value, tagged on screen. pending: no value yet. live: real aggregate. */
  status: 'placeholder' | 'live' | 'pending';
  source: MuseumSource;
}

export interface MuseumEvidenceItem {
  id: string;
  kind: 'person' | 'place' | 'event' | 'date' | 'memory';
  /** Role label only, for example "Person A". Never a real name in placeholder data. */
  label: string;
  source: MuseumSource;
}

export interface MuseumFragment {
  id: string;
  text: string;
  /** Attribution is always shown as a placeholder until real approved data exists. */
  attribution: string;
  source: MuseumSource;
}

export interface MuseumDataset {
  source: MuseumSource;
  counters: MuseumCounter[];
  evidence: MuseumEvidenceItem[];
  fragments: MuseumFragment[];
}

export interface MuseumArchiveAdapter {
  load(): Promise<MuseumDataset>;
}

const PLACEHOLDER_COUNTERS: MuseumCounter[] = [
  { id: 'people', label: 'People', value: 12, status: 'placeholder', source: 'placeholder' },
  { id: 'encounters', label: 'Encounters', value: 31, status: 'placeholder', source: 'placeholder' },
  { id: 'places', label: 'Places', value: 7, status: 'placeholder', source: 'placeholder' },
  { id: 'memories', label: 'Memories', value: 18, status: 'placeholder', source: 'placeholder' },
  { id: 'photographs', label: 'Photographs', value: 24, status: 'placeholder', source: 'placeholder' },
  { id: 'years', label: 'Years', value: 9, status: 'placeholder', source: 'placeholder' },
];

const PLACEHOLDER_EVIDENCE: MuseumEvidenceItem[] = [
  { id: 'ev-person-a', kind: 'person', label: 'Person A', source: 'placeholder' },
  { id: 'ev-person-b', kind: 'person', label: 'Person B', source: 'placeholder' },
  { id: 'ev-person-c', kind: 'person', label: 'Person C', source: 'placeholder' },
  { id: 'ev-place-1', kind: 'place', label: 'Place 1', source: 'placeholder' },
  { id: 'ev-place-2', kind: 'place', label: 'Place 2', source: 'placeholder' },
  { id: 'ev-event-1', kind: 'event', label: 'Event 1', source: 'placeholder' },
  { id: 'ev-date-1', kind: 'date', label: 'Date 1', source: 'placeholder' },
  { id: 'ev-memory-1', kind: 'memory', label: 'Memory 1', source: 'placeholder' },
];

const PLACEHOLDER_FRAGMENTS: MuseumFragment[] = [
  { id: 'fr-1', text: 'I remember you had…', attribution: 'Contributor A', source: 'placeholder' },
  { id: 'fr-2', text: 'We were standing…', attribution: 'Contributor B', source: 'placeholder' },
  { id: 'fr-3', text: 'You probably don’t remember this…', attribution: 'Contributor C', source: 'placeholder' },
];

export const placeholderArchiveAdapter: MuseumArchiveAdapter = {
  async load() {
    return {
      source: 'placeholder',
      counters: PLACEHOLDER_COUNTERS,
      evidence: PLACEHOLDER_EVIDENCE,
      fragments: PLACEHOLDER_FRAGMENTS,
    };
  },
};
