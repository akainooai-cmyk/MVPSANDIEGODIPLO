'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Filter, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Resource, ResourceCategory } from '@/lib/types';

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    let filtered = resources;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(r => r.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(query) ||
        (r.description && r.description.toLowerCase().includes(query)) ||
        (r.meeting_focus && r.meeting_focus.toLowerCase().includes(query)) ||
        (r.url && r.url.toLowerCase().includes(query))
      );
    }

    setFilteredResources(filtered);
  }, [selectedCategory, resources, searchQuery]);

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/resources');
      const data = await response.json();

      if (data.data) {
        setResources(data.data);
        setFilteredResources(data.data);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      const response = await fetch(`/api/resources/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setResources(prev => prev.filter(r => r.id !== id));
      } else {
        alert('Failed to delete resource');
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Failed to delete resource');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Resources</h1>
          <p className="text-gray-500 mt-1">
            Manage San Diego resources database
          </p>
        </div>
        <Link href="/resources/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Resource
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search resources by name, description, focus, or URL..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 px-2"
            onClick={() => setSearchQuery('')}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          All ({resources.length})
        </Button>
        {['governmental', 'academic', 'nonprofit', 'cultural'].map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category as ResourceCategory)}
            className="capitalize"
          >
            {category} ({resources.filter(r => r.category === category).length})
          </Button>
        ))}
      </div>

      {/* Categories Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {['governmental', 'academic', 'nonprofit', 'cultural'].map((category) => (
          <Card key={category} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedCategory(category as ResourceCategory)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-lg capitalize">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl sm:text-2xl font-bold">
                {resources.filter(r => r.category === category).length}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">resources</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resources List */}
      {filteredResources.length > 0 ? (
        <div className="space-y-4">
          {filteredResources.map((resource) => (
            <Card key={resource.id}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <h3 className="font-semibold text-base sm:text-lg">{resource.name}</h3>
                      <Badge variant="secondary" className="capitalize w-fit">
                        {resource.category}
                      </Badge>
                    </div>
                    {resource.description && (
                      <p className="text-sm sm:text-base text-gray-600 mb-2">{resource.description}</p>
                    )}
                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs sm:text-sm block mb-2 break-all"
                      >
                        {resource.url}
                      </a>
                    )}
                    {resource.meeting_focus && (
                      <p className="text-xs sm:text-sm text-gray-500 mt-2">
                        <span className="font-medium">Meeting Focus:</span> {resource.meeting_focus}
                      </p>
                    )}
                    {resource.price && (
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        <span className="font-medium">Price:</span> {resource.price}
                      </p>
                    )}
                    {resource.accessibility && (
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        <span className="font-medium">Accessibility:</span> {resource.accessibility}
                      </p>
                    )}
                  </div>
                  <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                    <Link href={`/resources/${resource.id}/edit`} className="flex-1 sm:flex-none">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(resource.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-none"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">
              No resources yet. Add resources to build your database.
            </p>
            <Link href="/resources/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
