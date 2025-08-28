
import React, { useState } from 'react'
import { documentQA } from '../api'

export default function DocumentQA() {
  const [file, setFile] = useState<File | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState<{page:number|null, source:string}[]>([])

  async function ask() {
    if (!file || !question.trim()) return
    const res = await documentQA(file, question)
    setAnswer(res.answer)
    setSources(res.sources || [])
  }

  return (
    <div className="panel">
      <div className="row">
        <input type="file" accept="application/pdf" onChange={e=>setFile(e.target.files?.[0] || null)} />
        <input type="text" placeholder="질문을 입력하세요" value={question} onChange={e=>setQuestion(e.target.value)} />
        <button className="primary" onClick={ask}>질문하기</button>
      </div>
      {answer && <div className="card"><strong>답변:</strong><div>{answer}</div></div>}
      {sources.length>0 && (
        <div className="card">
          <strong>출처:</strong>
          <ul>
            {sources.map((s, i)=>(
              <li key={i}>page {s.page ?? '?'} — {s.source}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
