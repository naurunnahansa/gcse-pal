import { api } from '../api';

export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  revenue: number;
  activeUsers: number;
  newUsersThisMonth: number;
  coursesThisMonth: number;
  enrollmentsThisMonth: number;
  revenueThisMonth: number;
}

export class AdminAPI {
  private static basePath = '/admin';

  static async getStats(): Promise<AdminStats> {
    const response = await api.get<{ success: boolean; data: AdminStats }>(`${this.basePath}/stats`);
    return response.data;
  }
}