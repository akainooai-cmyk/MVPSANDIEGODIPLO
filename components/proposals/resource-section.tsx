'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { ResourceCard } from './resource-card';

type ResourceStatus = 'pending' | 'approved' | 'edited' | 'deleted';

interface ResourceWithStatus {
  name: string;
  url: string;
  description: string;
  meeting_focus: string;
  status?: ResourceStatus;
  id?: string;
}

interface ResourceSectionProps {
  title: string;
  category: 'governmental' | 'academic' | 'nonprofit' | 'cultural';
  resources: ResourceWithStatus[];
  onResourcesChange: (resources: ResourceWithStatus[]) => void;
  onAddResource: () => void;
  onDiscussResource: (resource: ResourceWithStatus) => void;
}

export function ResourceSection({
  title,
  category,
  resources,
  onResourcesChange,
  onAddResource,
  onDiscussResource,
}: ResourceSectionProps) {
  const handleApprove = (index: number) => {
    const updated = [...resources];
    updated[index] = { ...updated[index], status: 'approved' as const };
    onResourcesChange(updated);
  };

  const handleDelete = (index: number) => {
    const updated = [...resources];
    updated[index] = { ...updated[index], status: 'deleted' as const };
    onResourcesChange(updated);
  };

  const handleEdit = (index: number, updatedResource: ResourceWithStatus) => {
    const updated = [...resources];
    updated[index] = { ...updatedResource, status: 'edited' as const };
    onResourcesChange(updated);
  };

  const handleDiscuss = (index: number) => {
    onDiscussResource(resources[index]);
  };

  // Filter out deleted resources for display count
  const activeResources = resources.filter(r => r.status !== 'deleted');
  const approvedCount = resources.filter(r => r.status === 'approved').length;
  const pendingCount = resources.filter(
    r => !r.status || r.status === 'pending'
  ).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <div className="flex gap-2 mt-2">
              {approvedCount > 0 && (
                <span className="text-sm text-green-600">
                  {approvedCount} approved
                </span>
              )}
              {pendingCount > 0 && (
                <span className="text-sm text-gray-500">
                  {pendingCount} pending review
                </span>
              )}
            </div>
          </div>
          <Button onClick={onAddResource} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Resource
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeResources.length > 0 ? (
          activeResources.map((resource, index) => (
            <ResourceCard
              key={resource.id || index}
              resource={resource}
              category={category}
              status={resource.status || 'pending'}
              onApprove={() => handleApprove(resources.indexOf(resource))}
              onDelete={() => handleDelete(resources.indexOf(resource))}
              onEdit={(updated) => handleEdit(resources.indexOf(resource), updated)}
              onDiscuss={() => handleDiscuss(resources.indexOf(resource))}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No resources in this category yet.</p>
            <Button
              onClick={onAddResource}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add First Resource
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
