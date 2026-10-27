import { useState, type FormEvent } from 'react';
import { Button, Card, ColorStripe, Divider, TextBox, TextLink } from '@/components';
import { AuthLayout } from '@/layouts/AuthLayout';
import { login } from '@/services/authService';
import { isValidEmail } from '@/utils/validation';
import styles from './LoginPage.module.css';

interface LoginErrors {
  email?: string;
  password?: string;
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [submitting, setSubmitting] = useState(false);

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
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await login({ email, password });
    } finally {
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
