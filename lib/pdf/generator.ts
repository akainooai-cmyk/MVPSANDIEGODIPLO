import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ProposalContent } from '@/lib/types';

/**
 * Load logo image as base64
 */
async function loadLogoImage(): Promise<string> {
  try {
    const response = await fetch('/logo-sddc.jpg');
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load logo:', error);
    return '';
  }
}

/**
 * Generate a professional PDF proposal with San Diego Diplomacy Council branding
 */
export async function generateProposalPDFAsync(
  proposalContent: ProposalContent,
  projectData: any
): Promise<jsPDF> {
  const doc = new jsPDF();

  // Colors
  const primaryBlue = '#1e40af'; // San Diego blue
  const lightGray = '#f3f4f6';
  const darkGray = '#374151';

  let yPosition = 10;

  // Load and add logo (full width, centered)
  const logoBase64 = await loadLogoImage();
  if (logoBase64) {
    try {
      // Wider logo: 80mm width, centered
      // x position = (210 - 80) / 2 = 65mm
      doc.addImage(logoBase64, 'JPEG', 65, 10, 80, 25);
      yPosition = 40;
    } catch (err) {
      console.error('Failed to add logo to PDF:', err);
      // Fallback: show text if logo fails
      doc.setFillColor(primaryBlue);
      doc.rect(0, 0, 210, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('San Diego Diplomacy Council', 105, 18, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('International Visitor Leadership Program', 105, 28, { align: 'center' });
      yPosition = 45;
    }
  } else {
    // No logo, use blue header with text
    doc.setFillColor(primaryBlue);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('San Diego Diplomacy Council', 105, 18, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('International Visitor Leadership Program', 105, 28, { align: 'center' });
    yPosition = 45;
  }

  // Project Information Section (Centered)
  doc.setTextColor(darkGray);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Project Information', 105, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const projectInfo = [
    ['Project Title:', projectData.project_title || projectData.name || 'N/A'],
    ['Project Type:', projectData.project_type || 'N/A'],
    ['NPA:', 'San Diego Diplomacy Council'],
    ['Project Dates:', projectData.start_date && projectData.end_date
      ? `${new Date(projectData.start_date).toLocaleDateString()} - ${new Date(projectData.end_date).toLocaleDateString()}`
      : 'N/A'],
    ['Estimated Participants:', projectData.estimated_participants?.toString() || 'N/A'],
    ['Point of Contact:', 'Lulu Bonning, Executive Director'],
    ['Phone:', '(619) 289-8642'],
    ['Email:', 'lulu@sandiegodiplomacy.org'],
  ];

  // Calculate table width and center position
  const tableWidth = 140; // Total width of the table
  const tableStartX = (210 - tableWidth) / 2; // Center horizontally

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: projectInfo,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 2,
      halign: 'left'
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55 },
      1: { cellWidth: 85 }
    },
    margin: { left: tableStartX },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Why San Diego Section
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFillColor(primaryBlue);
  doc.rect(15, yPosition - 5, 180, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Why San Diego?', 20, yPosition + 2);

  yPosition += 12;
  doc.setTextColor(darkGray);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const whySanDiegoLines = doc.splitTextToSize(proposalContent.why_san_diego, 170);
  doc.text(whySanDiegoLines, 20, yPosition);
  yPosition += whySanDiegoLines.length * 5 + 10;

  // Helper function to add resource section
  const addResourceSection = (
    title: string,
    resources: any[],
    includeMeetingFocus: boolean = true
  ) => {
    if (resources.length === 0) return;

    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Section header
    doc.setFillColor(primaryBlue);
    doc.rect(15, yPosition - 5, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, yPosition + 2);
    yPosition += 15;

    resources.forEach((resource, index) => {
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setTextColor(darkGray);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${resource.name}`, 20, yPosition);
      yPosition += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      if (resource.url) {
        doc.setTextColor(primaryBlue);
        doc.textWithLink(resource.url, 20, yPosition, { url: resource.url });
        yPosition += 5;
      }

      doc.setTextColor(darkGray);
      doc.setFont('helvetica', 'normal');

      if (resource.description) {
        const descLines = doc.splitTextToSize(resource.description, 170);
        doc.text(descLines, 20, yPosition);
        yPosition += descLines.length * 4 + 3;
      }

      if (includeMeetingFocus && resource.meeting_focus) {
        doc.setFont('helvetica', 'bolditalic');
        doc.text('Meeting Focus: ', 20, yPosition);
        doc.setFont('helvetica', 'italic');
        const focusLines = doc.splitTextToSize(resource.meeting_focus, 150);
        doc.text(focusLines, 50, yPosition);
        yPosition += focusLines.length * 4 + 3;
      }

      if (resource.price) {
        doc.setFont('helvetica', 'bold');
        doc.text(`Price: ${resource.price}`, 20, yPosition);
        yPosition += 5;
      }

      if (resource.accessibility) {
        doc.setFont('helvetica', 'bold');
        doc.text('Accessibility: ', 20, yPosition);
        doc.setFont('helvetica', 'normal');
        const accessLines = doc.splitTextToSize(resource.accessibility, 145);
        doc.text(accessLines, 50, yPosition);
        yPosition += accessLines.length * 4;
      }

      yPosition += 5;
    });
  };

  // Filter function to exclude deleted resources
  const filterApprovedResources = (resources: any[]) => {
    return resources.filter((resource) => resource.status !== 'deleted');
  };

  // Add all resource sections (filtered to exclude deleted resources)
  addResourceSection(
    'Governmental Resources',
    filterApprovedResources(proposalContent.governmental_resources)
  );
  addResourceSection(
    'Academic Resources',
    filterApprovedResources(proposalContent.academic_resources)
  );
  addResourceSection(
    'Nonprofit Resources',
    filterApprovedResources(proposalContent.nonprofit_resources)
  );
  addResourceSection(
    'Cultural Activities',
    filterApprovedResources(proposalContent.cultural_activities),
    false
  );

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(lightGray);
    doc.rect(0, 285, 210, 12, 'F');
    doc.setTextColor(darkGray);
    doc.setFontSize(8);
    doc.text(
      `San Diego Diplomacy Council | Page ${i} of ${pageCount}`,
      105,
      291,
      { align: 'center' }
    );
  }

  return doc;
}

/**
 * Generate PDF and return as Blob
 */
export async function generateProposalPDFBlob(
  proposalContent: ProposalContent,
  projectData: any
): Promise<Blob> {
  const doc = await generateProposalPDFAsync(proposalContent, projectData);
  return doc.output('blob');
}

/**
 * Download PDF directly
 */
export async function downloadProposalPDF(
  proposalContent: ProposalContent,
  projectData: any,
  filename: string = 'proposal.pdf'
): Promise<void> {
  const doc = await generateProposalPDFAsync(proposalContent, projectData);
  doc.save(filename);
}
