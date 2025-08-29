import React, { useState, useRef } from 'react'
import { documentQA } from '../api'
import './DocumentQA.css'; // 새로 생성할 CSS 파일 임포트

type Msg = { role: 'user' | 'assistant', content: string, sources?: {page:number|null, source:string}[] }

export default function DocumentQA() {
  // --- State Hooks ---
  const [file, setFile] = useState<File | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [question, setQuestion] = useState('')
  const [status, setStatus] = useState('PDF 파일을 업로드하고 질문을 시작하세요.')
  const [isLoading, setIsLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Handlers ---
  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setStatus(`'${selectedFile.name}' 문서가 준비되었습니다.`)
      setMessages([]) // 새 파일이므로 메시지 초기화
    } else {
      alert('PDF 파일만 업로드할 수 있습니다.');
    }
  }

  const handleAskQuestion = async () => {
    if (!file || !question.trim() || isLoading) return

    const userMessage: Msg = { role: 'user', content: question }
    setMessages(prev => [...prev, userMessage])
    setQuestion('')
    setIsLoading(true)
    setStatus('답변을 생성하는 중입니다...')

    try {
      // API는 파일과 현재 질문만 받음 (백엔드가 대화기록을 관리하지 않음)
      const res = await documentQA(file, question)
      const assistantMessage: Msg = { role: 'assistant', content: res.answer, sources: res.sources || [] }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Msg = { role: 'assistant', content: '오류가 발생했습니다. 다시 시도해주세요.' }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setStatus(`'${file.name}' 문서에 대해 추가 질문을 할 수 있습니다.`)
    }
  }

  // --- Drag and Drop Logic ---
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  // --- Render ---
  if (!file) {
    return (
      <div 
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="upload-icon">⇧</div>
        <h2>파일을 여기에 드롭</h2>
        <p>- 또는 -</p>
        <p className="upload-link">클릭하여 업로드</p>
        <input
          type="file"
          ref={fileInputRef}
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={e => handleFileChange(e.target.files?.[0] || null)}
        />
      </div>
    );
  }

  return (
    <div className="qa-container">
      {/* Left Column */}
      <div className="file-info-panel">
        <h4>📄 업로드된 문서</h4>
        <div className="file-card">
          <div className="file-name">{file.name}</div>
          <div className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
        </div>
        <h4>💡 처리 상태</h4>
        <p className="status-message">{status}</p>
        <button className="reset-btn" onClick={() => setFile(null)}>다른 파일 업로드</button>
      </div>

      {/* Right Column */}
      <div className="doc-chat-panel">
        <h4>문서 Q&A</h4>
        <div className="doc-chat-window">
            {messages.length === 0 && <div className="chat-placeholder">문서 내용에 대한 질문을 입력하세요.</div>}
            {messages.map((msg, index) => (
                <div key={index} className={`doc-message ${msg.role}`}>
                    <div className="doc-message-content">
                        <p>{msg.content}</p>
                        {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                            <div className="sources">
                                <strong>출처:</strong>
                                <ul>
                                    {msg.sources.map((s, i) => (
                                        <li key={i}>페이지 {s.page ?? '?'}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            ))}
             {isLoading && <div className="doc-message assistant"><div className="doc-message-content"><i>생각 중...</i></div></div>}
        </div>
        <div className="doc-chat-input">
            <input 
                type="text"
                placeholder="문서 내용에 대해 질문하세요..."
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAskQuestion()}
                disabled={isLoading}
            />
            <button onClick={handleAskQuestion} disabled={isLoading}>질문하기</button>
        </div>
      </div>
    </div>
  )
}
