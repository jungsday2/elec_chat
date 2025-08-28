
import React, { useEffect, useState } from 'react'
import { circuitProblem } from '../api'

export default function CircuitProblem() {
  const [img, setImg] = useState<string>('')
  const [meta, setMeta] = useState<any>(null)

  async function load() {
    const data = await circuitProblem()
    setImg('data:image/png;base64,' + data.image_base64)
    setMeta(data)
  }
  useEffect(()=>{ load() }, [])

  return (
    <div className="panel">
      <div className="row">
        <button className="primary" onClick={load}>새 문제 생성</button>
      </div>
      {img && <img src={img} alt="회로도" style={{maxWidth:'100%', borderRadius:12, border:'1px solid #374151'}} />}
      {meta && (
        <div className="card">
          <div><strong>문제:</strong> {meta.question}</div>
          <div className="small">V={meta.V}V, R1={meta.R1}Ω, R2={meta.R2}Ω</div>
          <details style={{marginTop:8}}>
            <summary>정답 보기</summary>
            <ul>
              <li>R_total = {meta.solution.Rt.toFixed(6)} Ω</li>
              <li>I_total = {meta.solution.I.toFixed(6)} A</li>
              <li>V1 = {meta.solution.V1.toFixed(6)} V</li>
              <li>V2 = {meta.solution.V2.toFixed(6)} V</li>
            </ul>
          </details>
        </div>
      )}
    </div>
  )
}
