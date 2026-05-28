export type Role = "USER" | "MERCHANT" | "ADMIN";

export type CurrentUser = {
  id: number;
  username: string;
  role: Role;
};

export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type LoginResponse = {
  token: string;
  user: CurrentUser;
};
