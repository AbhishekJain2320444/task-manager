import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';

const STATUS_COLORS = { todo:'#f1f5f9', in_progress:'#fef9c3', done:'#dcfce7' };
const PRIORITY_COLORS = { high:'#fee2e2', medium:'#fef9c3', low:'#f0fdf4' };
const PRIORITY_TEXT = { high:'#dc2626', medium:'#92400e', low:'#15803d' };

export default function ProjectDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showMember, setShowMember] = useState(false);
  const [newTask, setNewTask] = useState({ title:'', description:'', assignee_id:'', due_date:'', priority:'medium' });
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [msg, setMsg] = useState('');

  const load = async () => {
    const [proj, tsks] = await Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/projects/${id}/tasks`),
    ]);
    setProject(proj.data);
    setTasks(tsks.data);
  };

  useEffect(() => { load(); }, [id]);

  const addTask = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/tasks`, newTask);
      setNewTask({ title:'', description:'', assignee_id:'', due_date:'', priority:'medium' });
      setShowForm(false);
      load();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
  };

  const updateStatus = async (taskId, status) => {
    await api.patch(`/projects/${id}/tasks/${taskId}`, { status });
    load();
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/projects/${id}/tasks/${taskId}`);
    load();
  };

  const addMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail, role: memberRole });
      setMsg('Member added!'); setMemberEmail(''); setShowMember(false);
      load();
    } catch (e) { setMsg(e.response?.data?.error || 'Error'); }
  };

  if (!project) return <div style={{ padding:'2rem', color:'#999' }}>Loading...</div>;

  const isAdmin = project.myRole === 'admin';
  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done');
  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <Link to="/" style={s.back}>← Dashboard</Link>
        <div>
          <h1 style={s.h1}>{project.name}</h1>
          {project.description && <p style={s.desc}>{project.description}</p>}
        </div>
        <span style={{...s.badge, background: isAdmin ? '#ede9fe' : '#f0fdf4',
          color: isAdmin ? '#6d28d9' : '#16a34a'}}>{project.myRole}</span>
      </header>

      {/* Stats */}
      <div style={s.statsRow}>
        {[['Total', stats.total, '#e0e7ff', '#4338ca'],
          ['To Do', stats.todo, '#f1f5f9', '#475569'],
          ['In Progress', stats.in_progress, '#fef9c3', '#92400e'],
          ['Done', stats.done, '#dcfce7', '#15803d'],
          ['Overdue', overdue.length, '#fee2e2', '#dc2626']
        ].map(([label, val, bg, color]) => (
          <div key={label} style={{...s.stat, background: bg}}>
            <span style={{...s.statNum, color}}>{val}</span>
            <span style={s.statLabel}>{label}</span>
          </div>
        ))}
      </div>

      {msg && <p style={s.success}>{msg}</p>}

      <div style={s.body}>
        {/* Tasks section */}
        <div style={s.tasksSection}>
          <div style={s.sectionTop}>
            <h2 style={s.h2}>Tasks</h2>
            <button onClick={() => setShowForm(!showForm)} style={s.btn}>+ Add Task</button>
          </div>

          {showForm && (
            <form onSubmit={addTask} style={s.form}>
              <input style={s.input} placeholder="Task title *" required
                value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
              <textarea style={{...s.input, height:64, resize:'vertical'}} placeholder="Description"
                value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
              <div style={s.row}>
                <select style={s.input} value={newTask.assignee_id}
                  onChange={e => setNewTask({...newTask, assignee_id: e.target.value})}>
                  <option value="">Unassigned</option>
                  {project.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <select style={s.input} value={newTask.priority}
                  onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <input style={s.input} type="date" value={newTask.due_date}
                  onChange={e => setNewTask({...newTask, due_date: e.target.value})} />
              </div>
              <div style={s.row}>
                <button type="submit" style={s.btn}>Create</button>
                <button type="button" onClick={() => setShowForm(false)} style={s.outlineBtn}>Cancel</button>
              </div>
            </form>
          )}

          {!tasks.length && <p style={s.muted}>No tasks yet. Add one above!</p>}

          {tasks.map(task => {
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
            return (
              <div key={task.id} style={{...s.taskCard, borderLeft: `4px solid ${isOverdue ? '#f87171' : '#e2e8f0'}`}}>
                <div style={s.taskTop}>
                  <strong style={s.taskTitle}>{task.title}</strong>
                  <div style={s.taskActions}>
                    <select value={task.status} onChange={e => updateStatus(task.id, e.target.value)}
                      style={{...s.statusSelect, background: STATUS_COLORS[task.status]}}>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                    <button onClick={() => deleteTask(task.id)} style={s.delBtn}>✕</button>
                  </div>
                </div>
                {task.description && <p style={s.taskDesc}>{task.description}</p>}
                <div style={s.taskMeta}>
                  <span style={{...s.tag, background: PRIORITY_COLORS[task.priority], color: PRIORITY_TEXT[task.priority]}}>
                    {task.priority}
                  </span>
                  {task.assignee_name && <span style={s.tag}>👤 {task.assignee_name}</span>}
                  {task.due_date && (
                    <span style={{...s.tag, color: isOverdue ? '#dc2626' : '#555'}}>
                      📅 {new Date(task.due_date).toLocaleDateString()}{isOverdue ? ' ⚠ Overdue' : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Members sidebar */}
        <div style={s.sidebar}>
          <div style={s.sectionTop}>
            <h2 style={s.h2}>Members</h2>
            {isAdmin && <button onClick={() => setShowMember(!showMember)} style={s.btn}>+ Add</button>}
          </div>

          {isAdmin && showMember && (
            <form onSubmit={addMember} style={{marginBottom:16}}>
              <input style={s.input} placeholder="User email" required
                value={memberEmail} onChange={e => setMemberEmail(e.target.value)} />
              <select style={s.input} value={memberRole} onChange={e => setMemberRole(e.target.value)}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit" style={s.btn}>Add Member</button>
            </form>
          )}

          {project.members.map(m => (
            <div key={m.id} style={s.memberRow}>
              <div style={s.avatar}>{m.name[0].toUpperCase()}</div>
              <div>
                <div style={s.memberName}>{m.name}</div>
                <div style={s.memberEmail}>{m.email}</div>
              </div>
              <span style={{...s.badge, marginLeft:'auto',
                background: m.role === 'admin' ? '#ede9fe' : '#f0fdf4',
                color: m.role === 'admin' ? '#6d28d9' : '#16a34a'}}>
                {m.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  page:        { minHeight:'100vh', background:'#f8f9fa' },
  header:      { background:'#fff', padding:'1rem 2rem', display:'flex', alignItems:'center', gap:16, borderBottom:'1px solid #eee', flexWrap:'wrap' },
  back:        { fontSize:13, color:'#4F46E5', textDecoration:'none', whiteSpace:'nowrap' },
  h1:          { margin:'0 0 2px', fontSize:20 },
  desc:        { margin:0, fontSize:13, color:'#666' },
  badge:       { padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:500, whiteSpace:'nowrap' },
  statsRow:    { display:'flex', gap:12, padding:'1rem 2rem', flexWrap:'wrap' },
  stat:        { padding:'12px 20px', borderRadius:10, minWidth:80, textAlign:'center' },
  statNum:     { display:'block', fontSize:24, fontWeight:700 },
  statLabel:   { fontSize:12, color:'#555' },
  body:        { display:'flex', gap:24, padding:'0 2rem 2rem', alignItems:'flex-start', flexWrap:'wrap' },
  tasksSection:{ flex:'1 1 500px' },
  sidebar:     { flex:'0 0 280px', background:'#fff', borderRadius:10, padding:'1.25rem', boxShadow:'0 1px 4px rgba(0,0,0,.06)' },
  sectionTop:  { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  h2:          { margin:0, fontSize:16, fontWeight:600 },
  btn:         { padding:'7px 16px', background:'#4F46E5', color:'#fff', border:'none', borderRadius:7, fontSize:13, cursor:'pointer' },
  outlineBtn:  { padding:'7px 16px', background:'none', color:'#555', border:'1px solid #ddd', borderRadius:7, fontSize:13, cursor:'pointer' },
  form:        { background:'#fff', borderRadius:10, padding:'1rem', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,.06)' },
  input:       { width:'100%', padding:'8px 10px', marginBottom:10, border:'1px solid #ddd', borderRadius:7, fontSize:13, boxSizing:'border-box' },
  row:         { display:'flex', gap:8 },
  taskCard:    { background:'#fff', borderRadius:10, padding:'1rem', marginBottom:10, boxShadow:'0 1px 4px rgba(0,0,0,.05)' },
  taskTop:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 },
  taskTitle:   { fontSize:14 },
  taskActions: { display:'flex', gap:8, alignItems:'center' },
  statusSelect:{ padding:'4px 8px', border:'1px solid #ddd', borderRadius:6, fontSize:12, cursor:'pointer' },
  delBtn:      { background:'none', border:'none', color:'#ccc', cursor:'pointer', fontSize:16, lineHeight:1 },
  taskDesc:    { fontSize:13, color:'#666', margin:'4px 0 8px' },
  taskMeta:    { display:'flex', gap:8, flexWrap:'wrap' },
  tag:         { fontSize:11, padding:'2px 8px', borderRadius:20, background:'#f1f5f9', color:'#444' },
  memberRow:   { display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid #f5f5f5' },
  avatar:      { width:32, height:32, borderRadius:'50%', background:'#e0e7ff', color:'#4338ca', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:600, fontSize:13 },
  memberName:  { fontSize:13, fontWeight:500 },
  memberEmail: { fontSize:11, color:'#999' },
  success:     { background:'#f0fdf4', color:'#15803d', padding:'8px 2rem', fontSize:13 },
  muted:       { color:'#999', fontSize:13 },
};
