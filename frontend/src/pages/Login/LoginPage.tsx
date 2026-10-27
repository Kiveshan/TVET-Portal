import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, ColorStripe, Divider, Icon, TextBox, TextLink } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/layouts/AuthLayout';
import { homePathFor } from '@/routes/paths';
import { InvalidCredentialsError, login } from '@/services/authService';
import { isValidEmail } from '@/utils/validation';
import styles from './LoginPage.module.css';

interface LoginErrors {
  email?: string;
  password?: string;
}

export function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in: skip the form.
  if (user) return <Navigate to={homePathFor(user.role)} replace />;

  const validate = (): LoginErrors => {
    const next: LoginErrors = {};
    if (!isValidEmail(email)) next.email = 'Enter a valid email address';
    if (!password) next.password = 'Password is required';
    return next;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const signedIn = await login({ email, password });
      signIn(signedIn);
      // Return to the page the user was sent away from, otherwise their role's home page.
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? homePathFor(signedIn.role), { replace: true });
    } catch (error) {
      if (!(error instanceof InvalidCredentialsError)) throw error;
      setFormError(error.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <Card width={760} className={styles.card}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.heading}>
            <h1 className={styles.title}>Login</h1>
            <Divider />
          </div>

          <div className={styles.fields}>
            <TextBox
              label="Email address"
              labelSize="sm"
              type="email"
              autoComplete="email"
              placeholder="name@dhet.gov.za"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
            <TextBox
              label="Password"
              labelSize="sm"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
          </div>

          {formError && (
            <p className={styles.formError} role="alert">
              <Icon name="alert" size={16} />
              {formError}
            </p>
          )}

          <Button type="submit" fullWidth loading={submitting} className={styles.submit}>
            Sign in
          </Button>

          <p className={styles.footer}>
            New institution? <TextLink to="/register">Request access</TextLink>
          </p>

          <ColorStripe className={styles.stripe} />
        </form>
      </Card>
    </AuthLayout>
  );
}
