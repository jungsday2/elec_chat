import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export async function chat(messages: {role:'system'|'user'|'assistant'; content:string}[]) {
  const res = await axios.post(`${API_BASE}/api/chat`, { messages })
  return res.data as { output: string, suggestions: string[] }
}

export async function documentQA(file: File, question: string) {
  const form = new FormData()
  form.append('file', file)
  form.append('question', question)
  const res = await axios.post(`${API_BASE}/api/document-qa`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data as { answer: string, sources: {page:number|null, source:string}[] }
}

export async function ohmsLaw(payload: Partial<{V:number;I:number;R:number;P:number}>) {
  const res = await axios.post(`${API_BASE}/api/ohms-law`, payload)
  return res.data as {V:number;I:number;R:number;P:number} | {error:string}
}

export async function seriesResistance(values: number[]) {
  const res = await axios.post(`${API_BASE}/api/resistance/series`, { values })
  return res.data as { R_total: number }
}

export async function parallelResistance(values: number[]) {
  const res = await axios.post(`${API_BASE}/api/resistance/parallel`, { values })
  return res.data as { R_total: number }
}

export async function resistorColor(ohms: number) {
  const res = await axios.post(`${API_BASE}/api/resistor-color`, { ohms })
  return res.data as { bands: string[] } | { error: string }
}

export async function rlc(payload: {R:number;L:number;C:number;f:number}) {
  const res = await axios.post(`${API_BASE}/api/rlc`, payload)
  return res.data as {Xl:number;Xc:number;Z_mag:number;Z_phase_deg:number}
}

export async function vectorCalculus(payload: {
  operation: 'grad' | 'div' | 'curl';
  expression: string;
  variables: string;
}) {
  const res = await axios.post(`${API_BASE}/api/vector-calculus`, payload);
  return res.data as { result: string } | { error: string };
}

// ▼▼▼ [추가] 일반 미분/정적분 API 호출 함수 ▼▼▼
export async function calculus(payload: {
  operation: 'diff' | 'int';
  expression: string;
  variable: string;
  lower_bound?: string;
  upper_bound?: string;
}) {
  const res = await axios.post(`${API_BASE}/api/calculus`, payload);
  return res.data as { result: string } | { error: string };
}
