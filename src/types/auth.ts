export type AuthUser = {
  id: string;
  email: string;
  fullName?: string | null;
  role?: string | null;
};

export type AuthBusiness = {
  id?: string;
  businessName?: string | null;
} | null;

export type MeResponse = {
  user: AuthUser;
  business: AuthBusiness;
  requiresProfileCompletion?: boolean;
  canSubmitOnBehalf?: boolean;
  isImpersonating?: boolean;
  isImpersonatingUser?: boolean;
  impersonatedUserName?: string;
  impersonatedUserRole?: string;
};

export type Login2FAPayload = {
  requires2FA: true;
  tempToken: string;
  method: "totp" | "email_otp";
};

export type LoginSuccessPayload = {
  sessionToken: string;
  id?: string;
  email?: string;
  [key: string]: unknown;
};
