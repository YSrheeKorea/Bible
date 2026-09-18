import { useState, useEffect, useRef, useMemo } from 'react'
import { useBible } from '../hooks/useBible'

export default function QTBoard({ version }: { version: string }) {
  const { bible, loading } = useBible(version);
  const [date, setDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  
  // 드롭다운 상태
  const [selBook, setSelBook] = useState<string>('');
  const [selChapter, setSelChapter] = useState<string>('');
  const [selStartVerse, setSelStartVerse] = useState<string>('');
  const [selEndVerse, setSelEndVerse] = useState<string>('');

  const [versesToDisplay, setVersesToDisplay] = useState<{num: string, text: string}[]>([]);
  
  const [keyVerse, setKeyVerse] = useState('');
  const [meditation, setMeditation] = useState('');
  const [application, setApplication] = useState('');

  const [notification, setNotification] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const keyVerseRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (keyVerseRef.current) {
      keyVerseRef.current.style.height = 'auto';
      keyVerseRef.current.style.height = `${keyVerseRef.current.scrollHeight}px`;
    }
  }, [keyVerse]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  // 초기화 및 드롭다운 연동
  useEffect(() => {
    if (bible && !selBook) {
      setSelBook(bible.books[0].abbr);
      setSelChapter('1');
      setSelStartVerse('1');
      setSelEndVerse('1');
    }
  }, [bible]);

  const availableChapters = useMemo(() => {
    if (!bible || !selBook || !bible.data[selBook]) return [];
    return Object.keys(bible.data[selBook].chapters).sort((a,b) => parseInt(a) - parseInt(b));
  }, [bible, selBook]);

  const availableVerses = useMemo(() => {
    if (!bible || !selBook || !selChapter || !bible.data[selBook]?.chapters[selChapter]) return [];
    return Object.keys(bible.data[selBook].chapters[selChapter]).sort((a,b) => parseInt(a) - parseInt(b));
  }, [bible, selBook, selChapter]);

  // Handle Book Change
  const handleBookChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelBook(e.target.value);
    setSelChapter('1');
    setSelStartVerse('1');
    setSelEndVerse('1');
  };

  // Handle Chapter Change
  const handleChapterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelChapter(e.target.value);
    setSelStartVerse('1');
    setSelEndVerse('1');
  };

  // Handle Start Verse Change
  const handleStartVerseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStart = e.target.value;
    setSelStartVerse(newStart);
    if (parseInt(newStart) > parseInt(selEndVerse || '0')) {
      setSelEndVerse(newStart);
    }
  };

  // Computed display logic
  const loadVerses = () => {
    if (!bible || !selBook || !selChapter) return;
    const chapterData = bible.data[selBook].chapters[selChapter];
    if (!chapterData) return;
    
    const extracted: {num: string, text: string}[] = [];
    const start = parseInt(selStartVerse);
    const end = parseInt(selEndVerse);
    
    for (let v = start; v <= end; v++) {
      const vStr = v.toString();
      if (chapterData[vStr]) {
        extracted.push({ num: vStr, text: chapterData[vStr] });
      }
    }
    setVersesToDisplay(extracted);
  };

  const parsedBookInfo = useMemo(() => {
    if (!bible || !selBook) return '';
    const bookName = bible.data[selBook]?.name || '';
    if (selStartVerse === selEndVerse) return `${bookName} ${selChapter}:${selStartVerse}`;
    return `${bookName} ${selChapter}:${selStartVerse}-${selEndVerse}`;
  }, [bible, selBook, selChapter, selStartVerse, selEndVerse]);

  // Load verse manually when parsing old text strings
  const parseLegacyInput = (input: string) => {
    if (!bible) return;
    const match = input.match(/([가-힣a-zA-Z]+)\s*(\d+)\s*:\s*(\d+)\s*[-~]?\s*(\d*)/);
    if (match) {
      let bookAbbr = match[1];
      if (bookAbbr === '창세기') bookAbbr = '창';
      const matchedBook = Object.keys(bible.data).find(k => bible.data[k].name === bookAbbr || k === bookAbbr || bible.data[k].name.startsWith(bookAbbr));
      
      if (matchedBook) {
        setSelBook(matchedBook);
        setSelChapter(match[2]);
        setSelStartVerse(match[3]);
        setSelEndVerse(match[4] || match[3]);
        // Note: loadVerses will be called by effect or user action
        setTimeout(() => loadVerses(), 100);
      }
    }
  };

  // Auto load when selection changes or bible loaded
  useEffect(() => {
    if (!loading && selBook) {
      loadVerses();
    }
  }, [selBook, selChapter, selStartVerse, selEndVerse, loading, version]);

  useEffect(() => {
    const savedData = localStorage.getItem(`qt_${date}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setKeyVerse(parsed.keyVerse || '');
        setMeditation(parsed.meditation || '');
        setApplication(parsed.application || '');
        if (parsed.verseRangeInput && !loading) {
          parseLegacyInput(parsed.verseRangeInput);
        } else if (parsed.selBook && !loading) {
          setSelBook(parsed.selBook);
          setSelChapter(parsed.selChapter);
          setSelStartVerse(parsed.selStartVerse);
          setSelEndVerse(parsed.selEndVerse);
        }
        showNotification('불러옴');
      } catch (e) {
        console.error("Failed to parse saved QT", e);
      }
    } else {
      setKeyVerse('');
      setMeditation('');
      setApplication('');
      setVersesToDisplay([]);
    }
  }, [date, loading]); // Need to re-trigger when loading finishes so bible exists for parsing

  const handleSave = () => {
    const dataToSave = {
      verseRangeInput: parsedBookInfo, // For backwards compatibility
      selBook,
      selChapter,
      selStartVerse,
      selEndVerse,
      keyVerse,
      meditation,
      application
    };
    localStorage.setItem(`qt_${date}`, JSON.stringify(dataToSave));
    showNotification('✅ 로컬 저장 완료');
  };

  const handleExport = () => {
    const dataToSave = { 
      date, 
      verseRangeInput: parsedBookInfo,
      selBook, selChapter, selStartVerse, selEndVerse,
      keyVerse, meditation, application 
    };
    const dataStr = JSON.stringify(dataToSave, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `qt_data_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('다운로드 됨');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (event.target?.result) {
          const parsed = JSON.parse(event.target.result as string);
          if (parsed.date) setDate(parsed.date);
          setKeyVerse(parsed.keyVerse || '');
          setMeditation(parsed.meditation || '');
          setApplication(parsed.application || '');
          if (parsed.selBook) {
            setSelBook(parsed.selBook);
            setSelChapter(parsed.selChapter);
            setSelStartVerse(parsed.selStartVerse);
            setSelEndVerse(parsed.selEndVerse);
          } else if (parsed.verseRangeInput) {
            parseLegacyInput(parsed.verseRangeInput);
          }
          showNotification('파일 불러옴');
        }
      } catch (err) {
        alert('파일을 읽는데 실패했습니다. 올바른 QT JSON 파일인지 확인하세요.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const selectVerse = (verseText: string) => {
    setKeyVerse(prev => {
      if (prev.includes(verseText)) {
        // Remove it if it exists
        return prev.split('\n')
          .filter(line => line.trim() !== verseText)
          .join('\n');
      } else {
        // Append it
        return prev ? `${prev}\n${verseText}` : verseText;
      }
    });
  };

  const copyToClipboard = () => {
    const formatted = `
[ ${date} QT ]
📖 오늘 주신 말씀: ${parsedBookInfo}
${versesToDisplay.length > 0 ? '\\n' + versesToDisplay.map(v => `${v.num}. ${v.text}`).join('\\n') : ''}

⭐ 요절
${keyVerse}

🙏 묵상
${meditation}

🌱 적용하기
${application}
`.trim();

    navigator.clipboard.writeText(formatted).then(() => {
      showNotification('클립보드 복사 완료');
    }).catch(err => {
      console.error('Failed to copy: ', err);
      showNotification('복사 실패');
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl relative">
      <section className="lg:col-span-7 flex flex-col space-y-space-xl">
        <header className="flex flex-col space-y-space-md border-b border-surface-variant pb-space-lg">
          <div className="flex flex-col justify-between gap-space-md">
            <div>
              <h1 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg text-on-surface mb-2">
                {parsedBookInfo || '말씀을 선택하세요'}
              </h1>
              {/* Dropdown Pickers */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {/* Book */}
                <div className="relative">
                  <select 
                    value={selBook} 
                    onChange={handleBookChange}
                    className="appearance-none bg-surface-container-high text-on-surface font-label-sm text-sm px-4 py-2 pr-8 rounded-md border border-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                  >
                    {bible?.books.map(b => (
                      <option key={b.abbr} value={b.abbr}>{b.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-2 text-[20px] text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
                
                {/* Chapter */}
                <div className="relative">
                  <select 
                    value={selChapter} 
                    onChange={handleChapterChange}
                    className="appearance-none bg-surface-container-high text-on-surface font-label-sm text-sm px-4 py-2 pr-8 rounded-md border border-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                  >
                    {availableChapters.map(c => (
                      <option key={c} value={c}>{c}장</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-2 text-[20px] text-on-surface-variant pointer-events-none">expand_more</span>
                </div>

                {/* Start Verse */}
                <div className="relative">
                  <select 
                    value={selStartVerse} 
                    onChange={handleStartVerseChange}
                    className="appearance-none bg-surface-container-high text-on-surface font-label-sm text-sm px-4 py-2 pr-8 rounded-md border border-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                  >
                    {availableVerses.map(v => (
                      <option key={`start-${v}`} value={v}>{v}절</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-2 text-[20px] text-on-surface-variant pointer-events-none">expand_more</span>
                </div>

                <span className="text-on-surface-variant/50">~</span>

                {/* End Verse */}
                <div className="relative">
                  <select 
                    value={selEndVerse} 
                    onChange={(e) => setSelEndVerse(e.target.value)}
                    className="appearance-none bg-surface-container-high text-on-surface font-label-sm text-sm px-4 py-2 pr-8 rounded-md border border-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                  >
                    {availableVerses.filter(v => parseInt(v) >= parseInt(selStartVerse || '0')).map(v => (
                      <option key={`end-${v}`} value={v}>{v}절</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-2 text-[20px] text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <article className="font-body-reading text-body-reading-mobile lg:text-body-reading text-on-surface leading-loose space-y-space-md relative min-h-[200px]">
          {loading && (
             <div className="absolute inset-0 flex items-center justify-center bg-surface/50 rounded">
               <svg className="w-8 h-8 text-secondary animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <circle cx="12" cy="12" r="9" strokeDasharray="4 4" strokeWidth="2"></circle>
               </svg>
             </div>
          )}
          {!loading && versesToDisplay.map((v) => {
            const verseText = `${v.num}. ${v.text}`;
            const isSelected = keyVerse.includes(verseText);
            return (
              <p 
                key={v.num}
                className={`group relative cursor-pointer pl-6 transition-all duration-300 rounded-sm ${
                  isSelected 
                    ? 'bg-secondary-container/40 text-on-secondary-container font-medium' 
                    : 'hover:bg-secondary-container/20'
                }`}
                onClick={() => selectVerse(verseText)}
                title={isSelected ? "요절에서 제거" : "요절로 선택"}
              >
                <sup className={`font-verse-number text-verse-number select-none mr-2 font-normal ${isSelected ? 'text-secondary' : 'text-on-surface-variant'}`}>
                  {v.num}
                </sup>
                <span>{v.text}</span>
              </p>
            );
          })}
          {!loading && versesToDisplay.length === 0 && (
            <p className="text-on-surface-variant/50 italic text-center py-10">범위를 선택하면 말씀이 표시됩니다.</p>
          )}
        </article>
      </section>

      <aside aria-label="Meditation Studio" className="lg:col-span-5 flex flex-col space-y-space-lg lg:pl-space-md lg:sticky lg:top-24">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-space-xs border-b border-surface-variant/30 pb-4">
          <div className="flex items-center gap-space-sm">
            <svg className="w-5 h-5 text-secondary animate-spin" fill="none" stroke="currentColor" style={{ animationDuration: '9s' }} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" strokeDasharray="4 4" strokeWidth="1.5"></circle>
              <circle cx="12" cy="12" fill="currentColor" r="3"></circle>
            </svg>
            <span className="font-label-sm text-label-sm tracking-widest uppercase text-on-surface-variant">QT 노트</span>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              className="font-label-sm text-label-sm text-secondary bg-transparent outline-none cursor-pointer ml-2"
            />
          </div>
          
          <div className="flex gap-2 items-center">
             <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />
             <button onClick={handleSave} className="h-8 px-3 text-xs font-bold bg-secondary text-on-secondary hover:bg-opacity-90 transition rounded shadow-sm flex items-center gap-1" title="로컬 저장 (브라우저)">
               <span className="material-symbols-outlined text-[16px]">save</span> 저장
             </button>
             <button onClick={() => fileInputRef.current?.click()} className="h-8 px-3 text-xs font-bold bg-surface text-secondary border border-outline-variant hover:bg-surface-container transition rounded shadow-sm flex items-center gap-1" title="JSON 파일 불러오기">
               <span className="material-symbols-outlined text-[16px]">upload_file</span>
             </button>
             <button onClick={handleExport} className="h-8 px-3 text-xs font-bold bg-surface text-secondary border border-outline-variant hover:bg-surface-container transition rounded shadow-sm flex items-center gap-1" title="JSON 파일 내보내기">
               <span className="material-symbols-outlined text-[16px]">download</span>
             </button>
          </div>
        </div>

        <div className="flex flex-col space-y-space-xs">
          <div className="flex items-center justify-between">
            <label className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant" htmlFor="keyVerseInput">
              요절 (Focus Verse)
            </label>
            <span className="font-label-sm text-label-sm text-secondary opacity-80 select-none">
              좌측 말씀을 탭하세요
            </span>
          </div>
          <div className="py-space-xs border-b border-surface-variant/30">
            <textarea
              ref={keyVerseRef}
              id="keyVerseInput"
              className="w-full bg-transparent font-headline-sm text-headline-sm text-on-surface font-normal italic resize-none focus:outline-none placeholder:text-on-surface-variant/40 leading-relaxed overflow-hidden"
              value={keyVerse}
              onChange={e => setKeyVerse(e.target.value)}
              placeholder="본문을 탭하거나 요절을 입력하세요..."
            ></textarea>
          </div>
        </div>

        <div className="flex flex-col space-y-space-xs">
          <div className="flex items-center justify-between">
            <label className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
              묵상 (Meditation)
            </label>
          </div>
          <div className="relative w-full border-b border-surface-variant/30 pb-2">
            <textarea
              className="w-full bg-transparent font-body-reading text-body-reading text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none resize-none leading-loose"
              rows={4}
              value={meditation}
              onChange={e => setMeditation(e.target.value)}
              placeholder="오늘의 말씀을 통해 깨달은 바를 적어보세요..."
            ></textarea>
          </div>
        </div>

        <div className="flex flex-col space-y-space-xs flex-1">
          <div className="flex items-center justify-between">
            <label className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
              적용하기 (Application)
            </label>
          </div>
          <div className="relative w-full">
            <textarea
              className="w-full bg-transparent font-body-reading text-body-reading text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none resize-none leading-loose"
              rows={3}
              value={application}
              onChange={e => setApplication(e.target.value)}
              placeholder="삶에 어떻게 적용할지 구체적으로 적어보세요..."
            ></textarea>
          </div>
        </div>

      </aside>

      <div className="fixed bottom-8 right-8 z-40 flex items-center gap-3">
        <div className={`transition-opacity duration-300 font-label-sm text-label-sm tracking-wider uppercase bg-surface-container text-on-surface px-space-sm py-1 rounded-sm ${notification ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {notification}
        </div>
        <button 
          aria-label="Copy verse and meditation"
          className="w-12 h-12 rounded-full bg-on-surface text-surface flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-secondary"
          onClick={copyToClipboard}
          title="공유 양식 복사"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">content_copy</span>
        </button>
      </div>
    </div>
  )
}
