import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ImageRun,
} from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import type { ProposalContent } from '@/lib/types';

interface ProposalDocxOptions {
  projectTitle: string;
  projectNumber?: string;
  projectType?: string;
  startDate?: string;
  endDate?: string;
  content: ProposalContent;
}

export async function generateProposalDocx(
  options: ProposalDocxOptions
): Promise<Buffer> {
  const {
    projectTitle,
    projectNumber,
    projectType,
    startDate,
    endDate,
    content,
  } = options;

  // Load logo image
  const logoPath = path.join(process.cwd(), 'public', 'logo-sddc.jpg');
  let logoImage: Buffer | undefined;

  try {
    if (fs.existsSync(logoPath)) {
      logoImage = fs.readFileSync(logoPath);
    }
  } catch (error) {
    console.warn('Could not load logo for DOCX export:', error);
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // Logo
          ...(logoImage
            ? [
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: logoImage,
                      transformation: {
                        width: 200,
                        height: 80,
                      },
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 400 },
                }),
              ]
            : []),

          // Header Information
          new Paragraph({
            children: [
              new TextRun({
                text: 'San Diego Diplomacy Council',
                bold: true,
                size: 32,
                color: '1E3A5F',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: 'IVLP Proposal',
                size: 28,
                color: '1E3A5F',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Project Details
          new Paragraph({
            children: [
              new TextRun({ text: 'Project Title/Subject: ', bold: true }),
              new TextRun(projectTitle),
            ],
            spacing: { after: 100 },
          }),

          ...(projectType
            ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Project Type: ', bold: true }),
                    new TextRun(projectType),
                  ],
                  spacing: { after: 100 },
                }),
              ]
            : []),

          new Paragraph({
            children: [
              new TextRun({ text: 'NPA: ', bold: true }),
              new TextRun('San Diego Diplomacy Council'),
            ],
            spacing: { after: 100 },
          }),

          ...(startDate && endDate
            ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Project Dates: ', bold: true }),
                    new TextRun(`${startDate} - ${endDate}`),
                  ],
                  spacing: { after: 100 },
                }),
              ]
            : []),

          new Paragraph({
            children: [
              new TextRun({ text: 'Point of Contact: ', bold: true }),
              new TextRun('Lulu Bonning, Executive Director'),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [new TextRun('(619) 289-8642')],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [new TextRun('lulu@sandiegodiplomacy.org')],
            spacing: { after: 400 },
          }),

          // Why San Diego
          new Paragraph({
            text: 'Why San Diego?',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [new TextRun(content.why_san_diego)],
            spacing: { after: 400 },
          }),

          // Governmental Resources
          new Paragraph({
            text: 'Governmental Resources',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          ...generateResourceParagraphs(content.governmental_resources),

          // Academic Resources
          ...(content.academic_resources.length > 0
            ? [
                new Paragraph({
                  text: 'Academic Resources',
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 400, after: 200 },
                }),
                ...generateResourceParagraphs(content.academic_resources),
              ]
            : []),

          // Nonprofit Resources
          ...(content.nonprofit_resources.length > 0
            ? [
                new Paragraph({
                  text: 'Nonprofit Resources',
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 400, after: 200 },
                }),
                ...generateResourceParagraphs(content.nonprofit_resources),
              ]
            : []),

          // Cultural Activities
          ...(content.cultural_activities.length > 0
            ? [
                new Paragraph({
                  text: 'Cultural Activities',
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 400, after: 200 },
                }),
                ...generateCulturalParagraphs(content.cultural_activities),
              ]
            : []),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

function generateResourceParagraphs(resources: any[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  resources.forEach((resource, index) => {
    // Resource name
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: resource.name,
            bold: true,
            size: 24,
          }),
        ],
        spacing: { before: index === 0 ? 0 : 300, after: 100 },
      })
    );

    // URL
    if (resource.url) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: resource.url,
              color: '0563C1',
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }

    // Description
    if (resource.description) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun(resource.description)],
          spacing: { after: 100 },
        })
      );
    }

    // Meeting Focus
    if (resource.meeting_focus) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Meeting Focus: ',
              bold: true,
              italics: true,
            }),
            new TextRun({
              text: resource.meeting_focus,
              italics: true,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }
  });

  return paragraphs;
}

function generateCulturalParagraphs(activities: any[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  activities.forEach((activity, index) => {
    // Activity name
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: activity.name,
            bold: true,
            size: 24,
          }),
        ],
        spacing: { before: index === 0 ? 0 : 300, after: 100 },
      })
    );

    // URL
    if (activity.url) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: activity.url,
              color: '0563C1',
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }

    // Price
    if (activity.price) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Price: ', bold: true }),
            new TextRun(activity.price),
          ],
          spacing: { after: 100 },
        })
      );
    }

    // Description
    if (activity.description) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun(activity.description)],
          spacing: { after: 100 },
        })
      );
    }

    // Accessibility
    if (activity.accessibility) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Accessibility: ', bold: true }),
            new TextRun(activity.accessibility),
          ],
          spacing: { after: 200 },
        })
      );
    }
  });

  return paragraphs;
}
