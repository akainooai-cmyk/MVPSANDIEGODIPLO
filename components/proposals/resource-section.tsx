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
  meeting_focus?: string;  // Optional for cultural activities
  price?: string;  // For cultural activities
  accessibility?: string;  // For cultural activities
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
  showTrash?: boolean; // Optional flag to show only deleted resources
}

export function ResourceSection({
  title,
  category,
  resources,
  onResourcesChange,
  onAddResource,
  onDiscussResource,
  showTrash = false,
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

  const handleRestore = (index: number) => {
    const updated = [...resources];
    updated[index] = { ...updated[index], status: 'pending' as const };
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

  // Filter resources based on view mode
  const displayResources = showTrash
    ? resources.filter(r => r.status === 'deleted')
    : resources.filter(r => r.status !== 'deleted');

  const activeResources = resources.filter(r => r.status !== 'deleted');
  const deletedCount = resources.filter(r => r.status === 'deleted').length;
  const approvedCount = resources.filter(r => r.status === 'approved').length;
  const pendingCount = resources.filter(
    r => !r.status || r.status === 'pending'
  ).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{showTrash ? `${title} - Trash` : title}</CardTitle>
            <div className="flex gap-2 mt-2">
              {!showTrash && (
                <>
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
                </>
              )}
              {showTrash && deletedCount > 0 && (
                <span className="text-sm text-red-600">
                  {deletedCount} deleted resource{deletedCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          {!showTrash && (
            <Button onClick={onAddResource} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Resource
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayResources.length > 0 ? (
          displayResources.map((resource, index) => (
            <ResourceCard
              key={resource.id || index}
              resource={resource}
              category={category}
              status={resource.status || 'pending'}
              onApprove={() => handleApprove(resources.indexOf(resource))}
              onDelete={() => handleDelete(resources.indexOf(resource))}
              onEdit={(updated) => handleEdit(resources.indexOf(resource), updated)}
              onDiscuss={() => handleDiscuss(resources.indexOf(resource))}
              onRestore={() => handleRestore(resources.indexOf(resource))}
              isInTrash={showTrash}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            {showTrash ? (
              <p>No deleted resources in this category.</p>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
