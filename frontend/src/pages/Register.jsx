import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/register', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      nav('/');
    } catch (e) {
      setError(e.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>
        <p style={styles.sub}>Get started with Task Manager</p>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={submit}>
          <input style={styles.input} placeholder="Full Name"
            value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <input style={styles.input} placeholder="Email" type="email"
            value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <input style={styles.input} placeholder="Password" type="password"
            value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} />
          <button style={styles.btn} type="submit">Create Account</button>
        </form>
        <p style={styles.link}>Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}

const styles = {
  page:  { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f5f5' },
  card:  { background:'#fff', padding:'2rem', borderRadius:12, boxShadow:'0 2px 12px rgba(0,0,0,.08)', width:360 },
  title: { margin:'0 0 4px', fontSize:24 },
  sub:   { margin:'0 0 1.5rem', color:'#666', fontSize:14 },
  input: { width:'100%', padding:'10px 12px', marginBottom:12, border:'1px solid #ddd', borderRadius:8, fontSize:14, boxSizing:'border-box' },
  btn:   { width:'100%', padding:'11px', background:'#4F46E5', color:'#fff', border:'none', borderRadius:8, fontSize:15, cursor:'pointer' },
  error: { background:'#fef2f2', color:'#dc2626', padding:'8px 12px', borderRadius:6, fontSize:13, marginBottom:12 },
  link:  { marginTop:16, textAlign:'center', fontSize:13, color:'#666' },
};
