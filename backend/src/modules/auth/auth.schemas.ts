import { z } from 'zod';

// Same rules as frontend/src/utils/validation.ts. The frontend checks for a quick
// response; these checks are the ones that count, since anyone can call the API directly.

const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid institutional email'));

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const RegisterSchema = z
  .object({
    organizationType: z.enum(['DHET', 'TVET'], 'Select an organisation type'),
    fullName: z.string().trim().min(1, 'Full name is required').max(120),
    email,
    institutionId: z.string().trim().optional(),
    jobRoleId: z.string().trim().min(1, 'Select your role'),
    persalNumber: z.string().trim().regex(/^\d{6,10}$/, 'PERSAL number must be 6–10 digits'),
    password: z
      .string()
      .min(8, 'Min. 8 characters with numbers')
      .max(72, 'Password is too long')
      .regex(/\d/, 'Min. 8 characters with numbers')
      .regex(/[a-zA-Z]/, 'Min. 8 characters with numbers'),
  })
  .refine((data) => data.organizationType !== 'TVET' || !!data.institutionId, {
    path: ['institutionId'],
    message: 'Select your institution',
  });

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
