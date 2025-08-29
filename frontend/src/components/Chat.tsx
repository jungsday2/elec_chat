import React, { useState, useEffect, useRef } from 'react'
import { chat } from '../api'
import './Chat.css'; // 새로운 CSS 파일 임포트

type Msg = { role: 'user' | 'assistant', content: string }

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: '안녕하세요! 어떻게 도와드릴까요? 전기·공학에 관한 질문이나 다른 주제에 대해 이야기하고 싶으신가요?' }
  ]);
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  async function send() {
    if (!input.trim()) return
    const next: Msg[] = [...messages, { role: 'user' as const, content: input }]
    setMessages(next)
    setInput('')
    setIsLoading(true);

    const payload = next.map(m => ({ role: m.role, content: m.content }))
    try {
      const res = await chat(payload as any)
      setMessages([...next, { role: 'assistant' as const, content: res.output }])
    } catch (e: any) {
      setMessages([...next, { role: 'assistant' as const, content: '서버 오류가 발생했습니다. OPENAI_API_KEY가 설정되었는지 확인하세요.' }])
    } finally {
        setIsLoading(false);
    }
  }

  const handleExampleClick = (query: string) => {
    setInput(query);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const startNewChat = () => {
    setMessages([
        { role: 'assistant', content: '안녕하세요! 어떻게 도와드릴까요? 전기·공학에 관한 질문이나 다른 주제에 대해 이야기하고 싶으신가요?' }
    ]);
    setInput('');
  }

  return (
    <div className="chat-container">
      <p className="chat-description">전기공학 질문을 답해주는 챗봇입니다.</p>
      <div className="chat-window" ref={chatWindowRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`message-wrapper ${msg.role}`}>
            {msg.role === 'assistant' && <div className="avatar">🤖</div>}
            <div className="message-content">
              <p>{msg.content}</p>
              <button className="copy-btn" onClick={() => handleCopyToClipboard(msg.content)}>
                📋
              </button>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message-wrapper assistant">
            <div className="avatar">🤖</div>
            <div className="message-content">
              <p><i>생각 중...</i></p>
            </div>
          </div>
        )}
      </div>
      <div className="chat-input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && send()}
          placeholder="아래 예시를 클릭하거나 직접 질문을 입력하세요..."
          disabled={isLoading}
        />
        <div className="example-queries">
          <span>예시 질문</span>
          <button onClick={() => handleExampleClick('한국 도매 전력시장 가격 구조 요약')}>한국 도매 전력시장 가격 구조 요약</button>
          <button onClick={() => handleExampleClick('BESS 시장 트렌드 핵심 포인트')}>BESS 시장 트렌드 핵심 포인트</button>
          <button onClick={() => handleExampleClick('EV 충전 인프라 최근 이슈 정리')}>EV 충전 인프라 최근 이슈 정리</button>
        </div>
        <button className="new-chat-btn" onClick={startNewChat}>새로운 대화 시작 (기록 삭제)</button>
      </div>
    </div>
  )
}
