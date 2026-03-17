import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ClipboardList, CalendarClock, LogOut, Search, SendHorizontal, Trash2 } from 'lucide-react';
import { ThemeToggle } from '@/components/auth/ThemeToggle';
import { InteractiveBackground } from '@/components/auth/InteractiveBackground';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { getEquipmentList } from '@/services/inventoryService';
import { getMyRequests, submitBorrowRequest, returnBorrowRequest, deleteBorrowRequest } from '@/services/requestService';
import type { BorrowRequest, Equipment } from '@/types/auth';

type ThemeMode = 'light' | 'dark';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, isAuthenticated, logout } = useAuthStore();

  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [search, setSearch] = useState('');
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/auth', { replace: true });
      return;
    }

    const loadData = async () => {
      setError(null);

      setLoadingEquipment(true);
      const equipmentResult = await getEquipmentList({ search });
      if (equipmentResult.success && equipmentResult.data) {
        setEquipment(equipmentResult.data);
      } else {
        setError(equipmentResult.error || 'Failed to load inventory');
      }
      setLoadingEquipment(false);

      setLoadingRequests(true);
      const requestsResult = await getMyRequests(token);
      if (requestsResult.success && requestsResult.data) {
        setRequests(requestsResult.data);
      } else {
        setError(requestsResult.error || 'Failed to load your requests');
      }
      setLoadingRequests(false);
    };

    loadData();
  }, [isAuthenticated, navigate, search, token]);

  const availableEquipment = useMemo(
    () => equipment.filter((item) => item.status === 'available' && item.quantity > 0),
    [equipment],
  );

  const onQuickBorrow = async (equipmentId: number) => {
    if (!token) return;

    const now = new Date();
    const due = new Date(now);
    due.setDate(now.getDate() + 7);

    const result = await submitBorrowRequest(token, {
      equipment_id: equipmentId,
      request_date: now.toISOString(),
      due_date: due.toISOString(),
      notes: 'Requested from dashboard quick action',
    });

    if (!result.success) {
      setError(result.error || 'Could not submit request');
      return;
    }

    const requestsResult = await getMyRequests(token);
    if (requestsResult.success && requestsResult.data) {
      setRequests(requestsResult.data);
    }
  };

  const onReturn = async (requestId: number) => {
    if (!token) return;

    const result = await returnBorrowRequest(token, requestId, {
      condition: 'good',
      notes: 'Returned from dashboard',
    });

    if (!result.success) {
      setError(result.error || 'Could not return item');
      return;
    }

    const requestsResult = await getMyRequests(token);
    if (requestsResult.success && requestsResult.data) {
      setRequests(requestsResult.data);
    }
  };

  const onDeleteRequest = async (requestId: number) => {
    if (!token) return;

    const result = await deleteBorrowRequest(token, requestId);
    if (!result.success) {
      setError(result.error || 'Could not delete request');
      return;
    }

    const requestsResult = await getMyRequests(token);
    if (requestsResult.success && requestsResult.data) {
      setRequests(requestsResult.data);
    }
  };

  const onSignOut = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };

  return (
    <div className={theme === 'dark' ? 'dark' : 'light'}>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-lime-50 via-cyan-50 to-lime-100 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900 transition-colors duration-300">
        <InteractiveBackground theme={theme} />
        <ThemeToggle defaultTheme={theme} onThemeChange={setTheme} />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-lime-700 dark:text-white">Inventory Dashboard</h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1">
                Signed in as <span className="font-semibold">{user?.username}</span> ({user?.role})
              </p>
            </div>

            <Button className="w-full sm:w-auto" variant="secondary" onClick={onSignOut} icon={<LogOut className="w-4 h-4" />}>
              Log out
            </Button>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6 sm:mb-8">
            <StatCard icon={<Package className="w-5 h-5" />} label="Available items" value={String(availableEquipment.length)} />
            <StatCard icon={<ClipboardList className="w-5 h-5" />} label="My requests" value={String(requests.length)} />
            <StatCard
              icon={<CalendarClock className="w-5 h-5" />}
              label="Pending approvals"
              value={String(requests.filter((r) => r.status === 'pending').length)}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            <section className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/80 backdrop-blur-lg p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Equipment Catalog</h2>
              </div>

              <div className="mb-4">
                <Input
                  placeholder="Search by name or serial"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>

              <div className="space-y-3 max-h-[45vh] sm:max-h-[420px] overflow-auto pr-1">
                {loadingEquipment ? (
                  <p className="text-slate-500 dark:text-slate-400">Loading equipment...</p>
                ) : availableEquipment.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400">No available items found.</p>
                ) : (
                  availableEquipment.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-lime-200/70 dark:border-slate-700 bg-lime-50/40 dark:bg-slate-800/60 p-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {item.type} • {item.condition} • Qty {item.quantity}
                          </p>
                        </div>
                        <Button
                          className="w-full sm:w-auto"
                          size="sm"
                          icon={<SendHorizontal className="w-4 h-4" />}
                          onClick={() => onQuickBorrow(item.id)}
                        >
                          Request
                        </Button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/80 backdrop-blur-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">My Requests</h2>

              <div className="space-y-3 max-h-[48vh] sm:max-h-[480px] overflow-auto pr-1">
                {loadingRequests ? (
                  <p className="text-slate-500 dark:text-slate-400">Loading your requests...</p>
                ) : requests.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400">No requests yet.</p>
                ) : (
                  requests.map((request) => (
                    <article
                      key={request.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 p-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                            {request.equipment?.name || `Item #${request.equipment_id}`}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Status: {request.status} • Requested {new Date(request.request_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex w-full sm:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          {request.status === 'approved' ? (
                            <Button className="w-full sm:w-auto" size="sm" variant="secondary" onClick={() => onReturn(request.id)}>
                              Return
                            </Button>
                          ) : null}
                          <Button
                            className="w-full sm:w-auto"
                            size="sm"
                            variant="destructive"
                            onClick={() => onDeleteRequest(request.id)}
                            icon={<Trash2 className="w-4 h-4" />}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <article className="rounded-xl border border-slate-200/70 dark:border-slate-700 bg-white/85 dark:bg-slate-900/75 backdrop-blur p-4">
    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 mb-2">
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
    <p className="text-2xl font-bold text-lime-700 dark:text-white">{value}</p>
  </article>
);

export default DashboardPage;
