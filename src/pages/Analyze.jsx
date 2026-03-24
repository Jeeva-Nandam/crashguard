import { useState } from 'react';
import { API } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from 'recharts';
import './Analyze.css';

const CT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="ct-label">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="ct-row">
          <span className="ct-dot" style={{background:p.color}}/>
          <span>{p.name}</span>
          <span className="ct-val">
            {typeof p.value === 'number'
              ? p.value.toLocaleString('en-IN', {maximumFractionDigits:2})
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function Analyze() {
  const toast = useToast();
  const [tab, setTab] = useState('manual');
  const [months, setMonths] = useState(0);
  const [revenue, setRevenue] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cash, setCash] = useState('');
  const [label, setLabel] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [chartFilter, setChartFilter] = useState(6);

  const handleMonthChange = (v) => {
    const m = Number(v);
    setMonths(m);
    setRevenue(Array(m).fill(''));
    setExpenses(Array(m).fill(''));
    setCustomers(Array(m).fill(''));
  };

  const setArr = (setter, arr, i, val) => {
    const c = [...arr]; c[i] = val; setter(c);
  };

  const runManual = async () => {
    if (!cash || revenue.some(v => v === '') || expenses.some(v => v === '') || customers.some(v => v === '')) {
      return toast('Please fill all fields.', 'error');
    }
    setLoading(true);
    try {
      const { data } = await API.post('/analysis/analyze', {
        label: label || undefined,
        input_data: {
          revenue: revenue.map(Number),
          expenses: expenses.map(Number),
          customers: customers.map(Number),
          cash_in_hand: Number(cash),
        }
      });
      setResult(data);
      toast('Analysis complete!', 'success');
    } catch (e) {
      toast(e.response?.data?.detail || 'Analysis failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const runCSV = async () => {
    if (!file || !cash) return toast('Select a file and enter cash.', 'error');
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('cash_in_hand', cash);
    if (label) fd.append('label', label);
    try {
      const { data } = await API.post('/analysis/upload-csv', fd);
      setResult(data);
      toast('CSV analyzed!', 'success');
    } catch (e) {
      const issues = e.response?.data?.issues;
      toast(issues ? issues.join(', ') : 'Upload failed.', 'error');
    } finally {
      setLoading(false);
    }
  };


  const downloadTemplate = () => {
  const csvContent = `month,revenue,expenses,customers
1,0,0,0
2,0,0,0
3,0,0,0
4,0,0,0`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'analysis_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  // Prepare chart data
  const chartData = result
    ? result.revenue.map((rev, i) => ({
        month: result.months[i],
        revenue: rev,
        expenses: result.expenses[i],
        profit: rev - result.expenses[i],
        churn: result.churn_rate[i] ?? 0,
      }))
    : [];

  const filteredData = chartData.slice(-Math.min(chartFilter, chartData.length));

  const riskData = result
    ? [
        { subject: 'Revenue', value: result.risk_sub_scores.revenue_risk },
        { subject: 'Expense', value: result.risk_sub_scores.expense_risk },
        { subject: 'Runway', value: result.risk_sub_scores.runway_risk },
        { subject: 'Churn', value: result.risk_sub_scores.churn_risk },
      ]
    : [];

  const riskColor = { 'HIGH RISK': 'var(--ember)', 'MEDIUM RISK': 'var(--amber)', 'LOW RISK': 'var(--acid)' };
  const filterOpts = [6,12,24,chartData.length].filter((v,i,a) => a.indexOf(v)===i);

  return (
    <div className="analyze-page">
      <div className="page-header">
        <h1>Run Analysis</h1>
        <p>Enter financial data manually or upload a CSV to generate your crash prediction report.</p>
      </div>

      <div className="tab-bar animate-fadeUp">
        {['manual','csv'].map(t => (
          <button key={t} className={`tab-btn ${tab===t?'active':''}`} onClick={() => { setTab(t); setResult(null); }}>
            {t === 'manual' ? '⌨ Manual entry' : '📄 Upload CSV'}
          </button>
        ))}
      </div>

      {!result && (
        <div className="input-panel card animate-fadeUp delay-1">
          <div className="field">
            <label>Analysis label <span className="optional-tag">optional</span></label>
            <input placeholder="e.g. Q3 2025 review" value={label} onChange={e => setLabel(e.target.value)} />
          </div>

          {tab === 'manual' && (
            <>
              <div className="field">
                <label>Number of months</label>
                <input type="number" min="6" max="36" placeholder="Enter number (min 6)" value={months || ''} onChange={e => handleMonthChange(e.target.value)} />
              </div>

              {months > 0 && (
                <div className="months-grid">
                  {[...Array(months)].map((_, i) => (
                    <div key={i} className="month-row card" style={{background:'var(--surface-2)'}}>
                      <div className="month-tag">M{i+1}</div>
                      <div className="month-fields">
                        <div className="field">
                          <label>Revenue</label>
                          <input type="number" placeholder="₹" value={revenue[i]} onChange={e => setArr(setRevenue, revenue, i, e.target.value)} />
                        </div>
                        <div className="field">
                          <label>Expenses</label>
                          <input type="number" placeholder="₹" value={expenses[i]} onChange={e => setArr(setExpenses, expenses, i, e.target.value)} />
                        </div>
                        <div className="field">
                          <label>Customers</label>
                          <input type="number" placeholder="0" value={customers[i]} onChange={e => setArr(setCustomers, customers, i, e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {months > 0 && (
                <div className="field">
                  <label>Cash in hand (₹)</label>
                  <input type="number" placeholder="e.g. 500000" value={cash} onChange={e => setCash(e.target.value)} />
                </div>
              )}

              {months >= 4 && (
                <button className="btn btn-primary btn-lg" onClick={runManual} disabled={loading}>
                  {loading ? <><span className="spinner" style={{width:16,height:16}} /> Analyzing…</> : '⬡ Run analysis →'}
                </button>
              )}
            </>
          )}

          {tab === 'csv' && (
            <>
              <div className="csv-upload-zone" onClick={() => document.getElementById('csv-file').click()}>
                <div className="csv-icon">📊</div>
                <p>{file ? file.name : 'Click to upload CSV'}</p>
                <span>Required columns: month, revenue, expenses, customers</span>
                <input id="csv-file" type="file" accept=".csv" style={{display:'none'}} onChange={e => setFile(e.target.files[0])} />
              </div>

              <button className="btn btn-secondary btn-sm" onClick={downloadTemplate}>
    Click to download CSV Template
    </button>

              <div className="field">
                <label>Cash in hand (₹)</label>
                <input type="number" placeholder="e.g. 500000" value={cash} onChange={e => setCash(e.target.value)} />
              </div>
              <button className="btn btn-primary btn-lg" onClick={runCSV} disabled={loading || !file || !cash}>
                {loading ? <><span className="spinner" style={{width:16,height:16}} /> Analyzing…</> : '⬡ Analyze CSV →'}
              </button>
            </>
          )}
        </div>
      )}

      {/* RESULTS */}
      {result && (
        <div className="results-section animate-fadeUp">
          <div className="results-header">
            <div>
              <h2>Results <span className="badge badge-green" style={{fontSize:11}}>Saved</span></h2>
              <p style={{color:'var(--text-3)',fontSize:13}}>{result.label}</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setResult(null)}>← New analysis</button>
          </div>

          {/* Score banner */}
          <div className="score-banner card" style={{borderColor: riskColor[result.risk_level], background: result.risk_level === 'HIGH RISK' ? 'var(--ember-dim)' : result.risk_level === 'MEDIUM RISK' ? 'var(--amber-dim)' : 'var(--acid-dim)'}}>
            <div className="score-left">
              <div className="score-number mono" style={{color: riskColor[result.risk_level]}}>{result.crash_score}</div>
              <div className="score-out">/ 100</div>
            </div>
            <div className="score-mid">
              <div className="score-risk" style={{color: riskColor[result.risk_level]}}>{result.risk_level}</div>
              <p>{result.explanation}</p>
              {result.predicted_zero_cash_date && (
                <div className="crash-date-tag">
                  ⚠ Predicted zero cash: <strong>{result.predicted_zero_cash_date}</strong>
                </div>
              )}
            </div>
            <div className="score-actions">
              {result.recommended_actions.map((a, i) => (
                <div key={i} className="action-pill">→ {a}</div>
              ))}
            </div>
          </div>

          {/* Metric tiles */}
          <div className="metric-tiles">
            {[
              {l:'Revenue Trend', v:`${result.metrics.revenue_trend.percentage}%`, s:result.metrics.revenue_trend.status, c: result.metrics.revenue_trend.status==='Growing'?'var(--acid)':'var(--ember)'},
              {l:'Expense Trend', v:`${result.metrics.expense_trend.percentage}%`, s:result.metrics.expense_trend.status, c: result.metrics.expense_trend.status==='Reducing'?'var(--acid)':'var(--ember)'},
              {l:'Burn Rate', v:`₹${result.metrics.burn_rate.amount_per_month?.toLocaleString('en-IN')}`, s:'per month', c:'var(--amber)'},
              {l:'Runway', v: result.metrics.runway.days_remaining===null?'∞':`${result.metrics.runway.days_remaining}d`, s:result.metrics.runway.status, c:'var(--blue)'},
            ].map(m => (
              <div key={m.l} className="metric-tile card">
                <span className="tile-label">{m.l}</span>
                <span className="tile-val mono" style={{color:m.c}}>{m.v}</span>
                <span className="tile-sub">{m.s}</span>
              </div>
            ))}
          </div>

          {/* Improvement */}
          <div className="improvement-banner card">
            <span>📈</span>
            <span>{result.improvement_projection}</span>
          </div>

          {/* Charts */}
          <div className="charts-block">
            <div className="chart-filter-row">
              <span>Filter</span>
              {filterOpts.map(v => (
                <button key={v} className={`filter-chip ${chartFilter===v?'active':''}`} onClick={() => setChartFilter(v)}>
                  {v === chartData.length ? 'All' : `${v}M`}
                </button>
              ))}
            </div>

            {/* Revenue vs Expenses */}
            <div className="chart-card card">
              <h3>📈 Revenue vs Expenses</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={filteredData} margin={{top:10,right:10,bottom:0,left:0}}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ff87" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00ff87" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff4d4d" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ff4d4d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{fill:'#5a6882',fontSize:12}} />
                  <YAxis tick={{fill:'#5a6882',fontSize:12}} />
                  <Tooltip content={<CT/>} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stroke="#00ff87" fill="url(#revGrad)" strokeWidth={2} name="Revenue" />
                  <Area type="monotone" dataKey="expenses" stroke="#ff4d4d" fill="url(#expGrad)" strokeWidth={2} name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Burn rate bar */}
            <div className="chart-card card">
              <h3>🔥 Burn Rate (Profit/Loss per Month)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={filteredData} margin={{top:10,right:10,bottom:0,left:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{fill:'#5a6882',fontSize:12}} />
                  <YAxis tick={{fill:'#5a6882',fontSize:12}} />
                  <Tooltip content={<CT/>} />
                  <Bar dataKey="profit" name="Profit/Loss" radius={[6,6,0,0]}>
                    {filteredData.map((e, i) => (
                      <Cell key={i} fill={e.profit >= 0 ? '#00ff87' : '#ff4d4d'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="charts-two-col">
              {/* Churn */}
              <div className="chart-card card">
                <h3>📉 Customer Churn Rate</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={filteredData} margin={{top:10,right:10,bottom:0,left:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{fill:'#5a6882',fontSize:12}} />
                    <YAxis tick={{fill:'#5a6882',fontSize:12}} />
                    <Tooltip content={<CT/>} />
                    <Line type="monotone" dataKey="churn" stroke="#3b82f6" strokeWidth={2.5} dot={{r:4,fill:'#3b82f6'}} name="Churn %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Radar */}
              <div className="chart-card card">
                <h3>⬡ Risk Radar</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={riskData} margin={{top:10,right:20,bottom:10,left:20}}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="subject" tick={{fill:'#9ba8c0',fontSize:12}} />
                    <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fill:'#5a6882',fontSize:10}} />
                    <Radar name="Risk" dataKey="value" stroke="#ff4d4d" fill="#ff4d4d" fillOpacity={0.25} strokeWidth={2} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
