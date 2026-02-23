export interface Folder {
  id: number;
  tenant_id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: number;
  tenant_id: number;
  folder_id: number | null;
  name: string;
  original_name: string;
  content_type: string;
  size: number;
  s3_key: string;
  uploaded_by_id: number;
  uploaded_by?: { id: number; name: string; email: string };
  folder?: Folder;
  created_at: string;
  updated_at: string;
}

export interface CreateFolderDto {
  name: string;
  description?: string;
}

export interface UpdateFolderDto {
  name: string;
  description?: string;
}

export interface MoveDocumentDto {
  folder_id: number | null;
}
