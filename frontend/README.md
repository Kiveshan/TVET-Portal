# TVET Portal – Frontend

React + TypeScript + Vite.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

## Structure

```
src/
  assets/images/      Static images (DHET logo)
  components/         Reusable UI components – import from '@/components'
    Button/  Card/  ColorStripe/  ConfirmationModal/  Divider/  Dropdown/
    FormField/  Header/  Icon/  Label/  Logo/  RadioButton/  RadioGroup/
    TextBox/  TextLink/  Toast/
  constants/          Static option lists (roles, institutions)
  layouts/            Page shells (AuthLayout = background + header)
  pages/              Route-level screens (Login, Register)
  routes/             React Router route table
  services/           API calls (currently stubs)
  styles/             Global CSS + design tokens (variables.css)
  types/              Shared TypeScript types
  utils/              Helpers (classNames, validation)
```

Each component lives in its own folder with `Component.tsx`, `Component.module.css`
and an `index.ts`, and is re-exported from `src/components/index.ts`:

```tsx
import { Button, TextBox, Dropdown } from '@/components';
```

## Routes

| Path               | Page                                                    | Who          |
| ------------------ | ------------------------------------------------------- | ------------ |
| `/login`           | Login                                                   | Everyone     |
| `/register`        | Registration (DHET / TVET toggle, confirm modal, toast) | Everyone     |
| `/dashboard`       | Submissions dashboard                                   | TVET, DHET   |
| `/admin/users`     | User management with filter cards                       | System Admin |
| `/admin/users/:id` | User preview with Approve / Reject                      | System Admin |

## Test logins

Until the backend handles authentication, these accounts are defined in
`src/constants/testUsers.ts`. All use the password `123456`.

| Role         | Email                   | Lands on       |
| ------------ | ----------------------- | -------------- |
| TVET         | `tvet@tvetportal.test`  | `/dashboard`   |
| DHET         | `dhet@tvetportal.test`  | `/dashboard`   |
| System Admin | `admin@tvetportal.test` | `/admin/users` |

User data on the System Admin pages is mock data from `src/services/userService.ts`;
approvals and rejections reset when the page is reloaded.
