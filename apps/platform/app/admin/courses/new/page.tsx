import { redirect } from 'next/navigation';

export default function AdminNewCoursePage() {
  redirect('/dashboard/admin/courses/new');
}