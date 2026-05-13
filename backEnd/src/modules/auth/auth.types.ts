export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  role?: "USER" | "ADMIN";   // Optional role field
}
