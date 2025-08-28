
# 전기릿 (JeongirIt) — 웹/앱 Full‑Stack

업로드된 노트북(Gradio 기반) 기능을 **React(웹/앱 스타일) + FastAPI** 구조로 재구현했습니다.
- **Frontend**: Vite + React (TypeScript)
- **Backend**: FastAPI + LangChain(OpenAI) + FAISS + SymPy + Schemdraw
- **Deploy**: Render Blueprints (`render.yaml`)

## 폴더 구조
```text
frontend/         # React 앱 (Vite)
server/           # FastAPI 서버
  └ app/main.py  # API 엔드포인트
render.yaml       # Render Blueprint (프론트/백 모두 생성)
```

## 로컬 개발
### 1) 백엔드
```bash
cd server
cp .env.example .env  # OPENAI_API_KEY 설정
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2) 프론트엔드
```bash
cd frontend
cp .env.example .env # VITE_API_BASE (기본: http://localhost:8000)
npm install
npm run dev # http://localhost:5173
```

## Render 배포
1. 이 폴더 전체를 GitHub 저장소로 푸시합니다.
2. Render Dashboard에서 **BluePrint**로 `render.yaml`을 선택해 배포합니다. (싱가포르 리전 사용)
   - 백엔드 서비스 `jeongirit-backend`가 생성됩니다.
   - 프론트엔드 정적 사이트 `jeongirit-frontend`가 생성됩니다.
3. 백엔드 서비스 환경변수에서 **OPENAI_API_KEY**를 설정합니다.
   - 필요 시 `OPENAI_MODEL` (기본: gpt-4o-mini) 변경 가능
4. 배포 완료 후, 프론트엔드에서 백엔드 API URL이 자동으로 연결됩니다.

## 제공 기능
- 💬 **전기 챗봇**: 한국어 존댓말 스타일 시스템 프롬프트, OpenAI Chat 기반
- 📄 **문서 Q&A (RAG)**: PDF 업로드 → Text Split → FAISS → Retrieval → 생성 응답(출처 포함)
- 🧮 **계산기**: 옴의 법칙, 직렬/병렬 저항, RLC 임피던스, 저항 색띠(4‑band)
- 🔧 **회로 문제 생성**: 간단한 직렬회로 이미지(schemdraw) + 문제/정답

## 보안 유의사항
- 노트북에 하드코딩되어 있던 OpenAI 키는 **절대** 커밋하지 마세요.
- Render에서는 **OPENAI_API_KEY**를 서비스의 Environment에 안전하게 저장하세요.

## 커스터마이징 팁
- 챗봇 톤/스타일: `server/app/main.py`의 `STYLE_SYS` 수정
- 문서 Q&A 파라미터: `chunk_size`, `k` 등
- CORS: `FRONTEND_ORIGIN` 환경변수로 제한 가능
- 회로 문제 범위: 환경변수 `CIRCUIT_*`로 조정
```
