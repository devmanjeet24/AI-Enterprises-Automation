const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RegistrationMode = "create" | "join";

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  registration_mode: RegistrationMode;
  organization_name: string;
  organization_slug: string;
}

export type FieldErrors<T> = Partial<Record<keyof T | "form", string>>;

export function validateLoginForm(values: LoginFormValues): FieldErrors<LoginFormValues> {
  const errors: FieldErrors<LoginFormValues> = {};
  const email = values.email.trim();
  const password = values.password.trim();

  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8 || password.length > 128) {
    errors.password = "Password must be between 8 and 128 characters.";
  }

  return errors;
}

export function validateRegisterForm(values: RegisterFormValues): FieldErrors<RegisterFormValues> {
  const errors: FieldErrors<RegisterFormValues> = {};
  const email = values.email.trim();
  const password = values.password.trim();
  const firstName = values.first_name.trim();
  const lastName = values.last_name.trim();
  const organizationName = values.organization_name.trim();
  const organizationSlug = values.organization_slug.trim();

  if (!firstName) {
    errors.first_name = "First name is required.";
  } else if (firstName.length > 100) {
    errors.first_name = "First name must be 100 characters or fewer.";
  }

  if (!lastName) {
    errors.last_name = "Last name is required.";
  } else if (lastName.length > 100) {
    errors.last_name = "Last name must be 100 characters or fewer.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8 || password.length > 128) {
    errors.password = "Password must be between 8 and 128 characters.";
  }

  if (values.registration_mode === "create") {
    if (!organizationName) {
      errors.organization_name = "Organization name is required.";
    } else if (organizationName.length > 255) {
      errors.organization_name = "Organization name must be 255 characters or fewer.";
    }
  } else if (!organizationSlug) {
    errors.organization_slug = "Organization slug is required.";
  } else if (organizationSlug.length > 100) {
    errors.organization_slug = "Organization slug must be 100 characters or fewer.";
  }

  return errors;
}

export function hasFieldErrors<T>(errors: FieldErrors<T>): boolean {
  return Object.keys(errors).length > 0;
}
