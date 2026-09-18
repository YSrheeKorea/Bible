import { useState } from 'react'
import BibleReader from './pages/BibleReader'
import QTBoard from './pages/QTBoard'
import HighlightsBoard from './pages/HighlightsBoard'

function App() {
  const [activeTab, setActiveTab] = useState<'reader' | 'journal' | 'highlights'>('reader')
  const [bibleVersion, setBibleVersion] = useState<'kor' | 'kjv' | 'asv'>('kor');

  return (
    <div className="bg-surface font-body-ui text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-fixed min-h-screen flex flex-col justify-between">
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/80 backdrop-blur-md transition-all duration-300 border-b border-surface-variant/30">
        <div className="h-16 lg:h-20 w-full px-margin-mobile lg:px-margin flex items-center justify-between">
          <div className="flex items-center gap-space-lg">
            <a
              className="group flex items-center gap-space-sm focus:outline-none cursor-pointer"
              onClick={() => setActiveTab('reader')}
            >
              <span className="font-headline-sm text-headline-sm tracking-widest text-on-surface uppercase select-none opacity-90 group-hover:opacity-100 transition-opacity">My Scripture</span>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary opacity-60"></span>
            </a>
            <nav className="hidden md:flex items-center gap-space-md">
              <a
                className={`font-label-md transition-colors cursor-pointer ${activeTab === 'reader' ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
                onClick={() => setActiveTab('reader')}
              >
                Reader
              </a>
              <a
                className={`font-label-md transition-colors cursor-pointer ${activeTab === 'journal' ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
                onClick={() => setActiveTab('journal')}
              >
                Journal
              </a>
              <a
                className={`font-label-md transition-colors cursor-pointer ${activeTab === 'highlights' ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
                onClick={() => setActiveTab('highlights')}
              >
                Highlights
              </a>
            </nav>
          </div>
          
          <div className="flex items-center gap-space-md">
            {/* Version Selector */}
            <select 
              value={bibleVersion} 
              onChange={(e) => setBibleVersion(e.target.value as any)}
              className="bg-transparent text-sm font-label-md text-on-surface-variant hover:text-on-surface focus:outline-none cursor-pointer"
            >
              <option value="kor">개역한글</option>
              <option value="kjv">KJV (영어)</option>
              <option value="asv">ASV (영어)</option>
            </select>
          </div>
        </div>
      </header>

      <main className="w-full pt-16 lg:pt-20 pb-16 md:pb-0 flex-1 bg-surface">
        <div className="flex flex-col w-full">
          <div className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin py-space-md lg:py-space-xl">
            {activeTab === 'reader' && <BibleReader version={bibleVersion} />}
            {activeTab === 'journal' && <QTBoard version={bibleVersion} />}
            {activeTab === 'highlights' && <HighlightsBoard version={bibleVersion} />}
          </div>
        </div>
      </main>

      <footer className="w-full py-4 pb-20 md:pb-4 text-center border-t border-surface-variant/30 mt-10 px-4">
        <p className="text-[10px] text-on-surface-variant/60 font-sans tracking-wide">
          본 어플리케이션에 사용된 한국어 성경 텍스트는 대한성서공회에서 발행한 ‘성경전서 개역한글판(1961년 판본)’을 사용하였으며, 영어 성경은 퍼블릭 도메인인 KJV와 ASV를 사용하였습니다. 본 판본들은 저작재산권 보호기간이 만료된 공공 저작물입니다.
        </p>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-surface-variant/30 flex justify-around items-center h-16 px-4 z-50 pb-safe">
        <button onClick={() => setActiveTab('reader')} className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'reader' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined text-2xl">{activeTab === 'reader' ? 'menu_book' : 'book'}</span>
          <span className="text-[10px] mt-1 font-medium">Reader</span>
        </button>
        <button onClick={() => setActiveTab('journal')} className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'journal' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined text-2xl">{activeTab === 'journal' ? 'edit_document' : 'edit'}</span>
          <span className="text-[10px] mt-1 font-medium">Journal</span>
        </button>
        <button onClick={() => setActiveTab('highlights')} className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'highlights' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined text-2xl">{activeTab === 'highlights' ? 'bookmark' : 'bookmark_border'}</span>
          <span className="text-[10px] mt-1 font-medium">Highlights</span>
        </button>
      </nav>
    </div>
  )
}

export default App
