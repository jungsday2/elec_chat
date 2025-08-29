import React, { useState, useEffect, useRef } from 'react'
import { chat } from '../api'
import './Chat.css';

type Msg = { role: 'user' | 'assistant', content: string }

const INITIAL_SUGGESTIONS = [
    'ESS 산업 현황에 대해 알려줘',
    'BESS 시장 트렌드 핵심 포인트',
    'EV 충전 인프라 최근 이슈 정리'
];

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(INITIAL_SUGGESTIONS);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const savedChat = localStorage.getItem('chatHistory');
    if (savedChat) {
      setMessages(JSON.parse(savedChat));
    } else {
      setMessages([
        { role: 'assistant', content: '안녕하세요! 어떻게 도와드릴까요? 전기·공학에 관한 질문이나 다른 주제에 대해 이야기하고 싶으신가요?' }
      ]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  async function send(messageContent: string) {
    if (!messageContent.trim() || isLoading) return;
    
    const next: Msg[] = [...messages, { role: 'user' as const, content: messageContent }];
    setMessages(next);
    setInput('');
    setIsLoading(true);

    const payload = next.map(m => ({ role: m.role, content: m.content }));
    try {
      const res = await chat(payload as any);
      setMessages([...next, { role: 'assistant' as const, content: res.output }]);
      // 추천 질문이 있을 경우에만 업데이트
      if(res.suggestions && res.suggestions.length > 0) {
        setSuggestions(res.suggestions);
      }
    } catch (e: any) {
      setMessages([...next, { role: 'assistant' as const, content: '서버 오류가 발생했습니다. OPENAI_API_KEY가 설정되었는지 확인하세요.' }]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSendClick = () => {
    send(input);
  }

  const handleSuggestionClick = (suggestion: string) => {
    // 추천 질문을 바로 전송
    send(suggestion);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const startNewChat = () => {
    localStorage.removeItem('chatHistory');
    setMessages([
      { role: 'assistant', content: '안녕하세요! 어떻게 도와드릴까요? 전기·공학에 관한 질문이나 다른 주제에 대해 이야기하고 싶으신가요?' }
    ]);
    setInput('');
    setSuggestions(INITIAL_SUGGESTIONS);
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
      <div className="chat-input-section">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendClick();
              }
            }}
            placeholder="전기공학 질문을 입력하세요..."
            disabled={isLoading}
            rows={1}
          />
          <button className="send-btn" onClick={handleSendClick} disabled={isLoading}>전송</button>
        </div>
        <div className="input-footer">
            <div className="example-queries">
              <span>추천 질문</span>
              {suggestions.map((q, i) => (
                <button key={i} onClick={() => handleSuggestionClick(q)}>{q}</button>
              ))}
            </div>
            <button className="new-chat-btn" onClick={startNewChat}>새로운 대화 시작</button>
        </div>
      </div>
    </div>
  );
}
