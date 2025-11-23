'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Download, FileText, MessageCircle } from 'lucide-react';
import { ChatAssistant } from '@/components/chat/chat-assistant';
import { downloadProposalPDF } from '@/lib/pdf/generator';
import { ResourceSection } from '@/components/proposals/resource-section';
import type { ProposalContent } from '@/lib/types';

export default function ProposalEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [proposal, setProposal] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [content, setContent] = useState<ProposalContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [chatContext, setChatContext] = useState<any>(null);

  useEffect(() => {
    fetchProposal();
  }, [resolvedParams.id]);

  const fetchProposal = async () => {
    try {
      // First get the project
      const projectResponse = await fetch(`/api/projects/${resolvedParams.id}`);
      const projectData = await projectResponse.json();

      if (!projectResponse.ok) {
        throw new Error('Project not found');
      }

      setProject(projectData.data);

      // Check if a proposal already exists for this project
      const existingProposalResponse = await fetch(
        `/api/proposals/project/${resolvedParams.id}`
      );
      const existingProposalData = await existingProposalResponse.json();

      if (existingProposalResponse.ok && existingProposalData.data) {
        // Proposal exists, load it
        setProposal(existingProposalData.data);
        setContent(existingProposalData.data.content);
      } else {
        // No proposal exists, redirect to project page with message
        setError('No proposal found. Please generate one first from the project page.');
        setTimeout(() => {
          router.push(`/projects/${resolvedParams.id}`);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!proposal || !content) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/proposals/${proposal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save proposal');
      }

      alert('Proposal saved successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddResource = (category: keyof ProposalContent) => {
    // TODO: Open modal to add resource
    alert(`Add resource to ${category} - Feature coming in next phase!`);
  };

  const handleDiscussResource = (resource: any) => {
    // Open chat with context about this resource
    setShowChat(true);
    // TODO: Auto-populate chat with context in Phase 3
  };

  const handleExport = async (format: 'docx' | 'pdf') => {
    if (!proposal || !content || !project) return;

    try {
      if (format === 'pdf') {
        // Generate PDF on client-side
        const projectTitle = project.project_title || project.name || 'proposal';
        const sanitizedTitle = projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `${sanitizedTitle}_v${proposal.version}.pdf`;

        await downloadProposalPDF(content, project, filename);
      } else {
        // DOCX export via API
        const response = await fetch(`/api/proposals/${proposal.id}/export`);

        if (!response.ok) {
          throw new Error('Failed to export proposal as DOCX');
        }

        // Get the filename from the Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
        const filename = filenameMatch ? filenameMatch[1] : 'proposal.docx';

        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal || !content) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Proposal not found'}</p>
        <Button onClick={() => router.push(`/projects/${resolvedParams.id}`)} className="mt-4">
          Back to Project
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/projects/${resolvedParams.id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">Edit Proposal</h1>
              <Badge>Version {proposal.version}</Badge>
            </div>
            <p className="text-gray-500 mt-1">
              AI-generated proposal - Review and edit as needed
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => handleExport('pdf')} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={() => handleExport('docx')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export DOCX
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Why San Diego */}
      <Card>
        <CardHeader>
          <CardTitle>Why San Diego?</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={content.why_san_diego}
            onChange={(e) =>
              setContent({ ...content, why_san_diego: e.target.value })
            }
            rows={6}
            className="font-sans"
          />
        </CardContent>
      </Card>

      {/* Governmental Resources */}
      <ResourceSection
        title="Governmental Resources"
        category="governmental"
        resources={content.governmental_resources}
        onResourcesChange={(updated) =>
          setContent({ ...content, governmental_resources: updated })
        }
        onAddResource={() => handleAddResource('governmental_resources')}
        onDiscussResource={handleDiscussResource}
      />

      {/* Academic Resources */}
      <ResourceSection
        title="Academic Resources"
        category="academic"
        resources={content.academic_resources}
        onResourcesChange={(updated) =>
          setContent({ ...content, academic_resources: updated })
        }
        onAddResource={() => handleAddResource('academic_resources')}
        onDiscussResource={handleDiscussResource}
      />

      {/* Nonprofit Resources */}
      <ResourceSection
        title="Nonprofit Resources"
        category="nonprofit"
        resources={content.nonprofit_resources}
        onResourcesChange={(updated) =>
          setContent({ ...content, nonprofit_resources: updated })
        }
        onAddResource={() => handleAddResource('nonprofit_resources')}
        onDiscussResource={handleDiscussResource}
      />

      {/* Cultural Activities */}
      <ResourceSection
        title="Cultural Activities"
        category="cultural"
        resources={content.cultural_activities}
        onResourcesChange={(updated) =>
          setContent({ ...content, cultural_activities: updated })
        }
        onAddResource={() => handleAddResource('cultural_activities')}
        onDiscussResource={handleDiscussResource}
      />

      {/* AI Chat Assistant - Fixed bottom right */}
      {showChat && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl rounded-lg overflow-hidden z-50 bg-white">
          <div className="relative h-full">
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2 z-10"
              onClick={() => setShowChat(false)}
            >
              Close
            </Button>
            <ChatAssistant projectId={resolvedParams.id} />
          </div>
        </div>
      )}

      {/* Chat Toggle Button */}
      {!showChat && (
        <Button
          className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg"
          onClick={() => setShowChat(true)}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
