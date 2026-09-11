'use client';

import { useState, useMemo } from 'react';

export interface SubmissionsFilterProps {
  submissions: any[];
  onFiltered: (filtered: any[]) => void;
}

export function SubmissionsFilter({ submissions, onFiltered }: SubmissionsFilterProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return submissions;
    const lowerQuery = query.toLowerCase();
    return submissions.filter(item =>
      (item.submitterName || '').toLowerCase().includes(lowerQuery) ||
      (item.memoryPreview || '').toLowerCase().includes(lowerQuery) ||
      (item.eventName || '').toLowerCase().includes(lowerQuery)
    );
  }, [query, submissions]);

  useMemo(() => {
    onFiltered(filtered);
  }, [filtered, onFiltered]);

  return (
    <div className="field" style={{ marginBottom: '24px' }}>
      <label>Search memories, names, events</label>
      <input
        type="text"
        placeholder="Type to search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
}
