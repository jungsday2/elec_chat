import React, { useState } from 'react'
import { ohmsLaw, seriesResistance, parallelResistance, resistorColor, rlc, vectorCalculus, calculus } from '../api'

export default function Calculators() {
  return (
    <div className="panel">
      {/* [수정] 2열 그리드에서 3열 그리드로 변경 */}
      <div className="grid3">
        <OhmsLawCard />
        <ResistorCard />
        <ResistorColorCard />
        <RlcCard />
        {/* [추가] 새로운 계산기 카드들 */}
        <VectorCalculusCard />
        <CalculusCard />
      </div>
    </div>
  )
}

// --- 기존 계산기 카드들 (수정 없음) ---

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
      </div>
      <div className="row">
        <input placeholder="R (Ohm)" value={R} onChange={e=>setR(e.target.value)} />
        <input placeholder="P (Watt)" value={P} onChange={e=>setP(e.target.value)} />
      </div>
       <div className="row">
        <button className="primary" style={{flex: '2 1 0%'}} onClick={compute}>계산</button>
        <button onClick={() => { setV(''); setI(''); setR(''); setP(''); setOut(null); }}>초기화</button>
      </div>
      {out && !('error' in out) && (
        <table style={{marginTop: '12px'}}>
          <tbody>
            <tr><th>V (전압)</th><td>{out.V.toFixed(4)} V</td></tr>
            <tr><th>I (전류)</th><td>{out.I.toFixed(4)} A</td></tr>
            <tr><th>R (저항)</th><td>{out.R.toFixed(4)} Ω</td></tr>
            <tr><th>P (전력)</th><td>{out.P.toFixed(4)} W</td></tr>
          </tbody>
        </table>
      )}
      {out && ('error' in out) && <div className="small" style={{marginTop: '12px', color: '#ef4444'}}>{out.error}</div>}
    </div>
  )
}

function ResistorCard() {
  const [vals, setVals] = useState<string>('10, 20, 30')
  const [out, setOut] = useState<any>(null)

  async function calc() {
    const numbers = vals.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
    const s = await seriesResistance(numbers)
    const p = await parallelResistance(numbers)
    setOut({series: s.R_total, parallel: p.R_total})
  }
  return (
    <div className="card">
      <h3>저항 계산 (직렬/병렬)</h3>
      <input placeholder="예: 10, 20, 30" value={vals} onChange={e=>setVals(e.target.value)} />
      <button className="primary" onClick={calc} style={{marginTop: '12px'}}>계산</button>
      {out && (
        <table style={{marginTop: '12px'}}>
          <tbody>
            <tr><th>직렬연결 (R_s)</th><td>{out.series?.toFixed(4)} Ω</td></tr>
            <tr><th>병렬연결 (R_p)</th><td>{out.parallel?.toFixed(4)} Ω</td></tr>
          </tbody>
        </table>
      )}
    </div>
  )
}

function ResistorColorCard() {
  const [ohms, setOhms] = useState<string>('47000')
  const [out, setOut] = useState<any>(null)

  async function calc() {
    const res:any = await resistorColor(parseFloat(ohms))
    setOut(res)
  }

  return (
    <div className="card">
      <h3>저항 색띠 (4-band)</h3>
      <input placeholder="저항 (Ω)" value={ohms} onChange={e=>setOhms(e.target.value)} />
      <button className="primary" onClick={calc} style={{marginTop: '12px'}}>계산</button>
       {out && 'bands' in out && <div className="small" style={{marginTop: '12px'}}><b>결과:</b> {out.bands.join(' - ')}</div>}
       {out && 'error' in out && <div className="small" style={{marginTop: '12px', color: '#ef4444'}}>{out.error}</div>}
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
        <input placeholder="R (Ω)" value={R} onChange={e=>setR(e.target.value)} />
        <input placeholder="L (H)" value={L} onChange={e=>setL(e.target.value)} style={{marginTop: '12px'}}/>
        <input placeholder="C (F)" value={C} onChange={e=>setC(e.target.value)} style={{marginTop: '12px'}}/>
        <input placeholder="f (Hz)" value={f} onChange={e=>setF(e.target.value)} style={{marginTop: '12px'}}/>
      <button className="primary" onClick={calc} style={{marginTop: '12px'}}>계산</button>
      {out && (
        <table style={{marginTop: '12px'}}>
          <tbody>
            <tr><th>유도 리액턴스 (X_L)</th><td>{out.Xl.toFixed(4)} Ω</td></tr>
            <tr><th>용량 리액턴스 (X_C)</th><td>{out.Xc.toFixed(4)} Ω</td></tr>
            <tr><th>임피던스 크기 (|Z|)</th><td>{out.Z_mag.toFixed(4)} Ω</td></tr>
            <tr><th>위상각 (∠Z)</th><td>{out.Z_phase_deg.toFixed(4)} °</td></tr>
          </tbody>
        </table>
      )}
    </div>
  )
}

// --- [추가] 신규 계산기 카드들 ---

function VectorCalculusCard() {
  const [op, setOp] = useState<'grad'|'div'|'curl'>('grad');
  const [expr, setExpr] = useState('x**2 * y * z');
  const [vars, setVars] = useState('x y z');
  const [out, setOut] = useState<any>(null);

  async function calc() {
    const res = await vectorCalculus({ operation: op, expression: expr, variables: vars });
    setOut(res);
  }

  return (
    <div className="card">
      <h3>벡터 미적분</h3>
      <select value={op} onChange={e => setOp(e.target.value as any)}>
        <option value="grad">Gradient (기울기)</option>
        <option value="div">Divergence (발산)</option>
        <option value="curl">Curl (회전)</option>
      </select>
      <textarea
        placeholder={op === 'grad' ? "스칼라 함수 입력 (예: x**2*y)" : "벡터 함수 입력 (예: x*y, y*z, z*x)"}
        value={expr}
        onChange={e => setExpr(e.target.value)}
        rows={3}
      />
      <input placeholder="변수 순서 (예: x y z)" value={vars} onChange={e=>setVars(e.target.value)} />
      <button className="primary" onClick={calc} style={{marginTop: '12px'}}>계산</button>
      {out && <div className="small" style={{marginTop: '12px', fontWeight: '600'}}>
          {'result' in out ? `결과: ${out.result}` : <span style={{color: '#ef4444'}}>오류: {out.error}</span>}
        </div>}
    </div>
  );
}

function CalculusCard() {
  const [op, setOp] = useState<'diff'|'int'>('diff');
  const [expr, setExpr] = useState('sin(x) * x**2');
  const [variable, setVar] = useState('x');
  const [lower, setLower] = useState('0');
  const [upper, setUpper] = useState('pi');
  const [out, setOut] = useState<any>(null);

  async function calc() {
    const payload: any = { operation: op, expression: expr, variable };
    // 정적분일 경우에만 상한/하한 값을 페이로드에 포함
    if (op === 'int' && lower.trim() && upper.trim()) {
      payload.lower_bound = lower;
      payload.upper_bound = upper;
    }
    const res = await calculus(payload);
    setOut(res);
  }

  return (
    <div className="card">
      <h3>미분 / 적분</h3>
      <div className="row">
        <select value={op} onChange={e => setOp(e.target.value as any)} style={{flex: '0 1 120px'}}>
          <option value="diff">미분</option>
          <option value="int">적분</option>
        </select>
        <input placeholder="함수 f(x)" value={expr} onChange={e => setExpr(e.target.value)} />
        <input placeholder="변수" value={variable} onChange={e => setVar(e.target.value)} style={{flex: '0 1 60px'}}/>
      </div>
      {op === 'int' && (
        <div className="row" style={{marginTop: '12px'}}>
          <input placeholder="적분 하한 (a)" value={lower} onChange={e => setLower(e.target.value)} />
          <input placeholder="적분 상한 (b)" value={upper} onChange={e => setUpper(e.target.value)} />
        </div>
      )}
      <button className="primary" onClick={calc} style={{marginTop: '12px'}}>계산</button>
      {out && <div className="small" style={{marginTop: '12px', fontWeight: '600'}}>
          {'result' in out ? `결과: ${out.result}` : <span style={{color: '#ef4444'}}>오류: {out.error}</span>}
        </div>}
    </div>
  );
}
