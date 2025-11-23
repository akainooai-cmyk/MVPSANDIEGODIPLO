'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, X, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

interface Suggestion {
  type: 'add_resource' | 'replace_resource' | 'improve_description' | 'improve_why_sd' | 'balance';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  target?: string;
}

interface SuggestionsPanelProps {
  proposalId: string;
  onDismiss?: () => void;
}

const priorityColors = {
  high: 'bg-red-100 text-red-700 border-red-300',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  low: 'bg-blue-100 text-blue-700 border-blue-300',
};

const typeLabels = {
  add_resource: 'Add Resource',
  replace_resource: 'Replace Resource',
  improve_description: 'Improve Description',
  improve_why_sd: 'Improve Why San Diego',
  balance: 'Balance Resources',
};

export function SuggestionsPanel({ proposalId, onDismiss }: SuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchSuggestions();
  }, [proposalId]);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}/suggestions`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load suggestions');
      }

      setSuggestions(data.suggestions || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissSuggestion = (index: number) => {
    setDismissedSuggestions(new Set([...dismissedSuggestions, index]));
  };

  const visibleSuggestions = suggestions.filter(
    (_, index) => !dismissedSuggestions.has(index)
  );

  if (loading) {
    return (
      <Card className="border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 animate-pulse text-blue-500" />
            <p className="text-sm text-gray-600">AI is analyzing your proposal...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || visibleSuggestions.length === 0) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">
              AI Suggestions ({visibleSuggestions.length})
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
              >
                Dismiss All
              </Button>
            )}
            <Button size="sm" variant="ghost">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-3">
          {visibleSuggestions.map((suggestion, index) => (
            <Card key={index} className={`border ${priorityColors[suggestion.priority]}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {typeLabels[suggestion.type]}
                      </Badge>
                      <Badge
                        variant={
                          suggestion.priority === 'high'
                            ? 'destructive'
                            : suggestion.priority === 'medium'
                            ? 'default'
                            : 'secondary'
                        }
                        className="text-xs"
                      >
                        {suggestion.priority} priority
                      </Badge>
                    </div>

                    <h4 className="font-semibold text-sm">{suggestion.title}</h4>
                    <p className="text-sm text-gray-700">{suggestion.description}</p>

                    {suggestion.target && (
                      <p className="text-xs text-gray-500">
                        <strong>Target:</strong> {suggestion.target}
                      </p>
                    )}

                    <div className="bg-white/50 p-2 rounded border border-blue-200 mt-2">
                      <p className="text-xs font-medium text-blue-700 mb-1">Suggested Action:</p>
                      <p className="text-sm text-gray-700">{suggestion.action}</p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDismissSuggestion(index)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            These suggestions are AI-generated. Review them carefully before implementing.
          </div>
        </CardContent>
      )}
    </Card>
  );
}
