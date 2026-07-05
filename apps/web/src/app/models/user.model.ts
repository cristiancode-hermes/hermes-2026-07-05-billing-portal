export interface User {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  organizationName?: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}
