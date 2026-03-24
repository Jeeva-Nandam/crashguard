import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import './Overview.css';

const riskColor = { 'HIGH RISK': 'var(--ember)', 'MEDIUM RISK': 'var(--amber)', 'LOW RISK': 'var(--acid)' };
const riskBadge = { 'HIGH RISK': 'badge-red', 'MEDIUM RISK': 'badge-amber', 'LOW RISK': 'badge-green' };

export default function Overview() {
  const { user } = useAuth();
  const [latest, setLatest] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/analysis/history?limit=5')
      .then(({ data }) => {
        setAnalyses(data.analyses);
        if (data.analyses.length > 0) setLatest(data.analyses[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const fname = user?.full_name?.split(' ')[0] || 'there';
  const hours = new Date().getHours();
  const greeting = hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening';

  const score = latest?.result?.crash_score;
  const scoreAngle = score ? (score / 100) * 180 : 0;

  return (
    <div className="overview-page animate-fadeUp">
      {/* Greeting */}
      <div className="greeting-section">
        <h1>{greeting}, {fname}. <span className="wave">👋</span></h1>
        <p style={{color:'var(--text-3)', marginTop:4}}>
          {latest
            ? `Last analysis: ${new Date(latest.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}`
            : "Run your first analysis to see insights here."}
        </p>
      </div>

      {loading ? (
        <div className="loading-grid">
          {[1,2,3,4].map(i => <div key={i} className="skeleton-card" />)}
        </div>
      ) : latest ? (
        <>
          {/* Score gauge + key metrics */}
          <div className="overview-grid">
            {/* Gauge card */}
            <div className="gauge-card card animate-fadeUp delay-1">
              <div className="gauge-label">Crash Risk Score</div>
              <div className="gauge-wrap">
                <svg viewBox="0 0 200 110" className="gauge-svg">
                  <defs>
                    <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00ff87"/>
                      <stop offset="50%" stopColor="#f59e0b"/>
                      <stop offset="100%" stopColor="#ff4d4d"/>
                    </linearGradient>
                  </defs>
                  {/* Track */}
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" strokeLinecap="round"/>
                  {/* Fill */}
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gaugeGrad)" strokeWidth="14" strokeLinecap="round"
                    strokeDasharray={`${(score/100)*251} 251`}
                  />
                  {/* Needle */}
                  <g transform={`rotate(${scoreAngle - 90}, 100, 100)`}>
                    <line x1="100" y1="100" x2="100" y2="32" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="100" cy="100" r="5" fill="white"/>
                  </g>
                  <text x="100" y="92" textAnchor="middle" fill="white" fontSize="28" fontFamily="Syne" fontWeight="800">{score}</text>
                  <text x="100" y="108" textAnchor="middle" fill="#5a6882" fontSize="10" fontFamily="DM Mono">/100</text>
                </svg>
              </div>
              <div className="gauge-risk" style={{color: riskColor[latest.result.risk_level]}}>
                {latest.result.risk_level}
              </div>
              {latest.result.predicted_zero_cash_date && (
                <div className="gauge-date">
                  <span>Predicted crash</span>
                  <strong>{latest.result.predicted_zero_cash_date}</strong>
                </div>
              )}
            </div>

            {/* Sub-score cards */}
            <div className="sub-scores">
              {Object.entries(latest.result.risk_sub_scores).map(([key, val], i) => {
                const label = {revenue_risk:'Revenue',expense_risk:'Expense',runway_risk:'Runway',churn_risk:'Churn'}[key];
                const col = val >= 70 ? 'var(--ember)' : val >= 40 ? 'var(--amber)' : 'var(--acid)';
                return (
                  <div key={key} className={`score-chip card animate-fadeUp delay-${i+2}`}>
                    <div className="score-chip-top">
                      <span className="score-chip-label">{label} Risk</span>
                      <span className="score-chip-val mono" style={{color:col}}>{val}</span>
                    </div>
                    <div className="score-bar-track">
                      <div className="score-bar-fill" style={{width:`${val}%`, background:col}} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key metrics row */}
          <div className="metrics-row animate-fadeUp delay-3">
            {[
              { label: 'Revenue Trend', value: `${latest.result.metrics.revenue_trend.percentage}%`, sub: latest.result.metrics.revenue_trend.status, col: latest.result.metrics.revenue_trend.status === 'Growing' ? 'var(--acid)' : 'var(--ember)' },
              { label: 'Burn Rate / mo', value: `₹${latest.result.metrics.burn_rate.amount_per_month?.toLocaleString('en-IN')}`, sub: 'Monthly net burn', col: 'var(--amber)' },
              { label: 'Runway', value: latest.result.metrics.runway.days_remaining ? `${latest.result.metrics.runway.days_remaining}d` : '∞', sub: latest.result.metrics.runway.status, col: 'var(--blue)' },
              { label: 'Expense Trend', value: `${latest.result.metrics.expense_trend.percentage}%`, sub: latest.result.metrics.expense_trend.status, col: latest.result.metrics.expense_trend.status === 'Reducing' ? 'var(--acid)' : 'var(--ember)' },
            ].map(m => (
              <div key={m.label} className="metric-card card">
                <span className="metric-label">{m.label}</span>
                <span className="metric-value mono" style={{color: m.col}}>{m.value}</span>
                <span className="metric-sub">{m.sub}</span>
              </div>
            ))}
          </div>

          {/* Explanation + actions */}
          <div className="insight-row animate-fadeUp delay-4">
            <div className="insight-card card">
              <div className="insight-icon">💡</div>
              <div>
                <h4>Why is this the risk level?</h4>
                <p>{latest.result.explanation}</p>
              </div>
            </div>
            <div className="actions-card card">
              <h4>Recommended actions</h4>
              <ul className="action-list">
                {latest.result.recommended_actions.map((a, i) => (
                  <li key={i}><span className="action-dot">→</span>{a}</li>
                ))}
              </ul>
              <div className="improvement-tag">
                <span>📈</span>
                <span>{latest.result.improvement_projection}</span>
              </div>
            </div>
          </div>

          {/* Recent analyses */}
          {analyses.length > 1 && (
            <div className="recent-section animate-fadeUp delay-5">
              <div className="section-header">
                <h3>Recent analyses</h3>
                <Link to="/dashboard/history" className="see-all">View all →</Link>
              </div>
              <div className="recent-list">
                {analyses.slice(1).map(a => (
                  <div key={a.id} className="recent-item card">
                    <div className="recent-info">
                      <span className="recent-label">{a.label}</span>
                      <span className="recent-date">{new Date(a.created_at).toLocaleDateString('en-IN', {day:'numeric',month:'short'})}</span>
                    </div>
                    <span className={`badge ${riskBadge[a.result.risk_level]}`}>{a.result.crash_score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state card">
          <div className="empty-icon">⬡</div>
          <h3>No analyses yet</h3>
          <p>Run your first financial analysis to see crash predictions and risk scores.</p>
          <Link to="/dashboard/analyze" className="btn btn-primary">Run analysis →</Link>
        </div>
      )}
    </div>
  );
}
