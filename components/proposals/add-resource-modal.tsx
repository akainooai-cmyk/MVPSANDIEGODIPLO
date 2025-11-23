'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Globe, Sparkles, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AddResourceModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (resource: any) => void;
  category: 'governmental' | 'academic' | 'nonprofit' | 'cultural';
}

interface ResourceSearchResult {
  id: string;
  name: string;
  url: string;
  description: string;
  category: string;
}

export function AddResourceModal({
  open,
  onClose,
  onAdd,
  category,
}: AddResourceModalProps) {
  const [activeTab, setActiveTab] = useState('database');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ResourceSearchResult[]>([]);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  // Manual creation state
  const [manualResource, setManualResource] = useState({
    name: '',
    url: '',
    description: '',
    meeting_focus: '',
  });

  const handleDatabaseSearch = async () => {
    setSearching(true);
    try {
      const response = await fetch(
        `/api/resources/search?q=${encodeURIComponent(searchQuery)}&category=${category}`
      );
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleWebSearch = async () => {
    setSearching(true);
    try {
      const response = await fetch('/api/resources/web-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, category }),
      });
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error('Web search failed:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAiSuggestion = async () => {
    setAiSuggesting(true);
    try {
      const response = await fetch('/api/resources/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, context: searchQuery }),
      });
      const data = await response.json();
      setAiSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('AI suggestion failed:', err);
      setAiSuggestions([]);
    } finally {
      setAiSuggesting(false);
    }
  };

  const handleAddFromSearch = (result: any) => {
    onAdd({
      ...result,
      meeting_focus: result.meeting_focus || 'To be determined during visit planning',
    });
    onClose();
  };

  const handleAddManual = () => {
    if (!manualResource.name || !manualResource.url) {
      alert('Please fill in at least name and URL');
      return;
    }
    onAdd(manualResource);
    setManualResource({ name: '', url: '', description: '', meeting_focus: '' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Resource - {category}</DialogTitle>
          <DialogDescription>
            Search our database, the web, get AI suggestions, or create manually
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="database">
              <Search className="h-4 w-4 mr-2" />
              Database
            </TabsTrigger>
            <TabsTrigger value="web">
              <Globe className="h-4 w-4 mr-2" />
              Web Search
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Suggest
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Plus className="h-4 w-4 mr-2" />
              Manual
            </TabsTrigger>
          </TabsList>

          {/* Database Search */}
          <TabsContent value="database" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search in 693 resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDatabaseSearch()}
              />
              <Button onClick={handleDatabaseSearch} disabled={searching}>
                {searching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <Card key={result.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold">{result.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{result.description}</p>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline mt-1 block"
                          >
                            {result.url}
                          </a>
                        </div>
                        <Button size="sm" onClick={() => handleAddFromSearch(result)}>
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : searchQuery && !searching ? (
                <p className="text-center text-gray-500 py-8">No results found</p>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Enter a search term to find resources
                </p>
              )}
            </div>
          </TabsContent>

          {/* Web Search */}
          <TabsContent value="web" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search on the web..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleWebSearch()}
              />
              <Button onClick={handleWebSearch} disabled={searching}>
                {searching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((result, idx) => (
                  <Card key={idx} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold">{result.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{result.description}</p>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline mt-1 block"
                          >
                            {result.url}
                          </a>
                        </div>
                        <Button size="sm" onClick={() => handleAddFromSearch(result)}>
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : searchQuery && !searching ? (
                <p className="text-center text-gray-500 py-8">No results found</p>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Enter a search term to find resources on the web
                </p>
              )}
            </div>
          </TabsContent>

          {/* AI Suggestions */}
          <TabsContent value="ai" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Describe what you're looking for (optional)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button onClick={handleAiSuggestion} disabled={aiSuggesting}>
                {aiSuggesting ? 'Thinking...' : 'Get Suggestions'}
              </Button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {aiSuggestions.length > 0 ? (
                aiSuggestions.map((suggestion, idx) => (
                  <Card key={idx} className="hover:shadow-md transition-shadow border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-blue-500" />
                            <h4 className="font-semibold">{suggestion.name}</h4>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            <strong>Suggested meeting focus:</strong> {suggestion.meeting_focus}
                          </p>
                          <a
                            href={suggestion.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline mt-1 block"
                          >
                            {suggestion.url}
                          </a>
                        </div>
                        <Button size="sm" onClick={() => handleAddFromSearch(suggestion)}>
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : !aiSuggesting ? (
                <p className="text-center text-gray-500 py-8">
                  Click "Get Suggestions" to let AI recommend relevant resources
                </p>
              ) : null}
            </div>
          </TabsContent>

          {/* Manual Creation */}
          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Resource Name *</label>
                <Input
                  placeholder="e.g., San Diego Police Department"
                  value={manualResource.name}
                  onChange={(e) =>
                    setManualResource({ ...manualResource, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">URL *</label>
                <Input
                  placeholder="https://..."
                  value={manualResource.url}
                  onChange={(e) =>
                    setManualResource({ ...manualResource, url: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Textarea
                  placeholder="What does this organization do?"
                  value={manualResource.description}
                  onChange={(e) =>
                    setManualResource({ ...manualResource, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Meeting Focus</label>
                <Textarea
                  placeholder="What will participants learn or experience?"
                  value={manualResource.meeting_focus}
                  onChange={(e) =>
                    setManualResource({ ...manualResource, meeting_focus: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <Button onClick={handleAddManual} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
