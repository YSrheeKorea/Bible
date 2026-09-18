import { useState, useEffect } from 'react'
import { useBible } from '../hooks/useBible'

export default function HighlightsBoard({ version }: { version: string }) {
  const { bible, loading } = useBible(version);
  const [highlights, setHighlights] = useState<string[]>([]);
  
  // 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bible_highlights');
      if (saved) {
        setHighlights(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load highlights");
    }
  }, []);

  const removeHighlight = (key: string) => {
    const updated = highlights.filter(h => h !== key);
    setHighlights(updated);
    localStorage.setItem('bible_highlights', JSON.stringify(updated));
  };

  if (loading || !bible) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="w-8 h-8 text-secondary animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" strokeDasharray="4 4" strokeWidth="2"></circle>
        </svg>
      </div>
    );
  }

  // Parse highlights and get text
  const parsedHighlights = highlights.map(key => {
    const [bookAbbr, chapter, verse] = key.split('-');
    const bookData = bible.data[bookAbbr];
    const text = bookData?.chapters?.[chapter]?.[verse];
    return {
      key,
      bookAbbr,
      bookName: bookData?.name || bookAbbr,
      chapter,
      verse,
      text: text || "말씀을 불러올 수 없습니다."
    };
  }).sort((a, b) => {
    // Sort by book order, then chapter, then verse (approximate)
    if (a.bookAbbr !== b.bookAbbr) return a.bookAbbr.localeCompare(b.bookAbbr);
    if (a.chapter !== b.chapter) return parseInt(a.chapter) - parseInt(b.chapter);
    return parseInt(a.verse) - parseInt(b.verse);
  });

  return (
    <div className="flex flex-col space-y-space-xl max-w-4xl mx-auto">
      <header className="flex flex-col space-y-space-md border-b border-surface-variant pb-space-lg">
        <h1 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg text-on-surface">
          나의 하이라이트
        </h1>
        <p className="font-body-reading text-on-surface-variant">
          말씀 읽기 탭에서 형광펜으로 칠해둔 은혜로운 구절들을 한곳에서 모아봅니다.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
        {parsedHighlights.length === 0 ? (
          <div className="col-span-1 md:col-span-2 py-10 text-center">
            <p className="text-on-surface-variant/50 italic mb-4">아직 칠해진 형광펜이 없습니다.</p>
            <p className="font-label-sm text-secondary/70">말씀 읽기(Reader) 화면에서 인상 깊은 구절을 클릭해보세요.</p>
          </div>
        ) : (
          parsedHighlights.map(item => (
            <article 
              key={item.key} 
              className="bg-surface-container-high rounded-lg p-space-lg shadow-sm border border-surface-variant/50 flex flex-col justify-between group hover:border-secondary/30 transition-colors"
            >
              <div>
                <div className="flex items-center gap-space-sm mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  <span className="font-label-md font-medium text-secondary">
                    {item.bookName} {item.chapter}:{item.verse}
                  </span>
                </div>
                <p className="font-body-reading text-body-reading leading-loose text-on-surface">
                  {item.text}
                </p>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => removeHighlight(item.key)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none"
                  title="형광펜 지우기"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
