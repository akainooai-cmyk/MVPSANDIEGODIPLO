'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Check, X, Edit2, MessageCircle, Trash2, Save } from 'lucide-react';

type ResourceStatus = 'pending' | 'approved' | 'edited' | 'deleted';

interface ResourceCardProps {
  resource: {
    name: string;
    url: string;
    description: string;
    meeting_focus: string;
  };
  category: 'governmental' | 'academic' | 'nonprofit' | 'cultural';
  status?: ResourceStatus;
  onApprove: () => void;
  onDelete: () => void;
  onEdit: (updatedResource: any) => void;
  onDiscuss: () => void;
}

const categoryColors = {
  governmental: 'border-blue-500',
  academic: 'border-green-500',
  nonprofit: 'border-purple-500',
  cultural: 'border-orange-500',
};

const statusBadges = {
  pending: { text: 'Review', variant: 'secondary' as const },
  approved: { text: 'Approved', variant: 'default' as const },
  edited: { text: 'Edited', variant: 'outline' as const },
  deleted: { text: 'Deleted', variant: 'destructive' as const },
};

export function ResourceCard({
  resource,
  category,
  status = 'pending',
  onApprove,
  onDelete,
  onEdit,
  onDiscuss,
}: ResourceCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedResource, setEditedResource] = useState(resource);

  const handleSave = () => {
    onEdit(editedResource);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedResource(resource);
    setIsEditing(false);
  };

  if (status === 'deleted') {
    return null; // Don't render deleted resources
  }

  return (
    <Card className={`border-l-4 ${categoryColors[category]} ${status === 'deleted' ? 'opacity-50' : ''}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with status and actions */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editedResource.name}
                  onChange={(e) =>
                    setEditedResource({ ...editedResource, name: e.target.value })
                  }
                  className="font-semibold"
                />
              ) : (
                <h4 className="font-semibold text-base">{resource.name}</h4>
              )}
            </div>
            <Badge variant={statusBadges[status].variant}>
              {statusBadges[status].text}
            </Badge>
          </div>

          {/* URL */}
          {isEditing ? (
            <Input
              value={editedResource.url}
              onChange={(e) =>
                setEditedResource({ ...editedResource, url: e.target.value })
              }
              placeholder="https://..."
              className="text-sm"
            />
          ) : (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline block"
            >
              {resource.url}
            </a>
          )}

          {/* Description */}
          {isEditing ? (
            <Textarea
              value={editedResource.description}
              onChange={(e) =>
                setEditedResource({ ...editedResource, description: e.target.value })
              }
              rows={3}
              className="text-sm"
            />
          ) : (
            <p className="text-gray-700 text-sm">{resource.description}</p>
          )}

          {/* Meeting Focus */}
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs font-semibold text-gray-600 mb-1">Meeting Focus:</p>
            {isEditing ? (
              <Textarea
                value={editedResource.meeting_focus}
                onChange={(e) =>
                  setEditedResource({
                    ...editedResource,
                    meeting_focus: e.target.value,
                  })
                }
                rows={2}
                className="text-sm"
              />
            ) : (
              <p className="text-sm italic text-gray-700">{resource.meeting_focus}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave} className="flex-1">
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} className="flex-1">
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                {status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={onApprove}
                    variant="default"
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Keep
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="flex-1"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  onClick={onDiscuss}
                  variant="outline"
                  className="flex-1"
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Discuss
                </Button>
                <Button
                  size="sm"
                  onClick={onDelete}
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
