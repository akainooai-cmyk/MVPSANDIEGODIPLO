'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Download, FileText } from 'lucide-react';
import { ChatAssistant } from '@/components/chat/chat-assistant';
import { downloadProposalPDF } from '@/lib/pdf/generator';
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
      <Card>
        <CardHeader>
          <CardTitle>Governmental Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.governmental_resources.map((resource, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold">{resource.name}</h4>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                {resource.url}
              </a>
              <p className="text-gray-700 mt-2">{resource.description}</p>
              <p className="text-sm italic text-gray-600 mt-2">
                <strong>Meeting Focus:</strong> {resource.meeting_focus}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Academic Resources */}
      {content.academic_resources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Academic Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {content.academic_resources.map((resource, index) => (
              <div key={index} className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold">{resource.name}</h4>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {resource.url}
                </a>
                <p className="text-gray-700 mt-2">{resource.description}</p>
                <p className="text-sm italic text-gray-600 mt-2">
                  <strong>Meeting Focus:</strong> {resource.meeting_focus}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Nonprofit Resources */}
      {content.nonprofit_resources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nonprofit Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {content.nonprofit_resources.map((resource, index) => (
              <div key={index} className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold">{resource.name}</h4>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {resource.url}
                </a>
                <p className="text-gray-700 mt-2">{resource.description}</p>
                <p className="text-sm italic text-gray-600 mt-2">
                  <strong>Meeting Focus:</strong> {resource.meeting_focus}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Cultural Activities */}
      {content.cultural_activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cultural Activities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {content.cultural_activities.map((activity, index) => (
              <div key={index} className="border-l-4 border-orange-500 pl-4">
                <h4 className="font-semibold">{activity.name}</h4>
                <a
                  href={activity.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {activity.url}
                </a>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Price:</strong> {activity.price}
                </p>
                <p className="text-gray-700 mt-2">{activity.description}</p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Accessibility:</strong> {activity.accessibility}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* AI Chat Assistant */}
      <ChatAssistant projectId={resolvedParams.id} />
    </div>
  );
}
