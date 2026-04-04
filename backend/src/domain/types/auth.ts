export type { Rol } from '@fidelity-card/shared';
export type { Profile as PublicProfile } from '@fidelity-card/shared';

export type SignupBody = {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  telefono: string;
};

export type SigninBody = {
  email: string;
  password: string;
};

export type PublicUser = {
  id: string;
  email: string;
  created_at: string;
};
