'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const CoursePage = () => {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;

  useEffect(() => {
    if (courseId) {
      router.replace(`/learning/${courseId}/overview`);
    }
  }, [courseId, router]);

  return null;
};

export default CoursePage;