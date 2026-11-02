import { useCallback, useMemo, useState, type FormEvent } from 'react';
import {
  Button,
  Card,
  ColorStripe,
  ConfirmationModal,
  Divider,
  Dropdown,
  Icon,
  RadioGroup,
  TextBox,
  TextLink,
  Toast,
} from '@/components';
import { ORGANIZATION_TYPES } from '@/constants/options';
import { useAsync } from '@/hooks/useAsync';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ApiError } from '@/services/apiClient';
import { getRegistrationOptions, register } from '@/services/authService';
import type { NamedOption, OrganizationType, RegistrationRequest } from '@/types/auth';
import { isValidEmail, isValidPassword, isValidPersalNumber } from '@/utils/validation';
import styles from './RegisterPage.module.css';

type FormValues = Omit<RegistrationRequest, 'organizationType'>;
type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_VALUES: FormValues = {
  fullName: '',
  email: '',
  institutionId: '',
  jobRoleId: '',
  persalNumber: '',
  password: '',
};

const PASSWORD_HINT = 'Min. 8 characters with numbers';

const toDropdownOptions = (options: NamedOption[] = []) =>
  options.map(({ id, name }) => ({ value: id, label: name }));

export function RegisterPage() {
  const [organizationType, setOrganizationType] = useState<OrganizationType>('DHET');
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const options = useAsync('registration-options', getRegistrationOptions);

  const institutionOptions = useMemo(
    () => toDropdownOptions(options.data?.institutions),
    [options.data],
  );
  const roleOptions = useMemo(
    () => toDropdownOptions(options.data?.jobRoles[organizationType]),
    [options.data, organizationType],
  );

  const isTvet = organizationType === 'TVET';

  const setField = (field: keyof FormValues) => (value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleOrganizationChange = (type: OrganizationType) => {
    setOrganizationType(type);
    // Roles differ per organisation, and only TVET users pick an institution
    setValues((prev) => ({ ...prev, jobRoleId: '', institutionId: '' }));
    setErrors({});
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!values.fullName.trim()) next.fullName = 'Full name is required';
    if (!isValidEmail(values.email)) next.email = 'Enter a valid institutional email';
    if (isTvet && !values.institutionId) next.institutionId = 'Select your institution';
    if (!values.jobRoleId) next.jobRoleId = 'Select your role';
    if (!isValidPersalNumber(values.persalNumber))
      next.persalNumber = 'PERSAL number must be 6–10 digits';
    if (!isValidPassword(values.password)) next.password = PASSWORD_HINT;
    return next;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length === 0) setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await register({
        organizationType,
        ...values,
        institutionId: isTvet ? values.institutionId : undefined,
      });
      setConfirmOpen(false);
      setToastOpen(true);
      setValues(EMPTY_VALUES);
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      // Show the server's per-field messages (e.g. email already registered) on the form.
      setConfirmOpen(false);
      setErrors(error.fieldErrors);
      setFormError(Object.keys(error.fieldErrors).length > 0 ? null : error.message);
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
                options={institutionOptions}
                value={values.institutionId}
                onChange={(e) => setField('institutionId')(e.target.value)}
                error={errors.institutionId}
              />
            )}
            <Dropdown
              label="Role"
              required
              icon="badge"
              placeholder="Select role"
              options={roleOptions}
              value={values.jobRoleId}
              onChange={(e) => setField('jobRoleId')(e.target.value)}
              error={errors.jobRoleId}
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
            {(formError || options.error) && (
              <p className={styles.formError} role="alert">
                <Icon name="alert" size={16} />
                {formError ?? 'Could not load the registration options. Refresh the page to try again.'}
              </p>
            )}
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
