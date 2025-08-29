import React, { useState, useEffect, useRef } from 'react'
import { chat } from '../api'
import ReactMarkdown from 'react-markdown'
import './Chat.css';

// 메시지 타입을 명확하게 정의
type Msg = { 
  role: 'user' | 'assistant', 
  content: string 
}

// 초기 추천 질문 목록
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

  // 컴포넌트가 처음 마운트될 때 로컬 스토리지에서 대화 기록을 불러옴
  useEffect(() => {
    try {
      const savedChat = localStorage.getItem('chatHistory');
      if (savedChat) {
        setMessages(JSON.parse(savedChat));
      } else {
        // 저장된 기록이 없으면 초기 메시지 설정
        setMessages([
          { role: 'assistant', content: '안녕하세요! 어떻게 도와드릴까요? 전기·공학에 관한 질문이나 다른 주제에 대해 이야기하고 싶으신가요?' }
        ]);
      }
    } catch (error) {
      console.error("Failed to parse chat history from localStorage", error);
      // 파싱 오류 발생 시 초기 상태로 리셋
      localStorage.removeItem('chatHistory');
    }
  }, []);

  // 메시지 목록이 변경될 때마다 자동으로 로컬 스토리지에 저장
  useEffect(() => {
    // 메시지가 있을 때만 저장하여 불필요한 저장을 방지
    if (messages.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    }
  }, [messages]);

  // 새 메시지가 추가되면 채팅창을 맨 아래로 스크롤
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);
  
  // 입력 텍스트 길이에 따라 textarea 높이 자동 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // 높이를 초기화
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // 스크롤 높이에 맞게 설정
    }
  }, [input]);

  // 메시지 전송 함수
  const send = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;
    
    // [개선 1] 상태 업데이트의 비동기적 특성을 고려하여, API에 보낼 payload를 현재 messages가 아닌
    // 업데이트될 next 배열을 기준으로 생성
    const userMessage: Msg = { role: 'user' as const, content: messageContent };
    const nextMessages: Msg[] = [...messages, userMessage];
    
    setMessages(nextMessages); // 화면에 사용자 메시지 즉시 표시
    setInput('');
    setIsLoading(true);

    // API에 보낼 메시지 페이로드
    const payload = nextMessages.map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await chat(payload as any);
      const assistantMessage: Msg = { role: 'assistant' as const, content: res.output };
      
      // [개선 2] 서버 응답을 받을 때, 현재 시점의 messages에 추가하는 함수형 업데이트 사용
      // 이는 여러 번의 상태 업데이트 요청이 있을 때 충돌을 방지함
      setMessages(prevMessages => [...prevMessages, assistantMessage]);

      if (res.suggestions && res.suggestions.length > 0) {
        setSuggestions(res.suggestions);
      }
    } catch (e: any) {
      const errorMessage: Msg = { role: 'assistant' as const, content: '서버 오류가 발생했습니다. OPENAI_API_KEY가 설정되었는지 확인하세요.' };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  // 전송 버튼 클릭 핸들러
  const handleSendClick = () => {
    send(input);
  }

  // 추천 질문 클릭 핸들러
  const handleSuggestionClick = (suggestion: string) => {
    // [개선 3] 추천 질문 클릭 시, 입력창에 텍스트를 잠시 보여주는 대신 바로 전송하여
    // 사용자 경험(UX)을 더 직관적으로 만듦
    if (!isLoading) {
      send(suggestion);
    }
  };

  // 클립보드에 텍스트 복사
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(err => console.error('Failed to copy text: ', err));
  };

  // 새로운 대화 시작
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
              <ReactMarkdown>{msg.content}</ReactMarkdown>
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
                <button key={i} onClick={() => handleSuggestionClick(q)} disabled={isLoading}>{q}</button>
              ))}
            </div>
            <button className="new-chat-btn" onClick={startNewChat} disabled={isLoading}>새로운 대화 시작</button>
        </div>
      </div>
    </div>
  );
}
