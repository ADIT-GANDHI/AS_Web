'use client';

import ReflectionDetailsPage from '@/components/Reflections/ReflectionDetailsPage';
import { getReflectionById, getRelatedByReflectionId } from '@/lib/services/reflectionsService';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ReflectionDetailsClient({ id }: { id: string }) {
  const params = useParams<{ id?: string }>();
  const reflectionId = String(params?.id || id || '').trim();

  const [reflection, setReflection] = useState<any>(null);
  const [related, setRelated] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reflectionId) return;

    setLoading(true);
    setReflection(null);
    setRelated(null);

    Promise.all([getReflectionById(reflectionId), getRelatedByReflectionId(reflectionId)])
      .then(([reflectionData, relatedData]) => {
        setReflection(reflectionData?.data || null);
        setRelated(relatedData?.status === false ? null : relatedData || null);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [reflectionId]);

  return <ReflectionDetailsPage data={reflection} related={related} isLoading={loading} />;
}
