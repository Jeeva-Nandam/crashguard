import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer
} from 'recharts';
import './History.css';

const riskColor = { 'HIGH RISK': 'var(--ember)', 'MEDIUM RISK': 'var(--amber)', 'LOW RISK': 'var(--acid)' };
const riskBadgeClass = { 'HIGH RISK': 'badge-red', 'MEDIUM RISK': 'badge-amber', 'LOW RISK': 'badge-green' };

export default function History() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const toast = useToast();
  const nav = useNavigate();

  const load = () => {
    setLoading(true);
    API.get('/analysis/history?limit=50')
      .then(({ data }) => setAnalyses(data.analyses))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this analysis?')) return;
    setDeleting(id);
    try {
      await API.delete(`/analysis/${id}`);
      setAnalyses(prev => prev.filter(a => a.id !== id));
      if (expanded === id) setExpanded(null);
      toast('Analysis deleted.', 'info');
    } catch {
      toast('Delete failed.', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const toggle = (id) => setExpanded(prev => prev === id ? null : id);

  if (loading) return (
    <div className="history-page">
      <div className="page-header"><h1>History</h1></div>
      <div className="history-skeleton">
        {[1,2,3,4,5].map(i => <div key={i} className="skeleton-card" style={{height:80}} />)}
      </div>
    </div>
  );

  return (
    <div className="history-page animate-fadeUp">
      <div className="page-header">
        <h1>Analysis History</h1>
        <p>{analyses.length} saved {analyses.length === 1 ? 'analysis' : 'analyses'} — click any row to expand</p>
      </div>

      {analyses.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">◷</div>
          <h3>No history yet</h3>
          <p>Your saved analyses will appear here after you run your first report.</p>
          <button className="btn btn-primary" onClick={() => nav('/dashboard/analyze')}>Run analysis →</button>
        </div>
      ) : (
        <div className="history-list">
          {analyses.map((a, idx) => {
            const isOpen = expanded === a.id;
            const r = a.result;
            const score = r.crash_score;
            const col = riskColor[r.risk_level];

            // mini chart data
            const miniData = r.revenue?.map((rev, i) => ({
              m: r.months?.[i] || `M${i+1}`,
              rev,
              exp: r.expenses?.[i] ?? 0,
            })) ?? [];

            return (
              <div
                key={a.id}
                className={`history-item card animate-fadeUp delay-${Math.min(idx+1,5)} ${isOpen ? 'open' : ''}`}
                onClick={() => toggle(a.id)}
              >
                {/* Row summary */}
                <div className="history-row">
                  <div className="history-left">
                    <div className="history-score-ring" style={{'--ring-color': col}}>
                      <span style={{color: col}} className="mono">{score}</span>
                    </div>
                    <div className="history-meta">
                      <span className="history-label">{a.label}</span>
                      <span className="history-date">
                        {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="history-right">
                    <span className={`badge ${riskBadgeClass[r.risk_level]}`}>{r.risk_level}</span>
                    <span className="history-burn mono">
                      ₹{r.metrics?.burn_rate?.amount_per_month?.toLocaleString('en-IN') ?? '—'}/mo
                    </span>
                    <span className="history-runway">
                      {r.metrics?.runway?.days_remaining == null ? '∞' : `${r.metrics.runway.days_remaining}d`}
                    </span>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={(e) => handleDelete(a.id, e)}
                      disabled={deleting === a.id}
                    >
                      {deleting === a.id ? '…' : '✕'}
                    </button>
                    <span className="expand-chevron">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="history-detail" onClick={e => e.stopPropagation()}>
                    <div className="divider" />

                    {/* Sub scores */}
                    <div className="detail-scores">
                      {Object.entries(r.risk_sub_scores).map(([k, v]) => {
                        const lbl = {revenue_risk:'Revenue',expense_risk:'Expense',runway_risk:'Runway',churn_risk:'Churn'}[k];
                        const c = v >= 70 ? 'var(--ember)' : v >= 40 ? 'var(--amber)' : 'var(--acid)';
                        return (
                          <div key={k} className="detail-score-chip">
                            <span className="dsc-label">{lbl}</span>
                            <span className="dsc-val mono" style={{color:c}}>{v}</span>
                            <div className="score-bar-track"><div className="score-bar-fill" style={{width:`${v}%`,background:c}} /></div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="detail-body">
                      {/* Mini chart */}
                      {miniData.length > 0 && (
                        <div className="mini-chart">
                          <h4>Revenue vs Expenses</h4>
                          <ResponsiveContainer width="100%" height={160}>
                            <AreaChart data={miniData} margin={{top:5,right:5,bottom:0,left:0}}>
                              <defs>
                                <linearGradient id={`revG${a.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#00ff87" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#00ff87" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                              <XAxis dataKey="m" tick={{fill:'#5a6882',fontSize:10}} />
                              <YAxis tick={{fill:'#5a6882',fontSize:10}} />
                              <Tooltip contentStyle={{background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}} />
                              <Area type="monotone" dataKey="rev" stroke="#00ff87" fill={`url(#revG${a.id})`} strokeWidth={1.5} name="Revenue" />
                              <Area type="monotone" dataKey="exp" stroke="#ff4d4d" fill="none" strokeWidth={1.5} name="Expenses" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      <div className="detail-text">
                        <div className="detail-explanation">
                          <span className="detail-section-label">Analysis</span>
                          <p>{r.explanation}</p>
                        </div>
                        <div className="detail-actions-list">
                          <span className="detail-section-label">Actions</span>
                          {r.recommended_actions.map((a2, i) => (
                            <div key={i} className="detail-action-item">
                              <span style={{color:'var(--acid)'}}>→</span> {a2}
                            </div>
                          ))}
                        </div>
                        {r.predicted_zero_cash_date && (
                          <div className="crash-date-tag" style={{marginTop:12}}>
                            ⚠ Predicted zero cash: <strong>{r.predicted_zero_cash_date}</strong>
                          </div>
                        )}
                        <div className="detail-improvement">
                          <span>📈</span> {r.improvement_projection}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
