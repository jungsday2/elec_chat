
import React, { useState } from 'react'
import { ohmsLaw, seriesResistance, parallelResistance, resistorColor, rlc } from '../api'

export default function Calculators() {
  return (
    <div className="panel">
      <div className="grid2">
        <OhmsLawCard />
        <ResistorCard />
        <ResistorColorCard />
        <RlcCard />
      </div>
    </div>
  )
}

function OhmsLawCard() {
  const [V,setV] = useState<string>('')
  const [I,setI] = useState<string>('')
  const [R,setR] = useState<string>('')
  const [P,setP] = useState<string>('')
  const [out,setOut] = useState<any>(null)

  async function compute() {
    const payload:any = {}
    if (V) payload.V = parseFloat(V)
    if (I) payload.I = parseFloat(I)
    if (R) payload.R = parseFloat(R)
    if (P) payload.P = parseFloat(P)
    const res = await ohmsLaw(payload)
    setOut(res)
  }

  return (
    <div className="card">
      <h3>옴의 법칙</h3>
      <div className="row">
        <input placeholder="V (Volt)" value={V} onChange={e=>setV(e.target.value)} />
        <input placeholder="I (Ampere)" value={I} onChange={e=>setI(e.target.value)} />
        <input placeholder="R (Ohm)" value={R} onChange={e=>setR(e.target.value)} />
        <input placeholder="P (Watt)" value={P} onChange={e=>setP(e.target.value)} />
        <button className="ghost" onClick={() => { setV(''); setI(''); setR(''); setP(''); setOut(null); }}>초기화</button>
        <button className="primary" onClick={compute}>계산</button>
      </div>
      {out && !('error' in out) && (
        <table>
          <tbody>
            <tr><th>V</th><td>{out.V.toFixed(6)}</td></tr>
            <tr><th>I</th><td>{out.I.toFixed(6)}</td></tr>
            <tr><th>R</th><td>{out.R.toFixed(6)}</td></tr>
            <tr><th>P</th><td>{out.P.toFixed(6)}</td></tr>
          </tbody>
        </table>
      )}
      {out && ('error' in out) && <div className="small">{out.error}</div>}
    </div>
  )
}

function ResistorCard() {
  const [vals, setVals] = useState<string>('10, 20, 30')
  const [series, setSeries] = useState<number | null>(null)
  const [parallel, setParallel] = useState<number | null>(null)
  async function calc() {
    const numbers = vals.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
    const s = await seriesResistance(numbers)
    const p = await parallelResistance(numbers)
    setSeries(s.R_total)
    setParallel(p.R_total)
  }
  return (
    <div className="card">
      <h3>저항 계산기 (직렬/병렬)</h3>
      <div className="row">
        <input placeholder="예: 10, 20, 30" value={vals} onChange={e=>setVals(e.target.value)} />
        <button className="primary" onClick={calc}>계산</button>
      </div>
      {(series !== null || parallel !== null) && (
        <table>
          <tbody>
            <tr><th>직렬</th><td>{series?.toFixed(6)}</td></tr>
            <tr><th>병렬</th><td>{parallel?.toFixed(6)}</td></tr>
          </tbody>
        </table>
      )}
    </div>
  )
}

function ResistorColorCard() {
  const [ohms, setOhms] = useState<string>('1000')
  const [bands, setBands] = useState<string[] | null>(null)

  async function calc() {
    const res:any = await resistorColor(parseFloat(ohms))
    if ('bands' in res) setBands(res.bands)
  }

  return (
    <div className="card">
      <h3>저항 색띠 (4-band)</h3>
      <div className="row">
        <input placeholder="저항 (Ω)" value={ohms} onChange={e=>setOhms(e.target.value)} />
        <button className="primary" onClick={calc}>계산</button>
      </div>
      {bands && <div className="small">Bands: {bands.join(' | ')}</div>}
    </div>
  )
}

function RlcCard() {
  const [R,setR] = useState('100')
  const [L,setL] = useState('0.01')
  const [C,setC] = useState('0.000001')
  const [f,setF] = useState('60')
  const [out,setOut] = useState<any>(null)

  async function calc() {
    const res = await rlc({ R: parseFloat(R), L: parseFloat(L), C: parseFloat(C), f: parseFloat(f) })
    setOut(res)
  }

  return (
    <div className="card">
      <h3>RLC 임피던스</h3>
      <div className="row">
        <input placeholder="R (Ω)" value={R} onChange={e=>setR(e.target.value)} />
        <input placeholder="L (H)" value={L} onChange={e=>setL(e.target.value)} />
        <input placeholder="C (F)" value={C} onChange={e=>setC(e.target.value)} />
        <input placeholder="f (Hz)" value={f} onChange={e=>setF(e.target.value)} />
        <button className="primary" onClick={calc}>계산</button>
      </div>
      {out && (
        <table>
          <tbody>
            <tr><th>X_L</th><td>{out.Xl.toFixed(6)}</td></tr>
            <tr><th>X_C</th><td>{out.Xc.toFixed(6)}</td></tr>
            <tr><th>|Z|</th><td>{out.Z_mag.toFixed(6)}</td></tr>
            <tr><th>∠Z (deg)</th><td>{out.Z_phase_deg.toFixed(6)}</td></tr>
          </tbody>
        </table>
      )}
    </div>
  )
}
