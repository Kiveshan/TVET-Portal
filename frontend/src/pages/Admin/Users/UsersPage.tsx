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
import { useUsers } from '@/hooks/useUsers';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { PATHS } from '@/routes/paths';
import { updateUserStatus } from '@/services/userService';
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

const matches = (filter: UserFilter) => (user: ManagedUser) =>
  user.status === filter.status && user.organizationType === filter.organizationType;

/** Pending row action that needs confirming: disabling or re-enabling an account. */
interface PendingAction {
  user: ManagedUser;
  status: UserStatus;
}

export function UsersPage() {
  const users = useUsers();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Filter and page live in the URL so they survive going to a preview and back.
  const activeFilter = FILTERS.find((filter) => filter.id === searchParams.get('filter'));
  const filteredUsers = activeFilter ? users.filter(matches(activeFilter)) : users;
  const totalPages = Math.max(Math.ceil(filteredUsers.length / PAGE_SIZE), 1);
  const page = Math.min(Math.max(Number(searchParams.get('page')) || 1, 1), totalPages);
  const pageRows = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
      setToast(
        pendingAction.status === 'disabled'
          ? `${pendingAction.user.fullName}'s account has been disabled`
          : `${pendingAction.user.fullName}'s account has been enabled`,
      );
      setPendingAction(null);
    } finally {
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
            value={users.filter(matches(filter)).length}
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
          emptyMessage="No users match this filter."
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

      <Toast open={toast !== null} title="Account updated" message={toast ?? ''} onClose={closeToast} />
    </DashboardLayout>
  );
}
