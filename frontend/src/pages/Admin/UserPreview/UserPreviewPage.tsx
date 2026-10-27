import { useCallback, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  ConfirmationModal,
  DecisionAlert,
  DetailTile,
  StatusBadge,
  type Decision,
} from '@/components';
import { useUsers } from '@/hooks/useUsers';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { PATHS } from '@/routes/paths';
import { updateUserStatus } from '@/services/userService';
import styles from './UserPreviewPage.module.css';

export function UserPreviewPage() {
  const { userId } = useParams();
  const users = useUsers();
  const navigate = useNavigate();
  const location = useLocation();
  const [confirming, setConfirming] = useState<Decision | null>(null);
  const [saving, setSaving] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);

  const user = users.find((candidate) => candidate.id === userId);

  // Return to the list with the filter and page it was opened from.
  const goBack = () => {
    const from = (location.state as { from?: string } | null)?.from ?? '';
    navigate(PATHS.adminUsers + from);
  };

  const confirmDecision = async () => {
    if (!user || !confirming) return;
    setSaving(true);
    try {
      await updateUserStatus(user.id, confirming);
      setDecision(confirming);
      setConfirming(null);
    } finally {
      setSaving(false);
    }
  };

  const closeAlert = useCallback(() => setDecision(null), []);

  if (!user) {
    return (
      <DashboardLayout>
        <div className={styles.page}>
          <section className={styles.card}>
            <h1 className={styles.name}>User not found</h1>
            <p className={styles.notFound}>This user may have been removed.</p>
          </section>
          <Button variant="solid" size="lg" icon="arrowLeft" onClick={goBack} className={styles.back}>
            Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isPending = user.status === 'pending';
  const approving = confirming === 'approved';

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <section className={styles.card} aria-labelledby="user-name">
          <div className={styles.header}>
            <h1 id="user-name" className={styles.name}>
              {user.fullName}
            </h1>
            {!isPending && <StatusBadge status={user.status} variant="soft" />}
          </div>

          <dl className={styles.details}>
            <DetailTile label="Email address" icon="mail">
              {user.email}
            </DetailTile>
            <DetailTile label="Organization" icon="building">
              {user.organization}
            </DetailTile>
            <DetailTile label="Role" icon="briefcase">
              {user.role}
            </DetailTile>
            <DetailTile label="PERSAL number" icon="hash">
              {user.persalNumber}
            </DetailTile>
          </dl>

          {isPending && (
            <div className={styles.decision}>
              <Button variant="solid" size="lg" icon="check" onClick={() => setConfirming('approved')}>
                Approve
              </Button>
              <Button variant="danger" size="lg" icon="xCircle" onClick={() => setConfirming('rejected')}>
                Reject
              </Button>
            </div>
          )}
        </section>

        <Button variant="solid" size="lg" icon="arrowLeft" onClick={goBack} className={styles.back}>
          Back
        </Button>
      </div>

      <ConfirmationModal
        open={confirming !== null}
        title={approving ? 'Approve registration?' : 'Reject registration?'}
        message={
          approving
            ? `${user.fullName} will be able to sign in to the TVET Portal.`
            : `${user.fullName}'s registration will be rejected and they will not be able to sign in.`
        }
        confirmLabel={approving ? 'Approve' : 'Reject'}
        variant={approving ? 'primary' : 'danger'}
        loading={saving}
        onConfirm={confirmDecision}
        onCancel={() => setConfirming(null)}
      />

      <DecisionAlert decision={decision} onClose={closeAlert} />
    </DashboardLayout>
  );
}
