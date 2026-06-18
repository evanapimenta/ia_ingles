import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Session } from '../../models';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-vfu',
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
    MatProgressSpinnerModule,
    MatProgressBarModule
  ],
  templateUrl: './vfu.component.html',
  styleUrls: ['./vfu.component.css']
})
export class VfuComponent implements OnInit {
  sessionId = '';
  session: Session | null = null;
  answer = '';
  
  loading = false;
  submitting = false;
  statusMessage = '';
  
  demoMode = false;
  suggestedAnswers: string[] = [];
  loadingSuggestion = false;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { suggestedAnswers?: string[] };
    if (state?.suggestedAnswers) {
      this.suggestedAnswers = state.suggestedAnswers;
    }
  }

  ngOnInit(): void {
    this.apiService.getConfig().subscribe({
      next: (config) => {
        this.demoMode = config.demoMode;
      }
    });

    this.route.params.subscribe(params => {
      this.sessionId = params['sessionId'];
      if (this.sessionId) {
        this.fetchSession();
      }
    });
  }

  fetchSession(): void {
    this.loading = true;
    this.apiService.getSession(this.sessionId).subscribe({
      next: (session) => {
        this.session = session;
        this.loading = false;
        
        if (this.suggestedAnswers.length === 0 && session.preBlockId === 'english-past-verbs') {
          this.loadDemoAnswersFromSession(session);
        }
      },
      error: (err) => {
        console.error('Error fetching session:', err);
        this.loading = false;
      }
    });
  }

  loadDemoAnswersFromSession(session: Session): void {
    this.apiService.getDemoCases().subscribe({
      next: (cases) => {
        const match = cases.find(c => c.artifact === session.submission.artifact);
        if (match) {
          this.suggestedAnswers = match.suggestedAnswers;
        }
      }
    });
  }

  hasSuggestedAnswer(): boolean {
    return this.session !== null && this.suggestedAnswers.length > 0;
  }

  fillSuggestedAnswer(): void {
    if (!this.session) return;
    
    this.loadingSuggestion = true;
    this.apiService.getSuggestedAnswer(this.sessionId).subscribe({
      next: (res) => {
        this.answer = res.suggestedAnswer;
        this.loadingSuggestion = false;
      },
      error: (err) => {
        console.error('Error getting suggested answer:', err);
        this.loadingSuggestion = false;
      }
    });
  }

  submitVFU(): void {
    if (!this.answer.trim()) return;

    this.submitting = true;
    this.statusMessage = 'Enviando resposta ao servidor...';

    this.apiService.submitVFUAnswer(this.sessionId, this.answer).subscribe({
      next: (updatedSession) => {
        this.session = updatedSession;
        this.answer = '';
        
        if (updatedSession.status === 'awaiting_vfu') {
          this.statusMessage = 'Reanálise concluída. Nova pergunta gerada!';
          setTimeout(() => {
            this.submitting = false;
          }, 800);
        } else {
          this.statusMessage = 'Reanálise finalizada. Gerando relatório pedagógico...';
          setTimeout(() => {
            this.router.navigate([`/report/${this.sessionId}`]);
          }, 1000);
        }
      },
      error: (err) => {
        console.error('Error submitting VFU answer:', err);
        this.statusMessage = 'Erro ao processar resposta da VFU.';
        this.submitting = false;
      }
    });
  }
}
