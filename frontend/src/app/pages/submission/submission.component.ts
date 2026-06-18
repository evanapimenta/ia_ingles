import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { PreBlockModel, DemoCase } from '../../models';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-submission',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './submission.component.html',
  styleUrls: ['./submission.component.css']
})
export class SubmissionComponent implements OnInit {
  preBlocks: PreBlockModel[] = [];
  selectedPreBlockId = 'english-past-verbs';
  artifact = '';
  narrative = '';
  
  loadingPreBlocks = false;
  analyzing = false;
  statusMessage = '';
  
  demoCaseLoaded = false;
  demoCaseTitle = '';
  loadedDemoCase: DemoCase | null = null;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.fetchPreBlocks();
  }

  fetchPreBlocks(): void {
    this.loadingPreBlocks = true;
    this.apiService.getPreBlocks().subscribe({
      next: (blocks) => {
        this.preBlocks = blocks;
        this.loadingPreBlocks = false;
        this.checkQueryParams();
      },
      error: (err) => {
        console.error('Error fetching preblocks:', err);
        this.loadingPreBlocks = false;
      }
    });
  }

  checkQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      const demoCaseId = params['demoCaseId'];
      if (demoCaseId) {
        this.apiService.getDemoCases().subscribe(cases => {
          const match = cases.find(c => c.caseId === demoCaseId);
          if (match) {
            this.loadedDemoCase = match;
            this.selectedPreBlockId = match.blockId;
            this.artifact = match.artifact;
            this.narrative = match.narrative;
            this.demoCaseLoaded = true;
            this.demoCaseTitle = match.title;
          }
        });
      }
    });
  }

  clearForm(): void {
    this.artifact = '';
    this.narrative = '';
    this.demoCaseLoaded = false;
    this.demoCaseTitle = '';
    this.loadedDemoCase = null;
    this.router.navigate(['/submit']);
  }

  analyzeSubmission(): void {
    if (!this.selectedPreBlockId || !this.artifact.trim() || !this.narrative.trim()) {
      return;
    }

    this.analyzing = true;
    this.statusMessage = 'Inicializando sessão de avaliação formativa...';

    // Step 1: Create session
    this.apiService.createSession(this.selectedPreBlockId).subscribe({
      next: (session) => {
        this.statusMessage = 'Sessão criada. Enviando artefato para análise do LLM...';
        
        // Step 2: Submit sentences & explanation narrative
        this.apiService.submitSubmission(session.sessionId, this.artifact, this.narrative).subscribe({
          next: (updatedSession) => {
            this.statusMessage = 'Análise concluída com sucesso! Redirecionando...';
            setTimeout(() => {
              if (updatedSession.status === 'awaiting_vfu') {
                // Route to VFU screen, pass the suggested answer history for the demo case
                this.router.navigate([`/vfu/${updatedSession.sessionId}`], {
                  state: { 
                    suggestedAnswers: this.loadedDemoCase?.suggestedAnswers || [] 
                  }
                });
              } else {
                // Route to final report screen
                this.router.navigate([`/report/${updatedSession.sessionId}`]);
              }
            }, 800);
          },
          error: (submitErr) => {
            console.error('Error submitting assessment:', submitErr);
            this.statusMessage = 'Erro ao processar submissão com o LLM.';
            this.analyzing = false;
          }
        });
      },
      error: (sessionErr) => {
        console.error('Error creating session:', sessionErr);
        this.statusMessage = 'Erro ao criar sessão no servidor.';
        this.analyzing = false;
      }
    });
  }
}
