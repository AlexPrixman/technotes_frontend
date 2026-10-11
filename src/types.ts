export type Role = "Employee" | "Manager" | "Admin";
export interface User {
  _id: string;
  username: string;
  roles: Role[];
  active: boolean;
}
export interface Note {
  _id: string;
  user: string;
  ticket: number;
  title: string;
  text: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}
export const canManage = (user: User | null) =>
  !!user?.roles.some((role) => role === "Admin" || role === "Manager");
