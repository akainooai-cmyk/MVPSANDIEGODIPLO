'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DocumentUploader } from '@/components/projects/document-uploader';
import { ChatAssistant } from '@/components/chat/chat-assistant';
import { Sparkles, FileText, Calendar, Users, Building, ArrowLeft, Edit, RefreshCw } from 'lucide-react';
import { getStatusColor } from '@/lib/utils';

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [existingProposal, setExistingProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProject();
    checkExistingProposal();
  }, [resolvedParams.id]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${resolvedParams.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch project');
      }

      setProject(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingProposal = async () => {
    try {
      const response = await fetch(`/api/proposals/project/${resolvedParams.id}`);
      const data = await response.json();

      if (response.ok && data.data) {
        setExistingProposal(data.data);
      }
    } catch (err) {
      // Silently fail, no proposal exists
    }
  };

  const handleGenerateProposal = async (forceRegenerate = false) => {
    // If not forcing regeneration and proposal exists, just redirect
    if (!forceRegenerate && existingProposal) {
      router.push(`/projects/${resolvedParams.id}/edit`);
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/proposals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: resolvedParams.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate proposal');
      }

      // Update existing proposal state
      setExistingProposal(data.data);

      // Redirect to proposal editor
      router.push(`/projects/${resolvedParams.id}/edit`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Project not found'}</p>
        <Button onClick={() => router.push('/projects')} className="mt-4">
          Back to Projects
        </Button>
      </div>
    );
  }

  const hasProjectData = project.documents?.some((d: any) => d.type === 'project_data');
  const hasBiosObjectives = project.documents?.some(
    (d: any) => d.type === 'bios_objectives'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>

        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {project.project_title || project.name}
              </h1>
              <Badge variant={project.status === 'approved' ? 'success' : 'secondary'}>
                {project.status}
              </Badge>
            </div>
            {project.project_number && (
              <p className="text-gray-500 mt-1">{project.project_number}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {existingProposal ? (
              <>
                <Button
                  onClick={() => router.push(`/projects/${resolvedParams.id}/edit`)}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Edit Proposal</span>
                  <span className="sm:hidden">Edit</span>
                </Button>
                <Button
                  onClick={() => handleGenerateProposal(true)}
                  disabled={!hasProjectData || generating}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {generating ? 'Regenerating...' : 'Regenerate'}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => handleGenerateProposal()}
                disabled={!hasProjectData || generating}
                size="lg"
                className="w-full sm:w-auto"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {generating ? 'Generating...' : 'Generate Proposal'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Project Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {project.start_date && project.end_date && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Dates</p>
                  <p className="font-medium">
                    {new Date(project.start_date).toLocaleDateString()} -{' '}
                    {new Date(project.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {project.estimated_participants && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Participants</p>
                  <p className="font-medium">{project.estimated_participants}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {project.sponsoring_agency && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Sponsoring Agency</p>
                  <p className="font-medium">{project.sponsoring_agency}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {project.project_description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{project.project_description}</p>
          </CardContent>
        </Card>
      )}

      {project.subject && (
        <Card>
          <CardHeader>
            <CardTitle>Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{project.subject}</p>
          </CardContent>
        </Card>
      )}

      {/* Documents Upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DocumentUploader
          projectId={resolvedParams.id}
          type="project_data"
          label="Project Data (Required)"
          onUploadSuccess={fetchProject}
        />

        <DocumentUploader
          projectId={resolvedParams.id}
          type="bios_objectives"
          label="Bios & Objectives (Optional)"
          onUploadSuccess={fetchProject}
        />
      </div>

      {/* Info Message */}
      {!hasProjectData && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Upload Project Data</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Upload the Project Data document to enable AI-powered proposal generation.
                  The Bios & Objectives document is optional but recommended for better results.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Chat Assistant */}
      <ChatAssistant projectId={resolvedParams.id} />
    </div>
  );
}
