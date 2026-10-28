import { useCallback, useState, type FormEvent } from 'react';
import {
  Button,
  Card,
  ColorStripe,
  ConfirmationModal,
  Divider,
  Dropdown,
  RadioGroup,
  TextBox,
  TextLink,
  Toast,
} from '@/components';
import { INSTITUTION_OPTIONS, ORGANIZATION_TYPES, ROLE_OPTIONS } from '@/constants/options';
import { AuthLayout } from '@/layouts/AuthLayout';
import { register } from '@/services/authService';
import type { OrganizationType, RegistrationRequest } from '@/types/auth';
import { isValidEmail, isValidPassword, isValidPersalNumber } from '@/utils/validation';
import styles from './RegisterPage.module.css';

type FormValues = Omit<RegistrationRequest, 'organizationType'>;
type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_VALUES: FormValues = {
  fullName: '',
  email: '',
  institution: '',
  role: '',
  persalNumber: '',
  password: '',
};

const PASSWORD_HINT = 'Min. 8 characters with numbers';

export function RegisterPage() {
  const [organizationType, setOrganizationType] = useState<OrganizationType>('DHET');
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);

  const isTvet = organizationType === 'TVET';

  const setField = (field: keyof FormValues) => (value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleOrganizationChange = (type: OrganizationType) => {
    setOrganizationType(type);
    // Roles differ per organisation, and only TVET users pick an institution
    setValues((prev) => ({ ...prev, role: '', institution: '' }));
    setErrors({});
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!values.fullName.trim()) next.fullName = 'Full name is required';
    if (!isValidEmail(values.email)) next.email = 'Enter a valid institutional email';
    if (isTvet && !values.institution) next.institution = 'Select your institution';
    if (!values.role) next.role = 'Select your role';
    if (!isValidPersalNumber(values.persalNumber))
      next.persalNumber = 'PERSAL number must be 6–10 digits';
    if (!isValidPassword(values.password)) next.password = PASSWORD_HINT;
    return next;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await register({
        organizationType,
        ...values,
        institution: isTvet ? values.institution : undefined,
      });
      setConfirmOpen(false);
      setToastOpen(true);
      setValues(EMPTY_VALUES);
    } finally {
      setSubmitting(false);
    }
  };

  const closeToast = useCallback(() => setToastOpen(false), []);

  return (
    <AuthLayout>
      <Card className={styles.card}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.heading}>
            <h1 className={styles.title}>Registration details</h1>
            <Divider />
          </div>

          <RadioGroup
            name="organizationType"
            label="Organization Type"
            variant="segment"
            options={ORGANIZATION_TYPES}
            value={organizationType}
            onChange={handleOrganizationChange}
            className={styles.orgType}
          />

          <div className={styles.grid}>
            <TextBox
              label="Full name"
              required
              icon="user"
              placeholder="John Doe"
              autoComplete="name"
              value={values.fullName}
              onChange={(e) => setField('fullName')(e.target.value)}
              error={errors.fullName}
            />
            <TextBox
              label="Institutional Email"
              required
              type="email"
              icon="mail"
              placeholder="j.doe@institution.edu"
              autoComplete="email"
              value={values.email}
              onChange={(e) => setField('email')(e.target.value)}
              error={errors.email}
            />
            {isTvet && (
              <Dropdown
                label="Institution"
                required
                icon="building"
                placeholder="Select institution"
                options={INSTITUTION_OPTIONS}
                value={values.institution}
                onChange={(e) => setField('institution')(e.target.value)}
                error={errors.institution}
              />
            )}
            <Dropdown
              label="Role"
              required
              icon="badge"
              placeholder="Select role"
              options={ROLE_OPTIONS[organizationType]}
              value={values.role}
              onChange={(e) => setField('role')(e.target.value)}
              error={errors.role}
            />
            <TextBox
              label="PERSAL Number"
              required
              icon="hash"
              inputMode="numeric"
              value={values.persalNumber}
              onChange={(e) => setField('persalNumber')(e.target.value)}
              error={errors.persalNumber}
            />
            <TextBox
              label="Password"
              required
              type="password"
              icon="lock"
              autoComplete="new-password"
              placeholder="••••••••"
              value={values.password}
              onChange={(e) => setField('password')(e.target.value)}
              hint={PASSWORD_HINT}
              error={errors.password}
            />
          </div>

          <div className={styles.actions}>
            <Button type="submit" fullWidth>
              Submit registration
            </Button>
            <p className={styles.footer}>
              Already have an Account ? <TextLink to="/login">Login here</TextLink>
            </p>
          </div>

          <ColorStripe className={styles.stripe} />
        </form>
      </Card>

      <ConfirmationModal
        open={confirmOpen}
        title="Submit registration?"
        message={
          <>
            You are registering as a <strong>{organizationType}</strong> user with{' '}
            <strong>{values.email}</strong>. Please confirm your details are correct.
          </>
        }
        confirmLabel="Submit"
        loading={submitting}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />

      <Toast
        open={toastOpen}
        title="Registration Submitted"
        message="This application has been submitted"
        onClose={closeToast}
      />
    </AuthLayout>
  );
}
