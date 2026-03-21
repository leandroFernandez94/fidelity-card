export type Rol = 'admin' | 'clienta';

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

export type PublicProfile = {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  rol: Rol;
  puntos: number;
  created_at: string;
};
