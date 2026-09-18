import { useState, useEffect } from 'react';

export interface BibleData {
  books: { abbr: string; name: string }[];
  data: {
    [abbr: string]: {
      name: string;
      chapters: {
        [chapter: string]: {
          [verse: string]: string;
        }
      }
    }
  }
}

const cache: Record<string, BibleData> = {};

export function useBible(version: string) {
  const [bible, setBible] = useState<BibleData | null>(cache[version] || null);
  const [loading, setLoading] = useState(!cache[version]);
  
  useEffect(() => {
    if (cache[version]) {
      setBible(cache[version]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/data/bible_${version}.json`)
      .then(r => r.json())
      .then(data => {
        cache[version] = data;
        setBible(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load bible", err);
        setLoading(false);
      });
  }, [version]);
  
  return { bible, loading };
}
