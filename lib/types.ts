// =============================================
// USER & AUTH TYPES
// =============================================

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================
// PROJECT TYPES
// =============================================

export type ProjectStatus = 'draft' | 'in_review' | 'approved';

export interface Project {
  id: string;
  name: string;
  project_number: string | null;
  status: ProjectStatus;

  // Metadata from Project Data
  project_title: string | null;
  project_type: string | null;
  start_date: string | null;
  end_date: string | null;
  estimated_participants: number | null;
  sponsoring_agency: string | null;
  subject: string | null;
  project_description: string | null;
  project_objectives: string[] | null;

  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectInput {
  name: string;
  project_number?: string;
}

export interface UpdateProjectInput {
  name?: string;
  project_number?: string;
  status?: ProjectStatus;
  project_title?: string;
  project_type?: string;
  start_date?: string;
  end_date?: string;
  estimated_participants?: number;
  sponsoring_agency?: string;
  subject?: string;
  project_description?: string;
  project_objectives?: string[];
}

// =============================================
// DOCUMENT TYPES
// =============================================

export type DocumentType = 'project_data' | 'bios_objectives';

export interface Document {
  id: string;
  project_id: string;
  type: DocumentType;
  file_name: string;
  file_url: string;
  file_size: number;
  extracted_content: string | null;
  extracted_metadata: Record<string, any> | null;
  uploaded_by: string;
  uploaded_at: string;
}

export interface UploadDocumentInput {
  project_id: string;
  type: DocumentType;
  file: File;
}

// =============================================
// PROPOSAL TYPES
// =============================================

export type ProposalStatus = 'draft' | 'review' | 'approved';

export interface ResourceItem {
  id?: string;
  name: string;
  url: string;
  description: string;
  meeting_focus: string;
  selected?: boolean;
}

export interface CulturalActivity {
  id?: string;
  name: string;
  url: string;
  price: string;
  description: string;
  accessibility: string;
  selected?: boolean;
}

export interface ProposalContent {
  why_san_diego: string;
  governmental_resources: ResourceItem[];
  academic_resources: ResourceItem[];
  nonprofit_resources: ResourceItem[];
  cultural_activities: CulturalActivity[];
}

export interface Proposal {
  id: string;
  project_id: string;
  version: number;
  status: ProposalStatus;
  content: ProposalContent;
  pdf_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GenerateProposalInput {
  project_id: string;
}

export interface UpdateProposalInput {
  status?: ProposalStatus;
  content?: ProposalContent;
}

// =============================================
// PROPOSAL HISTORY TYPES
// =============================================

export interface ProposalHistory {
  id: string;
  proposal_id: string;
  version: number;
  content: ProposalContent;
  change_summary: string | null;
  edited_by: string;
  edited_at: string;
}

// =============================================
// COMMENT TYPES
// =============================================

export interface ProposalComment {
  id: string;
  proposal_id: string;
  section: string | null;
  content: string;
  resolved: boolean;
  created_by: string;
  created_at: string;
  author?: Profile;
}

export interface CreateCommentInput {
  proposal_id: string;
  section?: string;
  content: string;
}

// =============================================
// CONVERSATION TYPES
// =============================================

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  project_id: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export interface SendMessageInput {
  project_id: string;
  message: string;
}

// =============================================
// RESOURCE TYPES
// =============================================

export type ResourceCategory = 'governmental' | 'academic' | 'nonprofit' | 'cultural';

export interface Resource {
  id: string;
  category: ResourceCategory;
  name: string;
  description: string | null;
  url: string | null;
  meeting_focus: string | null;
  price: string | null;
  accessibility: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateResourceInput {
  category: ResourceCategory;
  name: string;
  description?: string;
  url?: string;
  meeting_focus?: string;
  price?: string;
  accessibility?: string;
}

export interface UpdateResourceInput {
  category?: ResourceCategory;
  name?: string;
  description?: string;
  url?: string;
  meeting_focus?: string;
  price?: string;
  accessibility?: string;
  is_active?: boolean;
}

// =============================================
// API RESPONSE TYPES
// =============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// =============================================
// CLAUDE AI TYPES
// =============================================

export interface ProjectContext {
  project: Project | any;
  documents: Document[] | any[];
  proposal?: Proposal | any;
  resources?: Resource[];
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}
