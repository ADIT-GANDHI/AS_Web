'use client';

import PeopleDetailsPage from '@/components/People/PeopleDetailsPage';
import { getPersonById, getRelatedByPeopleId } from '@/lib/services/peopleService';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PeopleDetailsClient({ id }: { id: string }) {
  const params = useParams<{ id?: string }>();
  const personId = String(params?.id || id || '').trim();

  const [person, setPerson] = useState<any>(null);
  const [related, setRelated] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!personId) return;

    setLoading(true);
    setPerson(null);
    setRelated(null);

    Promise.all([getPersonById(personId), getRelatedByPeopleId(personId)])
      .then(([personData, relatedData]) => {
        setPerson(personData || null);
        setRelated(relatedData?.status === false ? null : relatedData || null);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [personId]);

  return <PeopleDetailsPage data={person} related={related} isLoading={loading} />;
}
