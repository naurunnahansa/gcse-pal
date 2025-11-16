import { redirect } from 'next/navigation';

export default function AdminEditCoursePage({ params }: { params: { id: string } }) {
  redirect(`/dashboard/admin/courses/${params.id}`);
}