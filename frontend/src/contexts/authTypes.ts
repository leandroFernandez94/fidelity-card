import type { Profile } from '../types';

export type AuthUser = {
  id: string;
  email: string;
  created_at: string;
};

export type AuthPayload = {
  user: AuthUser;
  profile: Profile;
};
