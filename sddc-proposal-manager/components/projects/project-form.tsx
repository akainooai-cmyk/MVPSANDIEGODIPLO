'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectFormProps {
  onSuccess?: () => void;
}

export function ProjectForm({ onSuccess }: ProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    project_number: '',
    project_title: '',
    project_type: '',
    start_date: '',
    end_date: '',
    estimated_participants: '',
    sponsoring_agency: '',
    subject: '',
    project_description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          project_number: formData.project_number,
          project_title: formData.project_title || null,
          project_type: formData.project_type || null,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          estimated_participants: formData.estimated_participants
            ? parseInt(formData.estimated_participants)
            : null,
          sponsoring_agency: formData.sponsoring_agency || null,
          subject: formData.subject || null,
          project_description: formData.project_description || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/projects/${data.data.id}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Project Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Internal project name"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_number">Project Number</Label>
              <Input
                id="project_number"
                name="project_number"
                value={formData.project_number}
                onChange={handleChange}
                placeholder="e.g., E/VRF-2025-0055"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project_title">Project Title</Label>
            <Input
              id="project_title"
              name="project_title"
              value={formData.project_title}
              onChange={handleChange}
              placeholder="Official project title"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Main subject or theme"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project_description">Description</Label>
            <Textarea
              id="project_description"
              name="project_description"
              value={formData.project_description}
              onChange={handleChange}
              placeholder="Brief description of the project"
              rows={4}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project_type">Project Type</Label>
              <Input
                id="project_type"
                name="project_type"
                value={formData.project_type}
                onChange={handleChange}
                placeholder="e.g., Single-Country, Multi-Regional"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sponsoring_agency">Sponsoring Agency</Label>
              <Input
                id="sponsoring_agency"
                name="sponsoring_agency"
                value={formData.sponsoring_agency}
                onChange={handleChange}
                placeholder="e.g., U.S. Department of State"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_participants">
                Estimated Participants
              </Label>
              <Input
                id="estimated_participants"
                name="estimated_participants"
                type="number"
                value={formData.estimated_participants}
                onChange={handleChange}
                placeholder="Number of participants"
                min="1"
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}
