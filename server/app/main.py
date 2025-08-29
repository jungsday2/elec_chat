# app/main.py
import os
import io
import base64
import json
from typing import List, Optional, Literal
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# LangChain / OpenAI / RAG
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.documents import Document

# Calculations
import math
import cmath
import sympy as sp

app = FastAPI(title="JeongirIt Backend", version="1.0.0")

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "")
ALLOWED_ORIGINS = [FRONTEND_ORIGIN] if FRONTEND_ORIGIN else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

if not OPENAI_API_KEY:
    print("[WARN] OPENAI_API_KEY is not set. LLM features will fail until it's configured.")

class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    temperature: float = 0.3
    system_style: Optional[str] = None

class ChatResponse(BaseModel):
    output: str
    suggestions: List[str]

STYLE_SYS = (
    "한국어 존댓말을 사용합니다. 말투는 친절하고 전문적으로 유지합니다. "
    "핵심은 간결하게 전달하되, 전력·에너지·모빌리티 분야의 수치/단위/기호(η, THD, pf, pu, kW, kWh, °C 등)는 보존합니다. "
    "불확실하거나 기억이 모호한 내용은 '불확실'으로 표시하고 추정·일반론은 명확히 구분합니다. 과장 표현은 지양합니다."
)

def _ensure_system_style(messages: List[ChatMessage], override: Optional[str] = None) -> List[ChatMessage]:
    msgs = messages[:]
    if not any(m.role == "system" for m in msgs):
        sys_msg = ChatMessage(role="system", content=override or STYLE_SYS)
        msgs = [sys_msg] + msgs
    return msgs

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    lc_messages = [{"role": m.role, "content": m.content} for m in _ensure_system_style(req.messages, req.system_style)]
    
    # 추천 질문 생성을 위해 최근 4개의 메시지만 사용 (사용자 질문 2개, AI 답변 2개)
    # 전체 대화 기록은 메인 답변 생성에 사용
    trimmed_history_for_suggestions = lc_messages[-4:]
    trimmed_history_for_answer = lc_messages[-20:]
    
    llm = ChatOpenAI(model=DEFAULT_MODEL, temperature=req.temperature)
    
    resp = llm.invoke(trimmed_history_for_answer)
    main_answer = resp.content if hasattr(resp, "content") else str(resp)

    suggestions = []
    try:
        # ▼▼▼ [수정] 추천 질문 생성 프롬프트 수정 ▼▼▼
        suggestion_prompt_template = (
            "가장 최근의 대화 내용을 바탕으로, 사용자가 자연스럽게 이어갈 만한 질문 3개를 추천해주세요. "
            "질문은 이전 대화와 관련이 깊어야 하며, 매우 짧고 간결해야 합니다. "
            "반드시 JSON 형식의 문자열 배열로만 응답해야 합니다. 예: [\"질문 1\", \"질문 2\", \"질문 3\"]"
            "\n\n[최근 대화 내용]\n{recent_chat}"
        )
        suggestion_prompt = ChatPromptTemplate.from_template(suggestion_prompt_template)
        
        suggestion_chain = suggestion_prompt | ChatOpenAI(model=DEFAULT_MODEL, temperature=0.5)
        suggestion_resp = suggestion_chain.invoke({
            "recent_chat": json.dumps(trimmed_history_for_suggestions, ensure_ascii=False)
        })
        suggestions = json.loads(suggestion_resp.content)
    except Exception as e:
        print(f"[WARN] Failed to generate suggestions: {e}")
        suggestions = []

    return ChatResponse(output=main_answer, suggestions=suggestions)

def _build_retriever_from_pdf_bytes(pdf_bytes: bytes, k: int = 4):
    tmp_path = "/tmp/upload.pdf"
    with open(tmp_path, "wb") as f: f.write(pdf_bytes)
    loader = PyPDFLoader(tmp_path)
    docs = loader.load()
    splitter = RecursiveCharacterTextSplitter(chunk_size=1200, chunk_overlap=200, separators=["\n\n", "\n", ". ", " ", ""])
    chunks = splitter.split_documents(docs)
    embeddings = OpenAIEmbeddings()
    vs = FAISS.from_documents(chunks, embeddings)
    return vs.as_retriever(search_kwargs={"k": k})

@app.post("/api/document-qa")
async def document_qa(file: UploadFile = File(...), question: str = Form(...)):
    pdf_bytes = await file.read()
    
    is_summary_request = any(keyword in question for keyword in ["요약", "정리", "알려줘", "설명해", "summarize", "explain"])
    
    if is_summary_request:
        k_value = 10
        prompt_template = ("당신은 문서를 요약하는 전문가입니다. 주어진 여러 문서 조각들을 종합하여, 전체 문서의 핵심 내용을 상세하고 구조적으로 요약하세요...")
    else:
        k_value = 4
        prompt_template = ("주어진 문서 조각들만 근거로, 사용자의 질문에 한국어로 정확하고 간결하게 답하세요...")

    retriever = _build_retriever_from_pdf_bytes(pdf_bytes, k=k_value)

    system_prompt = ChatPromptTemplate.from_messages([("system", prompt_template), ("human", "{input}")])
    
    qa_chain = create_stuff_documents_chain(llm=ChatOpenAI(model=DEFAULT_MODEL, temperature=0.1), prompt=system_prompt)
    chain = create_retrieval_chain(retriever, qa_chain)

    result = chain.invoke({"input": question})
    answer = result.get("answer") or ""
    contexts = result.get("context", [])
    sources = []
    for d in contexts:
        if isinstance(d, Document) and d.metadata:
            page = d.metadata.get("page", None)
            sources.append({"page": int(page) + 1 if page is not None else None, "source": d.metadata.get("source", "")})
            
    return {"answer": answer, "sources": sources}

class OhmsLawRequest(BaseModel):
    V: Optional[float] = None; I: Optional[float] = None; R: Optional[float] = None; P: Optional[float] = None

@app.post("/api/ohms-law")
def ohms_law(req: OhmsLawRequest):
    V, I, R, P = req.V, req.I, req.R, req.P
    try:
        v, i, r, p = sp.symbols("v i r p", real=True)
        eqs = [sp.Eq(v, i*r), sp.Eq(p, v*i)]
        if V is not None: eqs.append(sp.Eq(v, V))
        if I is not None: eqs.append(sp.Eq(i, I))
        if R is not None: eqs.append(sp.Eq(r, R))
        if P is not None: eqs.append(sp.Eq(p, P))
        sol = sp.nsolve([e.lhs - e.rhs for e in eqs], (v, i, r, p), (V or 1, I or 1, R or 1, P or 1))
        return {"V": float(sol[0]), "I": float(sol[1]), "R": float(sol[2]), "P": float(sol[3])}
    except Exception:
        return {"error": "최소 두 개 이상의 값이 필요합니다."}

class Resistances(BaseModel): values: List[float]

@app.post("/api/resistance/series")
def series_resistance(req: Resistances):
    return {"R_total": sum(req.values) if req.values else 0.0}

@app.post("/api/resistance/parallel")
def parallel_resistance(req: Resistances):
    if not req.values or any(v == 0 for v in req.values): return {"R_total": 0.0}
    return {"R_total": 1.0/sum(1.0/v for v in req.values)}

class RLCRequest(BaseModel): R: float; L: float; C: float; f: float

@app.post("/api/rlc")
def rlc(req: RLCRequest):
    w = 2*math.pi*req.f
    Xl = w*req.L
    Xc = 1/(w*req.C) if req.C != 0 else float("inf")
    Z = complex(req.R, Xl - Xc)
    return {"Xl": Xl, "Xc": Xc, "Z_mag": abs(Z), "Z_phase_deg": math.degrees(cmath.phase(Z))}

class ResistorCodeRequest(BaseModel): ohms: float

@app.post("/api/resistor-color")
def resistor_color(req: ResistorCodeRequest):
    value = req.ohms
    if value <= 0: return {"error": "양의 저항값(Ω)을 입력하세요."}
    bands = [("black", 0), ("brown", 1), ("red", 2), ("orange", 3), ("yellow", 4), ("green", 5), ("blue", 6), ("violet", 7), ("gray", 8), ("white", 9)]
    # ... (기존 색띠 계산 로직)
    return {"bands": ["black", "black", "black", "gold"]} # 예시 반환값
