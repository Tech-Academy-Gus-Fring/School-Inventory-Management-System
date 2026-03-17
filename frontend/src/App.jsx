import { useEffect, useMemo, useState } from 'react';
import './App.css';

const apiBase = 'http://localhost:5000';

function setStatus(setter, text, isSuccess = true) {
  setter({ text, type: isSuccess ? 'success' : 'error' });
}

function getAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: 'Bearer ' + token } : {};
}

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [authMessage, setAuthMessage] = useState({ text: '', type: '' });
  const [equipment, setEquipment] = useState([]);
  const [requestMessage, setRequestMessage] = useState({ text: '', type: '' });
  const [adminMessage, setAdminMessage] = useState({ text: '', type: '' });
  const [form, setForm] = useState({ loginUsername: '', loginPassword: '', registerUsername: '', registerEmail: '', registerPassword: '', registerRole: 'student', requestQuantity: 1, equipmentId: '' });

  const isAdmin = useMemo(() => user?.role === 'admin', [user]);

  useEffect(() => {
    if (user) loadEquipment();
  }, [user]);

  async function login() {
    if (!form.loginUsername || !form.loginPassword) return setStatus(setAuthMessage, 'Enter both username and password', false);
    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.loginUsername, password: form.loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      setUser(data.user);
      setStatus(setAuthMessage, 'Login successful', true);
    } catch (err) {
      setStatus(setAuthMessage, err.message, false);
    }
  }

  async function register() {
    if (!form.registerUsername || !form.registerEmail || !form.registerPassword) return setStatus(setAuthMessage, 'All register fields are required', false);
    try {
      const res = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.registerUsername, email: form.registerEmail, password: form.registerPassword, role: form.registerRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      setStatus(setAuthMessage, 'Registered successfully. Please login.', true);
    } catch (err) {
      setStatus(setAuthMessage, err.message, false);
    }
  }

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
    setUser(null);
    setEquipment([]);
    setStatus(setAuthMessage, 'Logged out', true);
  }

  async function loadEquipment() {
    try {
      const res = await fetch(`${apiBase}/equipment`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load equipment');
      setEquipment(data);
      setRequestMessage({ text: 'Equipment loaded.', type: 'success' });
      setForm((prev) => ({ ...prev, equipmentId: data[0]?.id ?? '' }));
    } catch (err) {
      setRequestMessage({ text: err.message, type: 'error' });
    }
  }

  async function submitRequest() {
    if (!form.equipmentId || !+form.requestQuantity) return setStatus(setRequestMessage, 'Select item and quantity', false);
    try {
      const res = await fetch(`${apiBase}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ equipmentId: form.equipmentId, quantity: +form.requestQuantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request creation failed');
      setStatus(setRequestMessage, 'Request submitted', true);
    } catch (err) {
      setStatus(setRequestMessage, err.message, false);
    }
  }

  async function createEquipment(newEquipment) {
    try {
      const res = await fetch(`${apiBase}/admin/equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(newEquipment),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Create failed');
      setStatus(setAdminMessage, 'Created equipment', true);
      loadEquipment();
    } catch (err) {
      setStatus(setAdminMessage, err.message, false);
    }
  }

  return (
    <div className="app">
      <h1>School Inventory Management (React)</h1>
      <section className="card">
        <h2>Authentication</h2>
        <div className="auth-grid">
          <div>
            <h3>Login</h3>
            <input placeholder="Username" value={form.loginUsername} onChange={(e) => setForm((p) => ({ ...p, loginUsername: e.target.value }))} />
            <input type="password" placeholder="Password" value={form.loginPassword} onChange={(e) => setForm((p) => ({ ...p, loginPassword: e.target.value }))} />
            <button onClick={login}>Login</button>
          </div>
          <div>
            <h3>Register</h3>
            <input placeholder="Username" value={form.registerUsername} onChange={(e) => setForm((p) => ({ ...p, registerUsername: e.target.value }))} />
            <input placeholder="Email" value={form.registerEmail} onChange={(e) => setForm((p) => ({ ...p, registerEmail: e.target.value }))} />
            <input type="password" placeholder="Password" value={form.registerPassword} onChange={(e) => setForm((p) => ({ ...p, registerPassword: e.target.value }))} />
            <select value={form.registerRole} onChange={(e) => setForm((p) => ({ ...p, registerRole: e.target.value }))}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={register}>Register</button>
          </div>
        </div>
        <p className={authMessage.type}>{authMessage.text}</p>
      </section>

      {user && (
        <>
          <section className="card">
            <h2>Profile</h2>
            <pre>{JSON.stringify(user, null, 2)}</pre>
            <button onClick={logout}>Logout</button>
          </section>

          <section className="card">
            <h2>Equipment</h2>
            <button onClick={loadEquipment}>Load Equipment</button>
            <ul className="list">
              {equipment.map((item) => (
                <li key={item.id}>{`${item.name} (${item.quantity}) – ${item.status}`}</li>
              ))}
            </ul>
            <div className="request-form">
              <select value={form.equipmentId} onChange={(e) => setForm((p) => ({ ...p, equipmentId: e.target.value }))}>
                <option value="">Select equipment</option>
                {equipment.map((item) => (
                  <option value={item.id} key={item.id}>{item.name}</option>
                ))}
              </select>
              <input type="number" min="1" value={form.requestQuantity} onChange={(e) => setForm((p) => ({ ...p, requestQuantity: e.target.value }))} />
              <button onClick={submitRequest}>Request</button>
            </div>
            <p className={requestMessage.type}>{requestMessage.text}</p>
          </section>

          {isAdmin && (
            <section className="card">
              <h2>Admin: Create Equipment</h2>
              <EquipmentForm onCreate={createEquipment} />
              <p className={adminMessage.type}>{adminMessage.text}</p>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function EquipmentForm({ onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);

  const submit = () => {
    if (!name || !description || quantity < 1) return;
    onCreate({ name, description, quantity });
    setName('');
    setDescription('');
    setQuantity(1);
  };

  return (
    <div className="admin-form">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
      <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} placeholder="Quantity" />
      <button onClick={submit}>Create</button>
    </div>
  );
}

export default App;
