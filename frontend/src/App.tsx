import React, { useState } from 'react'
import Chat from './components/Chat'
import DocumentQA from './components/DocumentQA'
import Calculators from './components/Calculators'
import CircuitProblem from './components/CircuitProblem'
import './styles.css'

type Tab = 'chat' | 'rag' | 'calc' | 'circuit' | 'units'

export default function App() {
  const [tab, setTab] = useState<Tab>('chat')

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>⚡️ 전기·전자 종합 어시스턴트</h1>
        <p>요약, 계산, 대화, 문서 분석까지 하나의 툴에서 해결하세요.</p>
      </header>

      <nav className="app-nav">
        <button className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>💬 전기 챗봇</button>
        <button className={tab === 'rag' ? 'active' : ''} onClick={() => setTab('rag')}>📄 문서 Q&A (RAG)</button>
        <button className={tab === 'calc' ? 'active' : ''} onClick={() => setTab('calc')}>🧮 계산기</button>
        <button className={tab === 'circuit' ? 'active' : ''} onClick={() => setTab('circuit')}>🔧 회로 문제</button>
        <button className={tab === 'units' ? 'active' : ''} onClick={() => setTab('units')}>📚 단위 및 기호</button>
      </nav>

      <main className="main-content">
        {tab === 'chat' && <Chat />}
        {tab === 'rag' && <DocumentQA />}
        {tab === 'calc' && <Calculators />}
        {tab === 'circuit' && <CircuitProblem />}
        {tab === 'units' && <div>단위 및 기호 컨텐츠</div>}
      </main>
    </div>
  )
}
