import { ProjectForm } from '@/components/projects/project-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
        <p className="text-gray-500 mt-1">
          Start a new IVLP proposal project
        </p>
      </div>

      <ProjectForm />
    </div>
  );
}
