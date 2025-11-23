'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import type { Resource, ResourceCategory, CreateResourceInput } from '@/lib/types';

interface ResourceFormProps {
  initialData?: Resource;
  mode: 'create' | 'edit';
}

export function ResourceForm({ initialData, mode }: ResourceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<CreateResourceInput>({
    category: initialData?.category || 'governmental',
    name: initialData?.name || '',
    description: initialData?.description || '',
    url: initialData?.url || '',
    meeting_focus: initialData?.meeting_focus || '',
    price: initialData?.price || '',
    accessibility: initialData?.accessibility || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = mode === 'create'
        ? '/api/resources'
        : `/api/resources/${initialData?.id}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save resource');
      }

      router.push('/resources');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof CreateResourceInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/resources"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Resources
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {mode === 'create' ? 'Add New Resource' : 'Edit Resource'}
            </h1>
            <p className="text-gray-500 mt-1">
              {mode === 'create'
                ? 'Add a new resource to the database'
                : 'Update resource information'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Resource Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="governmental">Governmental</option>
                <option value="academic">Academic</option>
                <option value="nonprofit">Nonprofit</option>
                <option value="cultural">Cultural</option>
              </select>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Resource name"
                required
              />
            </div>

            {/* URL */}
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => updateField('url', e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe this resource..."
                rows={4}
              />
            </div>

            {/* Meeting Focus */}
            <div className="space-y-2">
              <Label htmlFor="meeting_focus">Meeting Focus</Label>
              <Textarea
                id="meeting_focus"
                value={formData.meeting_focus}
                onChange={(e) => updateField('meeting_focus', e.target.value)}
                placeholder="What topics or areas should meetings with this resource focus on?"
                rows={3}
              />
            </div>

            {/* Price - for cultural activities */}
            {formData.category === 'cultural' && (
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  value={formData.price}
                  onChange={(e) => updateField('price', e.target.value)}
                  placeholder="e.g., Free, $10-20, $$"
                />
              </div>
            )}

            {/* Accessibility - for cultural activities */}
            {formData.category === 'cultural' && (
              <div className="space-y-2">
                <Label htmlFor="accessibility">Accessibility</Label>
                <Textarea
                  id="accessibility"
                  value={formData.accessibility}
                  onChange={(e) => updateField('accessibility', e.target.value)}
                  placeholder="Accessibility information (wheelchair access, parking, etc.)"
                  rows={2}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <Link href="/resources">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : mode === 'create' ? 'Create Resource' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
