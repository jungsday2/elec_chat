# app/main.py
import os
import io
import base64
import json
import random
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
from langchain.chains.summarize import load_summarize_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document

# Calculations
import math
import cmath
import sympy as sp

# --- FastAPI 앱 초기화 및 CORS 설정 ---
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

# --- 환경변수 로드 및 모델 설정 ---
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

if not OPENAI_API_KEY:
    print("[WARN] OPENAI_API_KEY is not set. LLM features will fail until it's configured.")

# --- Pydantic 데이터 모델 정의 ---
class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    temperature: float = 0.3

class ChatResponse(BaseModel):
    output: str
    suggestions: List[str]

# --- API 엔드포인트 ---
@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    lc_messages = [{"role": m.role, "content": m.content} for m in req.messages]
    
    # 추천 질문은 최근 대화 4개를 기반으로 생성
    trimmed_history_for_suggestions = lc_messages[-4:]
    # 메인 답변은 최대 20개의 대화 기록을 참고
    trimmed_history_for_answer = lc_messages[-20:]
    
    llm = ChatOpenAI(model=DEFAULT_MODEL, temperature=req.temperature)
    
    # 1. 메인 답변 생성
    resp = llm.invoke(trimmed_history_for_answer)
    main_answer = resp.content if hasattr(resp, "content") else str(resp)

    # 2. 후속 추천 질문 생성
    suggestions = []
    try:
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

@app.post("/api/document-qa")
async def document_qa(file: UploadFile = File(...), question: str = Form(...)):
    pdf_bytes = await file.read()
    
    tmp_path = f"/tmp/{file.filename}"
    with open(tmp_path, "wb") as f:
        f.write(pdf_bytes)
    
    loader = PyPDFLoader(tmp_path)
    docs = loader.load()

    is_summary_request = any(keyword in question for keyword in ["요약", "정리", "summarize", "sum up"])

    llm = ChatOpenAI(model=DEFAULT_MODEL, temperature=0.1)
    answer = ""
    sources = []

    if is_summary_request:
        # [개선] '분할 정복(MapReduce)' 요약 방식으로 변경
        map_prompt = ChatPromptTemplate.from_template(
            '다음은 문서의 일부 내용입니다. 이 내용의 핵심을 간결하게 요약해주세요:\n\n"{text}"\n\n요약:'
        )
        combine_prompt = ChatPromptTemplate.from_template(
            "다음은 여러 문서 조각들의 요약본입니다. 이 요약본들을 종합하여 전체 문서의 내용을 구조적으로 정리해주세요. 서론, 본론, 결론이 명확히 드러나도록 작성하고, 한국어로 답변해주세요.\n\n[요약본들]\n{text}\n\n[최종 정리]"
        )
        summary_chain = load_summarize_chain(
            llm=llm, chain_type="map_reduce",
            map_prompt=map_prompt, combine_prompt=combine_prompt
        )
        result = summary_chain.invoke(docs)
        answer = result.get("output_text", "요약 생성에 실패했습니다.")
    else:
        # 기존 RAG 방식
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1200, chunk_overlap=200)
        chunks = text_splitter.split_documents(docs)
        vector_store = FAISS.from_documents(chunks, OpenAIEmbeddings())
        retriever = vector_store.as_retriever(search_kwargs={"k": 5})
        
        prompt = ChatPromptTemplate.from_template(
            "주어진 문서 조각들만 근거로, 사용자의 질문에 한국어로 정확하고 간결하게 답하세요. 출처가 불명확하면 '문서에서 확인되지 않습니다'라고 답하세요.\n\n[문서 조각들]\n{context}\n\n[질문]\n{input}\n\n[답변]"
        )
        qa_chain = create_stuff_documents_chain(llm=llm, prompt=prompt)
        chain = create_retrieval_chain(retriever, qa_chain)
        result = chain.invoke({"input": question})
        answer = result.get("answer", "답변을 찾을 수 없습니다.")
        
        for d in result.get("context", []):
            if isinstance(d, Document) and d.metadata:
                page = d.metadata.get("page", None)
                sources.append({"page": int(page) + 1 if page is not None else None, "source": d.metadata.get("source", "")})
            
    return {"answer": answer, "sources": sources}

# --- 계산기 관련 엔드포인트 ---
class OhmsLawRequest(BaseModel):
    V: Optional[float] = None; I: Optional[float] = None; R: Optional[float] = None; P: Optional[float] = None

@app.post("/api/ohms-law")
def ohms_law(req: OhmsLawRequest):
    known_vars = sum(x is not None for x in [req.V, req.I, req.R, req.P])
    if known_vars < 2:
        return {"error": "최소 두 개 이상의 값이 필요합니다."}
    
    try:
        v, i, r, p = sp.symbols("v i r p", real=True)
        eqs = [sp.Eq(v, i*r), sp.Eq(p, v*i)]
        if req.V is not None: eqs.append(sp.Eq(v, req.V))
        if req.I is not None: eqs.append(sp.Eq(i, req.I))
        if req.R is not None: eqs.append(sp.Eq(r, req.R))
        if req.P is not None: eqs.append(sp.Eq(p, req.P))
        
        # [개선] 초기 추정값을 제공하여 수렴 안정성 향상
        sol = sp.nsolve(
            [e.lhs - e.rhs for e in eqs], 
            (v, i, r, p), 
            (req.V or 1, req.I or 1, req.R or 1, req.P or 1)
        )
        return {"V": float(sol[0]), "I": float(sol[1]), "R": float(sol[2]), "P": float(sol[3])}
    except Exception as e:
        print(f"[ERROR] Ohms law calculation failed: {e}")
        return {"error": "값을 계산할 수 없습니다. 입력값을 확인해주세요."}

class Resistances(BaseModel): values: List[float]

@app.post("/api/resistance/series")
def series_resistance(req: Resistances):
    return {"R_total": sum(req.values) if req.values else 0.0}

@app.post("/api/resistance/parallel")
def parallel_resistance(req: Resistances):
    if not req.values or any(v == 0 for v in req.values): return {"R_total": 0.0}
    inv_sum = sum(1.0/v for v in req.values)
    return {"R_total": 1.0/inv_sum if inv_sum != 0 else float("inf")}

class RLCRequest(BaseModel): R: float; L: float; C: float; f: float

@app.post("/api/rlc")
def rlc(req: RLCRequest):
    w = 2 * math.pi * req.f
    Xl = w * req.L
    Xc = 1 / (w * req.C) if req.C != 0 else float("inf")
    Z = complex(req.R, Xl - Xc)
    return {"Xl": Xl, "Xc": Xc, "Z_mag": abs(Z), "Z_phase_deg": math.degrees(cmath.phase(Z))}

class ResistorCodeRequest(BaseModel): ohms: float

@app.post("/api/resistor-color")
def resistor_color(req: ResistorCodeRequest):
    value = req.ohms
    if value <= 0: return {"error": "양의 저항값(Ω)을 입력하세요."}
    
    colors = ["black", "brown", "red", "orange", "yellow", "green", "blue", "violet", "gray", "white"]
    
    s_val = str(value)
    if value < 10:
        if '.' not in s_val: s_val += '.0'
        first_digit = int(s_val[0])
        second_digit = int(s_val[2])
        multiplier_exp = -1
    else:
        first_digit = int(s_val[0])
        second_digit = int(s_val[1])
        multiplier_exp = len(str(int(value))) - 2
        
    if not (0 <= first_digit <= 9 and 0 <= second_digit <= 9 and 0 <= multiplier_exp <= 9):
        return {"error": "계산 범위를 벗어나는 저항값입니다."}

    return {
        "bands": [
            colors[first_digit],
            colors[second_digit],
            colors[multiplier_exp],
            "gold" # 4-band 오차는 금색으로 고정
        ]
    }
