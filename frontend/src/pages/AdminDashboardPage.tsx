import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, LogOut, UserPlus, UserCog, UserX, Boxes, Trash2, CheckCircle2, XCircle, LayoutDashboard } from 'lucide-react';
import { ThemeToggle } from '@/components/auth/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import {
  approveRequestAsAdmin,
  createEquipmentAsAdmin,
  createUserAsAdmin,
  deleteEquipmentAsAdmin,
  deleteUserAsAdmin,
  getAdminDashboard,
  getUsersAsAdmin,
  getRequestsAsAdmin,
  rejectRequestAsAdmin,
  updateUserRoleAsAdmin,
} from '@/services/adminService';
import { getEquipmentList } from '@/services/inventoryService';
import { updateEquipmentStatus } from '@/services/inventoryService';
import type { Equipment, User, UserRole, BorrowRequest } from '@/types/auth';

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, isAuthenticated, logout } = useAuthStore();

  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dashboardInfo, setDashboardInfo] = useState<string>('Loading admin data...');
  const [users, setUsers] = useState<User[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [requests, setRequests] = useState<BorrowRequest[]>([]);

  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'student' as UserRole });

  const [equipment, setEquipment] = useState({ name: '', type: '', condition: 'good' as 'new' | 'good' | 'fair' | 'damaged', quantity: '1' });

  const refreshAdminData = async () => {
    if (!token) return;

    const [dashboardResult, usersResult, equipmentResult, requestsResult] = await Promise.all([
      getAdminDashboard(token),
      getUsersAsAdmin(token),
      getEquipmentList(),
      getRequestsAsAdmin(token),
    ]);

    if (dashboardResult.success && dashboardResult.data) {
      setDashboardInfo(dashboardResult.data.message || 'Admin session active');
    } else {
      setDashboardInfo('Admin session active');
    }

    if (usersResult.success && usersResult.data) {
      setUsers(usersResult.data.users);
    }

    if (equipmentResult.success && equipmentResult.data) {
      setEquipmentList(equipmentResult.data);
    }

    if (requestsResult.success && requestsResult.data) {
      const requestPayload = Array.isArray(requestsResult.data)
        ? requestsResult.data
        : requestsResult.data.requests;
      setRequests(Array.isArray(requestPayload) ? requestPayload : []);
    } else if (!requestsResult.success && requestsResult.error) {
      setError(requestsResult.error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (user?.role !== 'admin') {
      navigate('/dashboard', { replace: true });
      return;
    }

    refreshAdminData();

    // Keep moderation data fresh so newly created requests appear quickly.
    const intervalId = setInterval(() => {
      refreshAdminData();
    }, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isAuthenticated, navigate, token, user?.role]);

  const clearNotices = () => {
    setMessage(null);
    setError(null);
  };

  const withResult = async (action: Promise<{ success: boolean; message?: string; error?: string }>, successMessage: string, onSuccess?: () => void) => {
    clearNotices();
    const result = await action;
    if (!result.success) {
      setError(result.error || 'Operation failed');
      return;
    }
    setMessage(result.message || successMessage);
    onSuccess?.();
    await refreshAdminData();
  };

  const onLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  if (!token || user?.role !== 'admin') return null;

  return (
    <div className={theme === 'dark' ? 'dark' : 'light'}>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-lime-50 via-cyan-50 to-lime-100 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900 transition-colors duration-300">
        <ThemeToggle defaultTheme={theme} onThemeChange={setTheme} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-lime-700 dark:text-white flex items-center gap-2">
                <Shield className="w-8 h-8" />
                Admin Control Center
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-1">
                {dashboardInfo} • Signed in as <span className="font-semibold">{user.email}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => navigate('/dashboard')} icon={<LayoutDashboard className="w-4 h-4" />}>
                User dashboard
              </Button>
              <Button variant="secondary" onClick={onLogout} icon={<LogOut className="w-4 h-4" />}>
                Log out
              </Button>
            </div>
          </div>

          {message && <Notice type="success" text={message} />}
          {error && <Notice type="error" text={error} />}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Panel title="User Management" icon={<UserPlus className="w-5 h-5" />}>
              <div className="space-y-3">
                <Input label="Username" value={newUser.username} onChange={(e) => setNewUser((p) => ({ ...p, username: e.target.value }))} />
                <Input label="Email" type="email" value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} />
                <Input label="Password" type="password" value={newUser.password} onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))} />
                <SelectRole label="Role" value={newUser.role} onChange={(role) => setNewUser((p) => ({ ...p, role }))} />
                <Button
                  className="w-full"
                  onClick={() =>
                    withResult(
                      createUserAsAdmin(token, {
                        username: newUser.username,
                        email: newUser.email,
                        password: newUser.password,
                        role: newUser.role,
                      }),
                      'User created',
                      () => setNewUser({ username: '', email: '', password: '', role: 'student' })
                    )
                  }
                >
                  Create user
                </Button>
              </div>

              <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                  <UserCog className="w-4 h-4" />
                  Users (always visible)
                </div>
                <div className="space-y-2 max-h-72 overflow-auto pr-1">
                  {users.map((u) => (
                    <article key={u.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{u.username}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{u.email}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">Role: {u.role} • ID: {u.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={u.role}
                            onChange={async (e) => {
                              await withResult(
                                updateUserRoleAsAdmin(token, u.id, e.target.value as UserRole),
                                'User role updated',
                              );
                            }}
                            className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-xs"
                          >
                            <option value="student">student</option>
                            <option value="teacher">teacher</option>
                            <option value="admin">admin</option>
                          </select>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => withResult(deleteUserAsAdmin(token, u.id), 'User deleted')}
                            icon={<UserX className="w-3 h-3" />}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}
                  {users.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No users found.</p>
                  )}
                </div>
              </div>
            </Panel>

            <Panel title="Inventory Management" icon={<Boxes className="w-5 h-5" />}>
              <div className="space-y-3">
                <Input label="Equipment name" value={equipment.name} onChange={(e) => setEquipment((p) => ({ ...p, name: e.target.value }))} />
                <Input label="Type" value={equipment.type} onChange={(e) => setEquipment((p) => ({ ...p, type: e.target.value }))} />
                <Input label="Condition (new/good/fair/damaged)" value={equipment.condition} onChange={(e) => setEquipment((p) => ({ ...p, condition: e.target.value as typeof p.condition }))} />
                <Input label="Quantity" type="number" value={equipment.quantity} onChange={(e) => setEquipment((p) => ({ ...p, quantity: e.target.value }))} />
                <Button
                  className="w-full"
                  onClick={() =>
                    withResult(
                      createEquipmentAsAdmin(token, {
                        name: equipment.name,
                        type: equipment.type,
                        condition: equipment.condition,
                        quantity: Number(equipment.quantity),
                      }),
                      'Equipment created',
                      () => setEquipment({ name: '', type: '', condition: 'good', quantity: '1' })
                    )
                  }
                >
                  Create equipment
                </Button>
              </div>

              <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                  <Trash2 className="w-4 h-4" />
                  Equipment (always visible)
                </div>
                <div className="space-y-2 max-h-72 overflow-auto pr-1">
                  {equipmentList.map((item) => (
                    <article key={item.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{item.type} • {item.status} • Qty {item.quantity}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">ID: {item.id}</p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => withResult(deleteEquipmentAsAdmin(token, item.id), 'Equipment delete action executed')}
                          icon={<Trash2 className="w-3 h-3" />}
                        >
                          Delete
                        </Button>
                      </div>
                    </article>
                  ))}
                  {equipmentList.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No equipment found.</p>
                  )}
                </div>
              </div>
              <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                  <Boxes className="w-4 h-4" />
                  Change equipment status
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Mark equipment as "retired" to enable deletion</p>
                <div className="space-y-2">
                  {equipmentList.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <select
                        value={item.status}
                        onChange={async (e) => {
                          await withResult(
                            updateEquipmentStatus(token, item.id, e.target.value as 'available' | 'checked_out' | 'under_repair' | 'retired'),
                            'Equipment status updated',
                          );
                        }}
                        className="flex-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-xs"
                      >
                        <option value="available">available</option>
                        <option value="checked_out">checked_out</option>
                        <option value="under_repair">under_repair</option>
                        <option value="retired">retired</option>
                      </select>
                      <span className="text-xs text-slate-600 dark:text-slate-400">{item.name}</span>
                    </div>
                  ))}
                  {equipmentList.length === 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">No equipment available.</p>
                  )}
                </div>
              </div>
            </Panel>

            <Panel title="Request Moderation" icon={<CheckCircle2 className="w-5 h-5" />}>
              <div className="space-y-2 max-h-96 overflow-auto pr-1">
                {requests.map((req) => (
                  <article key={req.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {req.equipment?.name || `Equipment ID ${req.equipment_id}`}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">User ID: {req.user_id} • Status: {req.status}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">Request ID: {req.id}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">Requested: {new Date(req.request_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {req.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1"
                            onClick={() => withResult(approveRequestAsAdmin(token, req.id), 'Request approved')}
                            icon={<CheckCircle2 className="w-3 h-3" />}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={() => withResult(rejectRequestAsAdmin(token, req.id), 'Request rejected')}
                            icon={<XCircle className="w-3 h-3" />}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {req.status !== 'pending' && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">Action taken: {req.status}</p>
                      )}
                    </div>
                  </article>
                ))}
                {requests.length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No requests to moderate.</p>
                )}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
};

const Panel: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <section className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/80 backdrop-blur-lg p-6">
    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
      {icon}
      {title}
    </h2>
    {children}
  </section>
);

const Notice: React.FC<{ type: 'success' | 'error'; text: string }> = ({ type, text }) => (
  <div
    className={`mb-4 rounded-lg border p-3 text-sm font-medium ${
      type === 'success'
        ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200'
        : 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200'
    }`}
  >
    {text}
  </div>
);

const SelectRole: React.FC<{ label: string; value: UserRole; onChange: (value: UserRole) => void }> = ({
  label,
  value,
  onChange,
}) => (
  <label className="block">
    <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as UserRole)}
      className="w-full rounded-[10px] border-2 border-slate-200 dark:border-slate-700 px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-lime-400 dark:focus:border-purple-400 transition-all duration-300 ease-out"
    >
      <option value="student">student</option>
      <option value="teacher">teacher</option>
      <option value="admin">admin</option>
    </select>
  </label>
);

export default AdminDashboardPage;
