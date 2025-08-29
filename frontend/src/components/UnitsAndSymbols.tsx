import React from 'react';
import './UnitsAndSymbols.css'; // 스타일을 위한 CSS 파일 임포트

export default function UnitsAndSymbols() {
  return (
    <div className="units-container">
      <h3>🔌 전기공학 기본 단위 및 기호 정리</h3>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>구분</th>
              <th>항목</th>
              <th>단위</th>
              <th>기호</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td rowSpan={5} className="category"><strong>기본량</strong></td>
              <td>전류 (Current)</td>
              <td>암페어</td>
              <td>A</td>
            </tr>
            <tr>
              <td>전압 (Voltage)</td>
              <td>볼트</td>
              <td>V</td>
            </tr>
            <tr>
              <td>저항 (Resistance)</td>
              <td>옴</td>
              <td>Ω</td>
            </tr>
            <tr>
              <td>전력 (Power)</td>
              <td>와트</td>
              <td>W</td>
            </tr>
            <tr>
              <td>에너지 (Energy)</td>
              <td>줄, 와트시</td>
              <td>J, Wh</td>
            </tr>
            <tr>
              <td rowSpan={5} className="category"><strong>교류 (AC)</strong></td>
              <td>주파수 (Frequency)</td>
              <td>헤르츠</td>
              <td>Hz</td>
            </tr>
            <tr>
              <td>임피던스 (Impedance)</td>
              <td>옴</td>
              <td>Z</td>
            </tr>
            <tr>
              <td>리액턴스 (Reactance)</td>
              <td>옴</td>
              <td>X</td>
            </tr>
            <tr>
              <td>역률 (Power Factor)</td>
              <td>-</td>
              <td>pf, cos(θ)</td>
            </tr>
            <tr>
              <td>위상각 (Phase Angle)</td>
              <td>도, 라디안</td>
              <td>θ, φ</td>
            </tr>
            <tr>
              <td rowSpan={3} className="category"><strong>자기장</strong></td>
              <td>자속 (Magnetic Flux)</td>
              <td>웨버</td>
              <td>Wb</td>
            </tr>
            <tr>
              <td>자속 밀도 (Flux Density)</td>
              <td>테슬라</td>
              <td>T</td>
            </tr>
            <tr>
              <td>인덕턴스 (Inductance)</td>
              <td>헨리</td>
              <td>H</td>
            </tr>
            <tr>
              <td rowSpan={2} className="category"><strong>전기장</strong></td>
              <td>전하 (Electric Charge)</td>
              <td>쿨롱</td>
              <td>C</td>
            </tr>
            <tr>
              <td>커패시턴스 (Capacitance)</td>
              <td>패럿</td>
              <td>F</td>
            </tr>
            <tr>
              <td rowSpan={3} className="category"><strong>기타</strong></td>
              <td>효율 (Efficiency)</td>
              <td>-</td>
              <td>η</td>
            </tr>
            <tr>
              <td>고조파 (Harmonics)</td>
              <td>-</td>
              <td>THD</td>
            </tr>
            <tr>
              <td>퍼유닛 (Per Unit)</td>
              <td>-</td>
              <td>pu</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
