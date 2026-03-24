import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import './Onboarding.css';

const INDUSTRIES = ['SaaS', 'Ecommerce', 'Agency', 'Other'];
const STAGES = ['Startup', 'Growth', 'Mature'];

export default function Onboarding() {
  const { updateUser } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    company_name: '',
    industry_type: '',
    business_stage: '',
    number_of_employees: '',
    monthly_recurring_revenue: '',
    website: '',
  });

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const pick = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.company_name || !form.industry_type || !form.business_stage || !form.number_of_employees) {
      return toast('Please fill all required fields.', 'error');
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        number_of_employees: Number(form.number_of_employees),
        monthly_recurring_revenue: form.monthly_recurring_revenue ? Number(form.monthly_recurring_revenue) : undefined,
      };
      const { data } = await API.post('/auth/onboarding/business-profile', payload);
      updateUser(data.user);
      toast('Profile saved! Welcome to CrashGuard.', 'success');
      nav('/dashboard');
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to save profile.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="auth-bg">
        <div className="orb orb-1" /><div className="orb orb-2" /><div className="grid-overlay" />
      </div>

      <div className="onboarding-wrapper animate-fadeUp">
        <div className="onboarding-header">
          <div className="brand-mark" style={{justifyContent:'center'}}>
            <div className="brand-icon" style={{fontSize:24}}>⬡</div>
            <span className="brand-name">CrashGuard</span>
          </div>
          <div style={{marginTop: 32}}>
            <span className="badge badge-green" style={{marginBottom: 16, display:'inline-block'}}>Step 2 of 2</span>
            <h1>Set up your<br /><span className="accent-text">business profile</span></h1>
            <p>This helps us calibrate risk scoring to your specific industry and stage.</p>
          </div>
        </div>

        <form onSubmit={submit} className="onboarding-form">
          <div className="ob-section">
            <h3>Company details</h3>
            <div className="field-row">
              <div className="field">
                <label>Company name *</label>
                <input name="company_name" placeholder="Acme Inc." value={form.company_name} onChange={handle} required />
              </div>
              <div className="field">
                <label>Website <span className="optional-tag">optional</span></label>
                <input name="website" placeholder="https://acme.io" value={form.website} onChange={handle} />
              </div>
            </div>
          </div>

          <div className="ob-section">
            <h3>Industry <span className="req">*</span></h3>
            <div className="pill-grid">
              {INDUSTRIES.map(i => (
                <button type="button" key={i}
                  className={`pill ${form.industry_type === i ? 'active' : ''}`}
                  onClick={() => pick('industry_type', i)}>
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div className="ob-section">
            <h3>Business stage <span className="req">*</span></h3>
            <div className="stage-grid">
              {STAGES.map((s, idx) => (
                <button type="button" key={s}
                  className={`stage-card ${form.business_stage === s ? 'active' : ''}`}
                  onClick={() => pick('business_stage', s)}>
                  <span className="stage-icon">{['🌱','🚀','🏛️'][idx]}</span>
                  <span className="stage-name">{s}</span>
                  <span className="stage-desc">{['Pre-PMF, building','Scaling fast','Established'][idx]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ob-section">
            <h3>Team & revenue</h3>
            <div className="field-row">
              <div className="field">
                <label>Employees *</label>
                <input name="number_of_employees" type="number" min="1" placeholder="12" value={form.number_of_employees} onChange={handle} required />
              </div>
              <div className="field">
                <label>Monthly Revenue Range <span className="optional-tag">optional</span></label>
                <input name="monthly_recurring_revenue" type="number" placeholder="50000" value={form.monthly_recurring_revenue} onChange={handle} />
              </div>
            </div>
          </div>

          <div className="ob-section">
            <h3>Future integrations <span className="badge badge-blue" style={{fontSize:10, verticalAlign:'middle', marginLeft:8}}>Coming soon</span></h3>
            <div className="integration-grid">
              {[['Stripe','Revenue sync','#635BFF'],['QuickBooks','Expense sync','#2CA01C'],['Google Sheets','Manual import','#0F9D58']].map(([name,desc,color]) => (
                <div key={name} className="integration-card">
                  <div className="integration-dot" style={{background: color}} />
                  <div>
                    <div className="integration-name">{name}</div>
                    <div className="integration-desc">{desc}</div>
                  </div>
                  <span className="badge badge-amber" style={{fontSize:10}}>Soon</span>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <><span className="spinner" style={{width:16,height:16}} /> Saving…</> : 'Launch dashboard →'}
          </button>
        </form>
      </div>
    </div>
  );
}
