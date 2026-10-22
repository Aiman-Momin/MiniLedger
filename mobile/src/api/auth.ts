import { apiRequest } from './client';

export type User = {
  id: string;
  phone: string;
  createdAt: string;
};

type OtpRequestResult = {
  phone: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
};

export function requestOtp(phone: string) {
  return apiRequest<OtpRequestResult>('/auth/request-otp', { method: 'POST', body: { phone } });
}

export function verifyOtp(phone: string, code: string) {
  return apiRequest<{ token: string; user: User }>('/auth/verify-otp', {
    method: 'POST',
    body: { phone, code },
  });
}
