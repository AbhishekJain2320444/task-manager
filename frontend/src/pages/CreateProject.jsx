import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function CreateProject() {
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/projects', form);
      nav(`/projects/${data.id}`);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create project');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <Link to="/" style={styles.back}>← Back</Link>
        <h2 style={styles.title}>New Project</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={submit}>
          <label style={styles.label}>Project Name</label>
          <input style={styles.input} placeholder="e.g. Website Redesign"
            value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <label style={styles.label}>Description (optional)</label>
          <textarea style={{...styles.input, height:90, resize:'vertical'}} placeholder="What is this project about?"
            value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          <button style={styles.btn} type="submit">Create Project</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page:  { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f5f5' },
  card:  { background:'#fff', padding:'2rem', borderRadius:12, boxShadow:'0 2px 12px rgba(0,0,0,.08)', width:420 },
  back:  { fontSize:13, color:'#4F46E5', textDecoration:'none' },
  title: { margin:'12px 0 1.5rem', fontSize:22 },
  label: { display:'block', fontSize:13, fontWeight:500, marginBottom:4, color:'#444' },
  input: { width:'100%', padding:'10px 12px', marginBottom:16, border:'1px solid #ddd', borderRadius:8, fontSize:14, boxSizing:'border-box' },
  btn:   { width:'100%', padding:'11px', background:'#4F46E5', color:'#fff', border:'none', borderRadius:8, fontSize:15, cursor:'pointer' },
  error: { background:'#fef2f2', color:'#dc2626', padding:'8px 12px', borderRadius:6, fontSize:13, marginBottom:12 },
};
