# ⚡ 전기릿 (JeongirIt) — 전기·전자 종합 AI 어시스턴트

**전기·전자 공학도를 위한 AI 기반 올인원 웹 애플리케이션입니다.**

복잡한 전공 지식 검색, 논문 요약, 공학 계산까지 하나의 플랫폼에서 해결하세요. 이 프로젝트는 기존 Gradio 프로토타입을 React와 FastAPI를 사용한 확장 가능한 풀스택 아키텍처로 재구현한 것입니다.

**[➡️ Live Demo 바로가기](https://jeongirit-frontend.onrender.com/)**

![전기릿 데모 이미지](https://i.imgur.com/your-image-url.png) 
*참고: 위 이미지는 실제 데모 화면의 스크린샷으로 교체하는 것을 권장합니다.*

---

## 🛠️ 기술 스택 (Tech Stack)

-   **Frontend**: `Vite` + `React` (TypeScript)
-   **Backend**: `FastAPI` + `LangChain` (OpenAI) + `SymPy`
-   **Deploy**: Render Blueprints (`render.yaml`)

---

## ✨ 주요 기능 (Features)

-   💬 **AI 전기 챗봇**:
    -   전기공학 도메인에 특화된 AI 챗봇
    -   대화의 맥락을 기억하고 답변하는 기능
    -   답변에 따른 동적 후속 질문 추천
    -   대화 내용 자동 저장 및 복원 (Local Storage)

-   📄 **문서 기반 Q&A (RAG)**:
    -   PDF 논문 및 기술 문서 업로드
    -   문서 전체 내용에 대한 심층 요약 (Map-Reduce 방식)
    -   문서의 특정 내용에 대한 질의응답

-   🧮 **공학 계산기**:
    -   옴의 법칙 (V, I, R, P)
    -   직렬/병렬 저항 합성
    -   RLC 회로 임피던스
    -   저항 색띠 변환 (4-Band)
    -   벡터 미적분 (Gradient, Divergence, Curl)
    -   미분 및 정적분

-   📚 **단위 및 기호**:
    -   전기공학 분야의 주요 단위와 기호 정리표 제공

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
