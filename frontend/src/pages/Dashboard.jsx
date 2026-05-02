import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    api.get('/projects').then(r => { setProjects(r.data); setLoading(false); });
  }, []);

  const logout = () => { localStorage.clear(); nav('/login'); };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <span style={styles.logo}>Task Manager</span>
        <div style={styles.user}>
          <span style={styles.userName}>{user.name}</span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.topRow}>
          <h2 style={styles.h2}>Your Projects</h2>
          <Link to="/projects/new" style={styles.newBtn}>+ New Project</Link>
        </div>

        {loading && <p style={styles.muted}>Loading...</p>}
        {!loading && !projects.length && (
          <div style={styles.empty}>
            <p>No projects yet.</p>
            <Link to="/projects/new" style={styles.newBtn}>Create your first project</Link>
          </div>
        )}

        <div style={styles.grid}>
          {projects.map(p => (
            <div key={p.id} style={styles.card} onClick={() => nav(`/projects/${p.id}`)}>
              <div style={styles.cardTop}>
                <strong>{p.name}</strong>
                <span style={{...styles.badge, background: p.role === 'admin' ? '#ede9fe' : '#f0fdf4',
                  color: p.role === 'admin' ? '#6d28d9' : '#16a34a'}}>
                  {p.role}
                </span>
              </div>
              {p.description && <p style={styles.desc}>{p.description}</p>}
              <p style={styles.date}>{new Date(p.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

const styles = {
  page:      { minHeight:'100vh', background:'#f8f9fa' },
  header:    { background:'#fff', padding:'0 2rem', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #eee' },
  logo:      { fontWeight:700, fontSize:18, color:'#4F46E5' },
  user:      { display:'flex', alignItems:'center', gap:12 },
  userName:  { fontSize:14, color:'#555' },
  logoutBtn: { padding:'6px 14px', border:'1px solid #ddd', borderRadius:6, background:'none', cursor:'pointer', fontSize:13 },
  main:      { maxWidth:900, margin:'0 auto', padding:'2rem 1rem' },
  topRow:    { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' },
  h2:        { margin:0, fontSize:20 },
  newBtn:    { padding:'8px 18px', background:'#4F46E5', color:'#fff', borderRadius:8, textDecoration:'none', fontSize:14 },
  grid:      { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 },
  card:      { background:'#fff', borderRadius:10, padding:'1.25rem', boxShadow:'0 1px 4px rgba(0,0,0,.06)', cursor:'pointer', transition:'box-shadow .15s' },
  cardTop:   { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 },
  badge:     { fontSize:11, padding:'2px 8px', borderRadius:20, fontWeight:500 },
  desc:      { fontSize:13, color:'#666', margin:'4px 0 8px' },
  date:      { fontSize:12, color:'#999', margin:0 },
  empty:     { textAlign:'center', padding:'3rem', color:'#888' },
  muted:     { color:'#999' },
};
