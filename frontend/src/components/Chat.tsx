
import React, { useState } from 'react'
import { chat } from '../api'

type Msg = { role: 'user' | 'assistant', content: string }

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')

  async function send() {
    if (!input.trim()) return
    const next: Msg[] = [...messages, { role: 'user' as const, content: input }]
    setMessages(next)
    setInput('')
    const payload = next.map(m => ({ role: m.role, content: m.content }))
    try {
      const res = await chat(payload as any)
      setMessages([...next, { role: 'assistant' as const, content: res.output }])
    } catch (e:any) {
      setMessages([...next, { role: 'assistant' as const, content: '서버 오류가 발생했습니다. OPENAI_API_KEY가 설정되었는지 확인하세요.' }])
    }
  }

  return (
    <div className="panel">
      <div className="messages">
        {messages.map((m, idx) => (
          <div key={idx} className={'msg ' + m.role}>
            <div className="small">{m.role === 'user' ? 'You' : 'JeongirIt'}</div>
            <div>{m.content}</div>
          </div>
        ))}
      </div>

      <div className="row">
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="전기공학 질문을 입력하세요..." />
        <button className="primary" onClick={send}>전송</button>
      </div>
    </div>
  )
}
