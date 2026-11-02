import { useCallback, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button,
  ConfirmationModal,
  DataTable,
  IconButton,
  KpiCard,
  Pagination,
  StatusBadge,
  Tag,
  Toast,
  type DataTableColumn,
  type IconName,
  type UserStatus,
} from '@/components';
import { useAsync } from '@/hooks/useAsync';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { PATHS } from '@/routes/paths';
import { ApiError } from '@/services/apiClient';
import { getUserCounts, listUsers, updateUserStatus } from '@/services/userService';
import type { OrganizationType } from '@/types/auth';
import type { ManagedUser } from '@/types/user';
import styles from './UsersPage.module.css';

const PAGE_SIZE = 6;

interface UserFilter {
  id: string;
  label: string;
  status: UserStatus;
  organizationType: OrganizationType;
  icon: IconName;
}

const FILTERS: UserFilter[] = [
  { id: 'pending-tvet', label: 'Pending TVET', status: 'pending', organizationType: 'TVET', icon: 'alert' },
  { id: 'pending-dhet', label: 'Pending DHET', status: 'pending', organizationType: 'DHET', icon: 'alert' },
  { id: 'approved-dhet', label: 'Approved DHET', status: 'approved', organizationType: 'DHET', icon: 'users' },
  { id: 'approved-tvet', label: 'Approved TVET', status: 'approved', organizationType: 'TVET', icon: 'users' },
];

/** Pending row action that needs confirming: disabling or re-enabling an account. */
interface PendingAction {
  user: ManagedUser;
  status: UserStatus;
}

interface ToastMessage {
  title: string;
  message: string;
}

export function UsersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  // Bumped after a change so the list and counts are fetched again.
  const [version, setVersion] = useState(0);

  // Filter and page live in the URL so they survive going to a preview and back.
  const activeFilter = FILTERS.find((filter) => filter.id === searchParams.get('filter'));
  const requestedPage = Math.max(Number(searchParams.get('page')) || 1, 1);

  // The server filters and pages; it also clamps a page past the end to the last page.
  const list = useAsync(
    `${activeFilter?.id ?? 'all'}|${requestedPage}|${version}`,
    () =>
      listUsers({
        status: activeFilter?.status,
        organizationType: activeFilter?.organizationType,
        page: requestedPage,
        pageSize: PAGE_SIZE,
      }),
    { keepPreviousData: true },
  );
  const counts = useAsync(`counts|${version}`, getUserCounts, { keepPreviousData: true });

  const pageRows = list.data?.items ?? [];
  const page = list.data?.page ?? requestedPage;
  const totalPages = list.data?.totalPages ?? 1;

  const countFor = (filter: UserFilter) => {
    if (!counts.data) return '–';
    const match = counts.data.find(
      (count) => count.status === filter.status && count.organizationType === filter.organizationType,
    );
    return match?.count ?? 0;
  };

  let emptyMessage = 'No users match this filter.';
  if (list.error) emptyMessage = list.error.message;
  else if (!list.data) emptyMessage = 'Loading users…';

  const updateParams = (filterId: string | undefined, nextPage: number) => {
    const params = new URLSearchParams();
    if (filterId) params.set('filter', filterId);
    if (nextPage > 1) params.set('page', String(nextPage));
    setSearchParams(params);
  };

  const toggleFilter = (filter: UserFilter) =>
    updateParams(activeFilter?.id === filter.id ? undefined : filter.id, 1);

  const confirmAction = async () => {
    if (!pendingAction) return;
    setSaving(true);
    try {
      await updateUserStatus(pendingAction.user.id, pendingAction.status);
      setToast({
        title: 'Account updated',
        message:
          pendingAction.status === 'disabled'
            ? `${pendingAction.user.fullName}'s account has been disabled`
            : `${pendingAction.user.fullName}'s account has been enabled`,
      });
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      setToast({ title: 'Account not updated', message: error.message });
    } finally {
      setPendingAction(null);
      setVersion((current) => current + 1);
      setSaving(false);
    }
  };

  const closeToast = useCallback(() => setToast(null), []);

  const columns: DataTableColumn<ManagedUser>[] = [
    { key: 'fullName', header: 'Full Name', width: '20%', emphasis: true },
    {
      key: 'organizationType',
      header: 'Company',
      width: '13%',
      render: (row) => (
        <Tag tone={row.organizationType === 'DHET' ? 'slate' : 'mint'}>{row.organizationType}</Tag>
      ),
    },
    { key: 'role', header: 'Role', width: '33%' },
    {
      key: 'status',
      header: 'Status',
      width: '14%',
      render: (row) => <StatusBadge status={row.status} variant="soft" />,
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <div className={styles.actions}>
          <Button
            variant="solid"
            size="sm"
            icon="eye"
            onClick={() =>
              navigate(PATHS.adminUser(row.id), { state: { from: location.search } })
            }
          >
            Preview
          </Button>
          {row.status === 'approved' && (
            <IconButton
              icon="trash"
              tone="danger"
              label={`Disable ${row.fullName}`}
              onClick={() => setPendingAction({ user: row, status: 'disabled' })}
            />
          )}
          {row.status === 'disabled' && (
            <IconButton
              icon="tick"
              tone="success"
              label={`Enable ${row.fullName}`}
              onClick={() => setPendingAction({ user: row, status: 'approved' })}
            />
          )}
        </div>
      ),
    },
  ];

  const disabling = pendingAction?.status === 'disabled';

  return (
    <DashboardLayout>
      <h1 className="visually-hidden">Users</h1>

      <section className={styles.filters} aria-label="Filter users">
        {FILTERS.map((filter) => (
          <KpiCard
            key={filter.id}
            label={filter.label}
            value={countFor(filter)}
            icon={filter.icon}
            selected={activeFilter?.id === filter.id}
            onClick={() => toggleFilter(filter)}
          />
        ))}
      </section>

      <section className={styles.panel}>
        {activeFilter && (
          <div className={styles.filterBar}>
            <span>
              Showing <strong>{activeFilter.label}</strong> users
            </span>
            <button type="button" className={styles.clear} onClick={() => updateParams(undefined, 1)}>
              Show all users
            </button>
          </div>
        )}
        <DataTable
          columns={columns}
          rows={pageRows}
          getRowKey={(row) => row.id}
          density="comfortable"
          emptyMessage={emptyMessage}
        />
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={(next) => updateParams(activeFilter?.id, next)}
        />
      </section>

      <ConfirmationModal
        open={pendingAction !== null}
        title={disabling ? 'Disable account?' : 'Enable account?'}
        message={
          pendingAction &&
          (disabling
            ? `${pendingAction.user.fullName} will no longer be able to sign in.`
            : `${pendingAction.user.fullName} will be able to sign in again.`)
        }
        confirmLabel={disabling ? 'Disable' : 'Enable'}
        variant={disabling ? 'danger' : 'primary'}
        loading={saving}
        onConfirm={confirmAction}
        onCancel={() => setPendingAction(null)}
      />

      <Toast
        open={toast !== null}
        title={toast?.title ?? ''}
        message={toast?.message}
        onClose={closeToast}
      />
    </DashboardLayout>
  );
}
