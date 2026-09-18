import { useState, useMemo, useEffect } from 'react'
import { useBible } from '../hooks/useBible'

const fontSizes = [
  'text-sm leading-relaxed',
  'text-base leading-relaxed',
  'text-lg leading-loose',
  'text-xl leading-loose',
  'text-2xl leading-loose',
  'text-3xl leading-[2.5]'
];

const fontOptions = [
  { label: '명조체 (Newsreader)', value: 'font-body-reading', style: {} },
  { label: '고딕체 (Inter)', value: 'font-body-ui', style: {} },
  { label: '나눔명조', value: 'custom', style: { fontFamily: "'Nanum Myeongjo', serif" } },
  { label: '본고딕 (Noto Sans)', value: 'custom', style: { fontFamily: "'Noto Sans KR', sans-serif" } },
  { label: '본명조 (Noto Serif)', value: 'custom', style: { fontFamily: "'Noto Serif KR', serif" } },
];

export default function BibleReader({ version }: { version: string }) {
  const { bible, loading } = useBible(version);
  const [selectedBook, setSelectedBook] = useState<string>('창')
  const [selectedChapter, setSelectedChapter] = useState<string>('1')
  
  // 폰트 설정
  const [fontChoice, setFontChoice] = useState(0);
  const [fontSizeIndex, setFontSizeIndex] = useState(2); // text-lg by default

  // 형광펜 상태 (Key format: "창-1-1")
  const [highlights, setHighlights] = useState<Set<string>>(new Set());

  // 초기화 및 로컬스토리지 로드
  useEffect(() => {
    if (bible && !bible.data[selectedBook]) {
      setSelectedBook(bible.books[0].abbr);
      setSelectedChapter('1');
    }
    
    // 형광펜 데이터 불러오기
    try {
      const saved = localStorage.getItem('bible_highlights');
      if (saved) {
        setHighlights(new Set(JSON.parse(saved)));
      }
    } catch (e) {
      console.error("Failed to load highlights");
    }
  }, [bible, selectedBook]);

  // 형광펜 토글 함수
  const toggleHighlight = (book: string, chapter: string, verse: string) => {
    const key = `${book}-${chapter}-${verse}`;
    setHighlights(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      localStorage.setItem('bible_highlights', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const chapters = useMemo(() => {
    if (!bible || !bible.data[selectedBook]) return [];
    return Object.keys(bible.data[selectedBook].chapters).sort((a, b) => parseInt(a) - parseInt(b))
  }, [bible, selectedBook])

  const verses = useMemo(() => {
    if (!bible || !bible.data[selectedBook] || !bible.data[selectedBook].chapters[selectedChapter]) return [];
    return Object.entries(bible.data[selectedBook].chapters[selectedChapter]).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
  }, [bible, selectedBook, selectedChapter])

  if (loading || !bible) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="w-8 h-8 text-secondary animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" strokeDasharray="4 4" strokeWidth="2"></circle>
        </svg>
      </div>
    );
  }

  const currentFont = fontOptions[fontChoice];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
      {/* Left Sidebar: Navigation */}
      <aside className="lg:col-span-3 flex flex-col space-y-space-md lg:sticky lg:top-24 h-auto lg:max-h-[calc(100vh-8rem)] pr-2">
        <h3 className="hidden lg:block font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant mb-4">
          Books
        </h3>
        
        {/* Mobile Dropdown */}
        <div className="lg:hidden mb-4 relative">
          <select 
            value={selectedBook}
            onChange={(e) => {
              setSelectedBook(e.target.value);
              setSelectedChapter('1');
            }}
            className="w-full appearance-none bg-surface-container-high text-on-surface font-body-ui text-body-ui px-4 py-3 rounded-md border border-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
          >
            {bible.books.map(book => (
              <option key={book.abbr} value={book.abbr}>{book.name}</option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-3 text-[24px] text-on-surface-variant pointer-events-none">expand_more</span>
        </div>

        {/* Desktop Sidebar List */}
        <div className="hidden lg:flex flex-col space-y-1 overflow-y-auto pb-8">
          {bible.books.map(book => (
            <button
              key={book.abbr}
              onClick={() => {
                setSelectedBook(book.abbr);
                setSelectedChapter('1');
              }}
              className={`text-left px-3 py-2 rounded-md font-body-ui text-body-ui transition-colors ${
                selectedBook === book.abbr 
                  ? 'bg-secondary-container text-on-secondary-container font-medium' 
                  : 'text-on-surface hover:bg-surface-container-high'
              }`}
            >
              {book.name}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content: Reader */}
      <section className="lg:col-span-9 flex flex-col space-y-space-xl">
        <header className="flex flex-col space-y-space-md border-b border-surface-variant pb-space-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg text-on-surface">
              {bible.data[selectedBook]?.name}
            </h1>
            
            {/* Font Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-surface-container-high p-1.5 rounded-full shadow-inner">
                <select 
                  className="bg-transparent text-sm text-on-surface focus:outline-none pl-2 pr-1 cursor-pointer"
                  value={fontChoice}
                  onChange={(e) => setFontChoice(Number(e.target.value))}
                >
                  {fontOptions.map((opt, idx) => (
                    <option key={idx} value={idx}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center bg-surface-container-high p-1 rounded-full shadow-inner">
                <button 
                  onClick={() => setFontSizeIndex(Math.max(0, fontSizeIndex - 1))}
                  className="w-10 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">remove</span>
                </button>
                <div className="w-px h-5 bg-outline-variant/50 mx-0.5"></div>
                <button 
                  onClick={() => setFontSizeIndex(Math.min(fontSizes.length - 1, fontSizeIndex + 1))}
                  className="w-10 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {chapters.map(chapter => (
              <button
                key={chapter}
                onClick={() => setSelectedChapter(chapter)}
                className={`w-10 h-10 flex items-center justify-center rounded-full font-label-md text-label-md transition-colors ${
                  selectedChapter === chapter
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                }`}
              >
                {chapter}
              </button>
            ))}
          </div>
        </header>

        <article 
          className={`${currentFont.value !== 'custom' ? currentFont.value : ''} ${fontSizes[fontSizeIndex]} text-on-surface space-y-space-md max-w-3xl`}
          style={currentFont.style}
        >
          <div className="flex items-center gap-space-md select-none opacity-40 my-8">
              <div className="w-12 h-px bg-on-surface"></div>
              <span className="font-label-sm text-label-sm tracking-widest uppercase font-sans">Chapter {selectedChapter}</span>
              <div className="w-12 h-px bg-on-surface"></div>
          </div>
          
          {verses.map(([verseNum, text]) => {
            const isHighlighted = highlights.has(`${selectedBook}-${selectedChapter}-${verseNum}`);
            return (
              <p 
                key={verseNum} 
                className={`group relative pl-6 cursor-pointer rounded-md transition-all duration-300 ${
                  isHighlighted 
                    ? 'bg-secondary-container/40 text-on-secondary-container' 
                    : 'hover:bg-surface-container/50'
                }`}
                onClick={() => toggleHighlight(selectedBook, selectedChapter, verseNum)}
                title="클립하여 형광펜 칠하기"
              >
                <sup className={`font-verse-number text-verse-number select-none mr-2 font-normal transition-colors ${isHighlighted ? 'text-secondary' : 'text-on-surface-variant'}`}>
                  {verseNum}
                </sup>
                <span className={`${isHighlighted ? 'font-medium' : ''}`}>{text}</span>
              </p>
            );
          })}
        </article>
      </section>
    </div>
  )
}
