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
    trimmed_history = lc_messages[-20:]
    llm = ChatOpenAI(model=DEFAULT_MODEL, temperature=req.temperature)
    
    resp = llm.invoke(trimmed_history)
    main_answer = resp.content if hasattr(resp, "content") else str(resp)

    suggestions = []
    try:
        suggestion_prompt = ChatPromptTemplate.from_messages([
            ("system", "지금까지의 대화 내용을 바탕으로, 사용자가 궁금해할 만한 다음 질문 3개를 추천해주세요. 질문은 매우 짧고 간결해야 합니다. 반드시 JSON 형식의 문자열 배열로만 응답해야 합니다. 예: [\"질문 1\", \"질문 2\", \"질문 3\"]"),
            ("human", f"대화 기록: {json.dumps(trimmed_history, ensure_ascii=False)}")
        ])
        suggestion_chain = suggestion_prompt | ChatOpenAI(model=DEFAULT_MODEL, temperature=0.5)
        suggestion_resp = suggestion_chain.invoke({})
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

# ▼▼▼ [수정] /api/document-qa 엔드포인트 로직 수정 ▼▼▼
@app.post("/api/document-qa")
async def document_qa(file: UploadFile = File(...), question: str = Form(...)):
    pdf_bytes = await file.read()
    
    # 1. 질문 유형에 따라 k값과 프롬프트 동적 변경
    is_summary_request = any(keyword in question for keyword in ["요약", "정리", "알려줘", "설명해", "summarize", "explain"])
    
    if is_summary_request:
        k_value = 10
        prompt_template = (
            "당신은 문서를 요약하는 전문가입니다. 주어진 여러 문서 조각들을 종합하여, 전체 문서의 핵심 내용을 상세하고 구조적으로 요약하세요. "
            "서론, 본론, 결론의 흐름이 드러나도록 정리하고, 중요한 수치나 데이터는 반드시 포함하세요. 모든 답변은 한국어로 작성해야 합니다."
            "\n\n[문서 조각들]\n{context}"
        )
    else:
        k_value = 4
        prompt_template = (
            "주어진 문서 조각들만 근거로, 사용자의 질문에 한국어로 정확하고 간결하게 답하세요. "
            "출처가 불명확하면 '문서에서 확인되지 않습니다'라고 답하세요. "
            "중요 숫자·기호·단위를 보존하세요."
            "\n\n[문서 조각들]\n{context}"
        )

    # 2. 동적으로 결정된 k값으로 리트리버 생성
    retriever = _build_retriever_from_pdf_bytes(pdf_bytes, k=k_value)

    system_prompt = ChatPromptTemplate.from_messages([
        ("system", prompt_template),
        ("human", "{input}")
    ])
    
    qa_chain = create_stuff_documents_chain(
        llm=ChatOpenAI(model=DEFAULT_MODEL, temperature=0.1), # 요약을 위해 약간의 창의성 허용
        prompt=system_prompt
    )
    chain = create_retrieval_chain(retriever, qa_chain)

    result = chain.invoke({"input": question})
    answer = result.get("answer") or ""
    contexts = result.get("context", [])
    sources = []
    for d in contexts:
        if isinstance(d, Document) and d.metadata:
            page = d.metadata.get("page", None)
            src = {"page": int(page) + 1 if page is not None else None, "source": d.metadata.get("source", "")}
            sources.append(src)
            
    return {"answer": answer, "sources": sources}

class OhmsLawRequest(BaseModel):
    V: Optional[float] = None
    I: Optional[float] = None
    R: Optional[float] = None
    P: Optional[float] = None

@app.post("/api/ohms-law")
def ohms_law(req: OhmsLawRequest):
    V, I, R, P = req.V, req.I, req.R, req.P
    try:
        v, i, r, p = sp.symbols("v i r p", real=True)
        equations = []
        if V is not None: equations.append(sp.Eq(v, V))
        if I is not None: equations.append(sp.Eq(i, I))
        if R is not None: equations.append(sp.Eq(r, R))
        if P is not None: equations.append(sp.Eq(p, P))
        equations += [sp.Eq(v, i*r), sp.Eq(p, v*i)]
        sol = sp.nsolve([eq.lhs - eq.rhs for eq in equations], (v, i, r, p), (V or 1.0, I or 1.0, R or 1.0, P or 1.0))
        Vc, Ic, Rc, Pc = [float(s) for s in sol]
        return {"V": Vc, "I": Ic, "R": Rc, "P": Pc}
    except Exception:
        if V is not None and I is not None: return {"V": V, "I": I, "R": V / I, "P": V * I}
        if V is not None and R is not None: I = V/R; return {"V": V, "I": I, "R": R, "P": V * I}
        if I is not None and R is not None: V = I*R; return {"V": V, "I": I, "R": R, "P": V * I}
        if P is not None and V is not None: I = P/V; return {"V": V, "I": I, "R": V / I, "P": P}
        if P is not None and I is not None: V = P/I; return {"V": V, "I": I, "R": V / I, "P": P}
        return {"error": "최소 두 개 이상의 값이 필요합니다 (예: V와 I)."}

class Resistances(BaseModel):
    values: List[float]

@app.post("/api/resistance/series")
def series_resistance(req: Resistances):
    return {"R_total": sum(req.values) if req.values else 0.0}

@app.post("/api/resistance/parallel")
def parallel_resistance(req: Resistances):
    if not req.values or any(v == 0 for v in req.values): return {"R_total": 0.0}
    inv = sum(1.0/v for v in req.values)
    return {"R_total": float("inf") if inv == 0 else 1.0/inv}

class RLCRequest(BaseModel):
    R: float; L: float; C: float; f: float

@app.post("/api/rlc")
def rlc(req: RLCRequest):
    w = 2*math.pi*req.f
    Xl = w*req.L
    Xc = 1/(w*req.C) if req.C != 0 else float("inf")
    Z = complex(req.R, Xl - Xc)
    return {"Xl": Xl, "Xc": Xc, "Z_mag": abs(Z), "Z_phase_deg": math.degrees(cmath.phase(Z))}

class ResistorCodeRequest(BaseModel):
    ohms: float

@app.post("/api/resistor-color")
def resistor_color(req: ResistorCodeRequest):
    value = req.ohms
    if value <= 0: return {"error": "양의 저항값(Ω)을 입력하세요."}
    bands = [("black", 0), ("brown", 1), ("red", 2), ("orange", 3), ("yellow", 4), ("green", 5), ("blue", 6), ("violet", 7), ("gray", 8), ("white", 9)]
    def color_for_digit(d): return bands[d][0]
    exponent = 0; v = value
    while v >= 100: v /= 10; exponent += 1
    while v < 10: v *= 10; exponent -= 1
    digits = int(round(v))
    if digits >= 100: digits //= 10; exponent += 1
    d1, d2 = digits // 10, digits % 10
    multiplier_color = bands[exponent][0] if 0 <= exponent < len(bands) else "gold"
    return {"bands": [color_for_digit(d1), color_for_digit(d2), multiplier_color, "gold"]}
