# ⚡ 전기릿 (JeongirIt) — 전기·전자 종합 AI 어시스턴트
숭실대학교 비전공자 1팀 - 김중서, 임정민, 김유완, 박혜영, 최웅, 김지수, 황현일

**전기·전자 공학도를 위한 AI 기반 올인원 웹 애플리케이션입니다.**

복잡한 전공 지식 검색, 논문 요약, 공학 계산까지 하나의 플랫폼에서 해결하세요. 이 프로젝트는 기존 Gradio 프로토타입을 React와 FastAPI를 사용한 확장 가능한 풀스택 아키텍처로 재구현한 것입니다.

**[➡️ Live Demo 바로가기](https://jeongirit-frontend.onrender.com/)**

---

## ✨ 주요 기능 (Features)

-   💬 **AI 전기 챗봇**:
    -   전기공학 도메인에 특화된 AI 챗봇.
    -   **주제 이탈 방지**: 전기/전자와 관련 없는 질문은 정중히 거절합니다.
    -   **동적 후속 질문 추천**: 대화의 맥락에 맞는 다음 질문을 AI가 추천합니다.
    -   **대화 기록 자동 저장**: 브라우저를 닫았다 열어도 대화가 유지됩니다.

-   📄 **문서 기반 Q&A (RAG)**:
    -   PDF 논문 및 기술 문서 업로드.
    -   **장문서 요약**: 'Map-Reduce' 방식을 도입하여 아무리 긴 문서라도 안정적으로 요약합니다.
    -   **정확한 질의응답**: 문서 내용에 기반하여 특정 질문에 답변합니다.

-   🧮 **공학 계산기**:
    -   옴의 법칙 (V, I, R, P)
    -   직렬/병렬 저항 합성
    -   RLC 회로 임피던스
    -   저항 색띠 변환 (4-Band)
    -   **벡터 미적분** (Gradient, Divergence, Curl)
    -   **미분 및 정적분**

-   📚 **단위 및 기호**:
    -   전기공학 분야의 주요 단위와 기호를 정리한 표를 제공합니다.

---

## 🛠️ 기술 스택 (Tech Stack)

### **Backend**
- **FastAPI**: Python 웹 프레임워크
- **LangChain**: AI 오케스트레이션
- **OpenAI GPT-4o-mini**: AI 모델
- **SymPy**: 기호 수학 라이브러리 (계산기)
- **Pydantic**: 데이터 검증

### **Frontend**
- **React 18** (TypeScript): UI 프레임워크
- **Vite**: 빌드 도구
- **Axios**: HTTP 클라이언트
- **React Markdown**: 마크다운 렌더링

### **Deployment**
- **Backend**: Render.com (Web Service)
- **Frontend**: Render.com (Static Site)

---

## 🚀 로컬에서 실행하기

### 1. 백엔드 (FastAPI)

```bash
# 1. 서버 디렉토리로 이동
cd server

# 2. .env 파일 설정 (API 키 입력)
cp .env.example .env
# nano .env 또는 다른 편집기로 OPENAI_API_KEY를 설정합니다.

# 3. 파이썬 라이브러리 설치
pip install -r requirements.txt

# 4. 백엔드 서버 실행
uvicorn app.main:app --reload --port 8000
