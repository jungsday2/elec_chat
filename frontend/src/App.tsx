
import React, { useState } from 'react'
import Chat from './components/Chat'
import DocumentQA from './components/DocumentQA'
import Calculators from './components/Calculators'
import CircuitProblem from './components/CircuitProblem'
import './styles.css'

type Tab = 'chat' | 'rag' | 'calc' | 'circuit'

export default function App() {
  const [tab, setTab] = useState<Tab>('chat')

  return (
    <div className="container">
      <header className="header">
        <h1>🔌 전기릿</h1>
        <p>전기·전자 종합 어시스턴트 (웹/앱)</p>
      </header>

      <nav className="tabs">
        <button className={tab==='chat'?'active':''} onClick={()=>setTab('chat')}>💬 전기 챗봇</button>
        <button className={tab==='rag'?'active':''} onClick={()=>setTab('rag')}>📄 문서 Q&A (RAG)</button>
        <button className={tab==='calc'?'active':''} onClick={()=>setTab('calc')}>🧮 계산기</button>
        <button className={tab==='circuit'?'active':''} onClick={()=>setTab('circuit')}>🔧 회로 문제</button>
      </nav>

      <main className="main">
        {tab==='chat' && <Chat/>}
        {tab==='rag' && <DocumentQA/>}
        {tab==='calc' && <Calculators/>}
        {tab==='circuit' && <CircuitProblem/>}
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} JeongirIt</span>
      </footer>
    </div>
  )
}
