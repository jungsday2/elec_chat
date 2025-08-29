import React, { useState, useEffect, useRef } from 'react'
import { chat } from '../api'
import './Chat.css';

type Msg = { role: 'user' | 'assistant', content: string }

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 컴포넌트가 처음 로드될 때 저장된 대화 기록을 불러옵니다.
  useEffect(() => {
    const savedChat = localStorage.getItem('chatHistory');
    if (savedChat) {
      setMessages(JSON.parse(savedChat));
    } else {
      // 저장된 내용이 없으면 초기 메시지를 설정합니다.
      setMessages([
        { role: 'assistant', content: '안녕하세요! 어떻게 도와드릴까요? 전기·공학에 관한 질문이나 다른 주제에 대해 이야기하고 싶으신가요?' }
      ]);
    }
  }, []);

  // 메시지 목록이 업데이트될 때마다 맨 아래로 스크롤합니다.
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  // 입력창 높이를 자동으로 조절합니다.
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  async function send() {
    if (!input.trim() || isLoading) return;
    const next: Msg[] = [...messages, { role: 'user' as const, content: input }];
    setMessages(next);
    setInput('');
    setIsLoading(true);

    const payload = next.map(m => ({ role: m.role, content: m.content }));
    try {
      const res = await chat(payload as any);
      setMessages([...next, { role: 'assistant' as const, content: res.output }]);
    } catch (e: any) {
      setMessages([...next, { role: 'assistant' as const, content: '서버 오류가 발생했습니다. OPENAI_API_KEY가 설정되었는지 확인하세요.' }]);
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

  // 대화 내용을 로컬 스토리지에 저장합니다.
  const saveChat = () => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
    alert('대화 내용이 저장되었습니다.');
  };

  // 새 대화를 시작하고 저장된 기록도 삭제합니다.
  const startNewChat = () => {
    localStorage.removeItem('chatHistory');
    setMessages([
      { role: 'assistant', content: '안녕하세요! 어떻게 도와드릴까요? 전기·공학에 관한 질문이나 다른 주제에 대해 이야기하고 싶으신가요?' }
    ]);
    setInput('');
  };

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
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="전기공학 질문을 입력하세요..."
          disabled={isLoading}
          rows={1}
        />
        <div className="example-queries">
          <span>예시 질문</span>
          <button onClick={() => handleExampleClick('ESS 산업 현황에 대해 알려줘')}>ESS 산업 현황에 대해 알려줘</button>
          <button onClick={() => handleExampleClick('BESS 시장 트렌드 핵심 포인트')}>BESS 시장 트렌드 핵심 포인트</button>
          <button onClick={() => handleExampleClick('EV 충전 인프라 최근 이슈 정리')}>EV 충전 인프라 최근 이슈 정리</button>
        </div>
        <div className="chat-actions">
          <button className="action-btn" onClick={saveChat}>대화 저장</button>
          <button className="action-btn" onClick={startNewChat}>새로운 대화 시작</button>
        </div>
      </div>
    </div>
  );
}
