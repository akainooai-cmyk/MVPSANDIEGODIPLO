import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Load the database resources
let resourcesData: any[] = [];

try {
  const filePath = path.join(process.cwd(), 'database_resources.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  resourcesData = JSON.parse(fileContent);
} catch (error) {
  console.error('Failed to load database_resources.json:', error);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.toLowerCase() || '';
  const category = searchParams.get('category') || '';

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  // Map category names
  const categoryMap: { [key: string]: string } = {
    governmental: 'Governmental',
    academic: 'Academic',
    nonprofit: 'Nonprofit/NGO',
    cultural: 'Cultural',
  };

  const targetCategory = categoryMap[category];

  // Filter resources
  let results = resourcesData.filter((resource) => {
    const matchesQuery =
      resource.name?.toLowerCase().includes(query) ||
      resource.description?.toLowerCase().includes(query) ||
      resource.topics?.toLowerCase().includes(query);

    const matchesCategory = targetCategory
      ? resource.category === targetCategory
      : true;

    return matchesQuery && matchesCategory;
  });

  // Limit to top 10 results
  results = results.slice(0, 10);

  // Format results
  const formattedResults = results.map((resource) => ({
    id: resource.id || `resource-${Math.random()}`,
    name: resource.name || 'Unknown',
    url: resource.url || '',
    description: resource.description || '',
    category: resource.category || '',
    meeting_focus: resource.meeting_focus || 'To be determined during visit planning',
  }));

  return NextResponse.json({ results: formattedResults });
}
