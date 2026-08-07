import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { diagnosticTests, type DiagnosticTest } from '@/features/diagnostics/data/tests';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const popularSuggestions = ['CBC', 'HbA1c', 'Lipid Profile', 'Thyroid Profile', 'Liver Function Test', 'Kidney Function Test', 'Vitamin D', 'Urine Test'];

export function TestSearch() {
  const [query, setQuery] = useState('');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  const filteredTests = useMemo(() => {
    let results: DiagnosticTest[] = diagnosticTests;

    if (activeLetter) {
      results = results.filter((t) => t.name.toUpperCase().startsWith(activeLetter));
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q),
      );
    }

    return results;
  }, [query, activeLetter]);

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setActiveLetter(null);
  };

  const handleLetterClick = (letter: string) => {
    setActiveLetter(activeLetter === letter ? null : letter);
    setQuery('');
  };

  return (
    <section id="test-search" className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
          {/* Left - Info & Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
              Find the <span className="text-secondary">Right Test</span>
            </h2>
            <p className="mt-4 text-base text-muted leading-relaxed max-w-md">
              Search our diagnostic tests, screenings, and health packages. Use the alphabet filter or type a test name to find exactly what you need.
            </p>

            {/* Popular suggestions */}
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
                Popular searches
              </p>
              <div className="flex flex-wrap gap-2">
                {popularSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSuggestionClick(s)}
                    className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-foreground hover:border-secondary hover:text-secondary transition-colors cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right - Search & Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Alphabet Filter */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-muted mb-2">Filter by first letter</p>
              <div className="flex flex-wrap gap-1">
                {alphabet.map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => handleLetterClick(letter)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeLetter === letter
                        ? 'bg-secondary text-white shadow-sm'
                        : 'bg-surface text-foreground/70 border border-border hover:border-secondary hover:text-secondary'
                    }`}
                    aria-label={`Filter tests starting with ${letter}`}
                    aria-pressed={activeLetter === letter}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative mb-5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveLetter(null);
                }}
                placeholder="Search diseases & conditions..."
                className="w-full rounded-full border border-border bg-surface py-3 pl-12 pr-4 text-sm text-foreground placeholder:text-muted focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-colors"
                aria-label="Search diagnostic tests"
              />
            </div>

            {/* Results */}
            <div className="rounded-2xl border border-border-light bg-surface max-h-72 overflow-y-auto">
              {filteredTests.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-sm text-muted">
                  No tests found. Try a different search.
                </div>
              ) : (
                <ul role="list" className="divide-y divide-border-light">
                  {filteredTests.map((test) => (
                    <li
                      key={test.id}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-background/60 transition-colors cursor-pointer"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-xs font-bold text-secondary">
                        {test.code.slice(0, 3)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{test.name}</p>
                        <p className="text-xs text-muted">{test.category}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="mt-2 text-xs text-muted text-right">
              {filteredTests.length} test{filteredTests.length !== 1 ? 's' : ''} found
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
