
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export async function chat(messages: {role:'system'|'user'|'assistant'; content:string}[]) {
  const res = await axios.post(`${API_BASE}/api/chat`, { messages })
  return res.data as { output: string }
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

export async function circuitProblem() {
  const res = await axios.get(`${API_BASE}/api/circuit-problem`)
  return res.data as { image_base64: string, V:number, R1:number, R2:number, question:string, solution: Record<string, number> }
}
