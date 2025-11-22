'use client';

import { use, useState, useEffect } from 'react';
import { ResourceForm } from '@/components/resources/resource-form';
import { createClient } from '@/lib/supabase/client';
import type { Resource } from '@/lib/types';

export default function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResource();
  }, [resolvedParams.id]);

  const fetchResource = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

      if (error) throw error;

      setResource(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading resource...</p>
        </div>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Resource not found'}</p>
      </div>
    );
  }

  return <ResourceForm mode="edit" initialData={resource} />;
}
