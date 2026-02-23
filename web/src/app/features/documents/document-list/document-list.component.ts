import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { FileUploadModule } from 'primeng/fileupload';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DocumentService } from '../../../core/services';
import { Folder, Document } from '../../../core/models';

@Component({
  selector: 'app-document-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    ToastModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    FileUploadModule,
    ConfirmDialogModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.css'
})
export class DocumentListComponent implements OnInit {
  private readonly documentService = inject(DocumentService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly folders = signal<Folder[]>([]);
  readonly documents = signal<Document[]>([]);
  readonly loading = signal(false);
  readonly selectedFolder = signal<Folder | null>(null);
  readonly showAllDocuments = signal(true);

  // Folder dialog
  readonly folderDialogVisible = signal(false);
  readonly folderDialogMode = signal<'create' | 'edit'>('create');
  readonly folderForm = signal({ name: '', description: '' });
  readonly editingFolderId = signal<number | null>(null);

  // Upload dialog
  readonly uploadDialogVisible = signal(false);
  readonly uploading = signal(false);

  ngOnInit(): void {
    this.loadFolders();
    this.loadDocuments();
  }

  loadFolders(): void {
    this.documentService.getFolders().subscribe({
      next: (folders) => this.folders.set(folders),
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar pastas'
        });
      }
    });
  }

  loadDocuments(): void {
    this.loading.set(true);
    const folderId = this.showAllDocuments() ? undefined : this.selectedFolder()?.id;

    this.documentService.getDocuments(folderId).subscribe({
      next: (docs) => {
        this.documents.set(docs);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar documentos'
        });
        this.loading.set(false);
      }
    });
  }

  selectAllDocuments(): void {
    this.selectedFolder.set(null);
    this.showAllDocuments.set(true);
    this.loadDocuments();
  }

  selectFolder(folder: Folder): void {
    this.selectedFolder.set(folder);
    this.showAllDocuments.set(false);
    this.loadDocuments();
  }

  // Folder CRUD

  openCreateFolderDialog(): void {
    this.folderDialogMode.set('create');
    this.folderForm.set({ name: '', description: '' });
    this.editingFolderId.set(null);
    this.folderDialogVisible.set(true);
  }

  openEditFolderDialog(folder: Folder, event: Event): void {
    event.stopPropagation();
    this.folderDialogMode.set('edit');
    this.folderForm.set({ name: folder.name, description: folder.description });
    this.editingFolderId.set(folder.id);
    this.folderDialogVisible.set(true);
  }

  saveFolder(): void {
    const form = this.folderForm();
    if (!form.name.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Nome da pasta é obrigatório'
      });
      return;
    }

    if (this.folderDialogMode() === 'create') {
      this.documentService.createFolder(form).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Pasta criada com sucesso'
          });
          this.folderDialogVisible.set(false);
          this.loadFolders();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao criar pasta'
          });
        }
      });
    } else {
      const id = this.editingFolderId();
      if (id === null) return;

      this.documentService.updateFolder(id, form).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Pasta atualizada com sucesso'
          });
          this.folderDialogVisible.set(false);
          this.loadFolders();
          if (this.selectedFolder()?.id === id) {
            this.selectedFolder.set({ ...this.selectedFolder()!, ...form });
          }
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao atualizar pasta'
          });
        }
      });
    }
  }

  confirmDeleteFolder(folder: Folder, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      message: `Deseja excluir a pasta "${folder.name}"? Os documentos dentro dela não serão excluídos.`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.documentService.deleteFolder(folder.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: 'Pasta excluída com sucesso'
            });
            if (this.selectedFolder()?.id === folder.id) {
              this.selectAllDocuments();
            }
            this.loadFolders();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: 'Erro ao excluir pasta'
            });
          }
        });
      }
    });
  }

  // Upload

  openUploadDialog(): void {
    this.uploadDialogVisible.set(true);
  }

  onFileSelect(event: { files: File[] }): void {
    const files = event.files;
    if (!files || files.length === 0) return;

    this.uploading.set(true);
    const folderId = this.showAllDocuments() ? undefined : this.selectedFolder()?.id;

    let completed = 0;
    let hasError = false;

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: `Arquivo "${file.name}" excede o limite de 10MB`
        });
        completed++;
        hasError = true;
        if (completed === files.length) {
          this.uploading.set(false);
          this.loadDocuments();
        }
        continue;
      }

      this.documentService.uploadDocument(file, folderId).subscribe({
        next: () => {
          completed++;
          if (completed === files.length) {
            this.uploading.set(false);
            this.uploadDialogVisible.set(false);
            if (!hasError) {
              this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: files.length === 1 ? 'Arquivo enviado com sucesso' : `${files.length} arquivos enviados com sucesso`
              });
            }
            this.loadDocuments();
          }
        },
        error: () => {
          completed++;
          hasError = true;
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: `Erro ao enviar "${file.name}"`
          });
          if (completed === files.length) {
            this.uploading.set(false);
            this.loadDocuments();
          }
        }
      });
    }
  }

  // Document actions

  downloadDocument(doc: Document, event: Event): void {
    event.stopPropagation();
    this.documentService.getDownloadUrl(doc.id).subscribe({
      next: (url) => {
        window.open(url, '_blank');
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao gerar link de download'
        });
      }
    });
  }

  confirmDeleteDocument(doc: Document, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      message: `Deseja excluir o documento "${doc.original_name}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.documentService.deleteDocument(doc.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: 'Documento excluído com sucesso'
            });
            this.loadDocuments();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: 'Erro ao excluir documento'
            });
          }
        });
      }
    });
  }

  // Helpers

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getFileIcon(contentType: string): string {
    if (contentType.startsWith('image/')) return 'pi pi-image';
    if (contentType === 'application/pdf') return 'pi pi-file-pdf';
    if (contentType.includes('spreadsheet') || contentType.includes('excel')) return 'pi pi-file-excel';
    if (contentType.includes('word') || contentType.includes('document')) return 'pi pi-file-word';
    return 'pi pi-file';
  }
}
