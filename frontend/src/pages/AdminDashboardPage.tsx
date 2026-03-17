import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, LogOut, UserPlus, UserCog, UserX, Boxes, Trash2, CheckCircle2, XCircle, LayoutDashboard, ChevronDown } from 'lucide-react';
import { ThemeToggle } from '@/components/auth/ThemeToggle';
import { InteractiveBackground } from '@/components/auth/InteractiveBackground';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import {
  approveRequestAsAdmin,
  createEquipmentAsAdmin,
  createUserAsAdmin,
  deleteEquipmentAsAdmin,
  deleteRequestAsAdmin,
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
  const [openStatusMenuId, setOpenStatusMenuId] = useState<number | null>(null);
  const [openRoleMenuId, setOpenRoleMenuId] = useState<number | null>(null);

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

  useEffect(() => {
    const handleDocumentClick = () => {
      setOpenStatusMenuId(null);
      setOpenRoleMenuId(null);
    };

    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

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
        <InteractiveBackground theme={theme} />
        <ThemeToggle defaultTheme={theme} onThemeChange={setTheme} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-lime-700 dark:text-white flex items-center gap-2">
                <Shield className="w-8 h-8" />
                Admin Control Center
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1">
                {dashboardInfo} • Signed in as <span className="font-semibold">{user.email}</span>
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full md:w-auto">
              <Button className="w-full" variant="secondary" onClick={() => navigate('/dashboard')} icon={<LayoutDashboard className="w-4 h-4" />}>
                User dashboard
              </Button>
              <Button className="w-full" variant="secondary" onClick={onLogout} icon={<LogOut className="w-4 h-4" />}>
                Log out
              </Button>
            </div>
          </div>

          {message && <Notice type="success" text={message} />}
          {error && <Notice type="error" text={error} />}

          <div className="flex flex-col xl:flex-row items-start gap-4 sm:gap-6">
            <div className="w-full xl:w-1/2 space-y-4 sm:space-y-6">
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
                <div className="space-y-2 overflow-visible pr-1 max-h-[45vh] sm:max-h-none overflow-y-auto sm:overflow-visible">
                  {users.map((u) => (
                    <article key={u.id} className="relative overflow-visible rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 p-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{u.username}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{u.email}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">Role: {u.role} • ID: {u.id}</p>
                        </div>
                        <div className="flex w-full sm:w-auto items-center gap-2">
                          <div className="relative w-full sm:w-auto sm:min-w-[130px]">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenRoleMenuId((prev) => (prev === u.id ? null : u.id));
                              }}
                              className="h-9 w-full rounded-lg border border-blue-300 dark:border-blue-500 bg-white dark:bg-slate-800 px-3 text-xs font-semibold text-slate-900 dark:text-white shadow-sm transition hover:border-blue-500 dark:hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <span className="flex items-center justify-between gap-2">
                                <span className="capitalize">{u.role}</span>
                                <ChevronDown className={`h-3.5 w-3.5 transition ${openRoleMenuId === u.id ? 'rotate-180' : ''}`} />
                              </span>
                            </button>

                            {openRoleMenuId === u.id && (
                              <div
                                className="absolute right-0 z-30 top-full mt-2 w-full overflow-hidden rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-900 shadow-xl ring-1 ring-blue-200/60 dark:ring-blue-800/60"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {[
                                  { value: 'student', label: 'Student' },
                                  { value: 'teacher', label: 'Teacher' },
                                  { value: 'admin', label: 'Admin' },
                                ].map((roleOption) => (
                                  <button
                                    key={roleOption.value}
                                    type="button"
                                    onClick={async () => {
                                      setOpenRoleMenuId(null);
                                      await withResult(
                                        updateUserRoleAsAdmin(token, u.id, roleOption.value as UserRole),
                                        'User role updated',
                                      );
                                    }}
                                    className={`block w-full px-3 py-2 text-left text-xs font-medium transition ${
                                      u.role === roleOption.value
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                                        : 'text-slate-800 dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-slate-800'
                                    }`}
                                  >
                                    {roleOption.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            className="w-full sm:w-auto"
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

            <Panel title="Request Moderation" icon={<CheckCircle2 className="w-5 h-5" />}>
              <div className="space-y-2 max-h-[55vh] sm:max-h-96 overflow-auto pr-1">
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
                        <div className="flex flex-col sm:flex-row gap-2">
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
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            onClick={() => withResult(deleteRequestAsAdmin(token, req.id), 'Request deleted')}
                            icon={<Trash2 className="w-3 h-3" />}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                      {req.status !== 'pending' && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic">Action taken: {req.status}</p>
                          <Button
                            className="w-full sm:w-auto"
                            variant="destructive"
                            size="sm"
                            onClick={() => withResult(deleteRequestAsAdmin(token, req.id), 'Request deleted')}
                            icon={<Trash2 className="w-3 h-3" />}
                          >
                            Delete
                          </Button>
                        </div>
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

            <div className="w-full xl:w-1/2 space-y-4 sm:space-y-6">
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
                <div className="space-y-2 max-h-[42vh] sm:max-h-72 overflow-auto pr-1">
                  {equipmentList.map((item) => (
                    <article key={item.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 p-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{item.type} • {item.status} • Qty {item.quantity}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">ID: {item.id}</p>
                        </div>
                        <Button
                          className="w-full sm:w-auto"
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
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                  <Boxes className="w-4 h-4" />
                  Change equipment status
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Pick a status from the dropdown. Items must be set to <span className="font-semibold">retired</span> before deletion.
                </p>

                <div className="space-y-3 overflow-visible pr-1 max-h-[50vh] sm:max-h-none overflow-y-auto sm:overflow-visible">
                  {equipmentList.map((item) => (
                    <article
                      key={item.id}
                      className="relative rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900/80 dark:to-slate-800/60 p-3 overflow-visible"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{item.type} • Qty {item.quantity} • ID {item.id}</p>
                          <span
                            className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              item.status === 'retired'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                                : item.status === 'available'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            }`}
                          >
                            {item.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex w-full md:w-[320px] items-center gap-2">
                          <div className="relative w-full">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenStatusMenuId((prev) => (prev === item.id ? null : item.id));
                              }}
                              className="h-10 w-full rounded-xl border border-blue-300 dark:border-blue-500 bg-white dark:bg-slate-800 px-3 text-sm font-semibold text-slate-900 dark:text-white shadow-sm transition hover:border-blue-500 dark:hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <span className="flex items-center justify-between gap-2">
                                <span className="capitalize">{item.status.replace('_', ' ')}</span>
                                <ChevronDown className={`h-4 w-4 transition ${openStatusMenuId === item.id ? 'rotate-180' : ''}`} />
                              </span>
                            </button>

                            {openStatusMenuId === item.id && (
                              <div
                                className="absolute z-30 top-full mt-2 w-full overflow-hidden rounded-xl border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-blue-200/70 dark:ring-blue-800/60"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {[
                                  { value: 'available', label: 'Available' },
                                  { value: 'checked_out', label: 'Checked out' },
                                  { value: 'under_repair', label: 'Under repair' },
                                  { value: 'retired', label: 'Retired' },
                                ].map((statusOption) => (
                                  <button
                                    key={statusOption.value}
                                    type="button"
                                    onClick={async () => {
                                      setOpenStatusMenuId(null);
                                      await withResult(
                                        updateEquipmentStatus(
                                          token,
                                          item.id,
                                          statusOption.value as 'available' | 'checked_out' | 'under_repair' | 'retired',
                                        ),
                                        'Equipment status updated',
                                      );
                                    }}
                                    className={`block w-full px-3 py-2.5 text-left text-sm font-medium transition ${
                                      item.status === statusOption.value
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                                        : 'text-slate-800 dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-slate-800'
                                    }`}
                                  >
                                    {statusOption.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {item.status !== 'retired' && (
                            <Button
                              className="w-full sm:w-auto"
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                withResult(
                                  updateEquipmentStatus(token, item.id, 'retired'),
                                  'Equipment marked as retired',
                                )
                              }
                            >
                              Retire
                            </Button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                  {equipmentList.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No equipment available.</p>
                  )}
                </div>
              </div>
            </Panel>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Panel: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <section className="self-start rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/80 backdrop-blur-lg p-4 sm:p-6">
    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
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
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const options: Array<{ value: UserRole; label: string }> = [
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'admin', label: 'Admin' },
  ];

  const selectedLabel = options.find((option) => option.value === value)?.label || 'Student';

  return (
    <label className="block">
      <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{label}</span>
      <div ref={wrapperRef} className="relative">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setOpen((prev) => !prev);
          }}
          className="w-full rounded-[10px] border-2 border-slate-300 dark:border-slate-600 px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
        >
          <span className="flex items-center justify-between gap-2">
            <span className="font-medium">{selectedLabel}</span>
            <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
          </span>
        </button>

        {open && (
          <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-900 shadow-xl ring-1 ring-blue-200/70 dark:ring-blue-800/60">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-2.5 text-left text-sm font-medium transition ${
                  value === option.value
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                    : 'text-slate-800 dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-slate-800'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </label>
  );
};

export default AdminDashboardPage;
