import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Session } from '../../models';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatListModule
  ],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {
  sessionId = '';
  session: Session | null = null;
  loading = false;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
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
      },
      error: (err) => {
        console.error('Error fetching session for report:', err);
        this.loading = false;
      }
    });
  }

  getRecommendationClass(rec: string): string {
    if (rec === 'Proceed') return 'badge-success';
    if (rec === 'Conditional Progression') return 'badge-warning';
    return 'badge-danger';
  }

  getClassificationClass(cls: string): string {
    if (cls === 'Completely Correct') return 'badge-success';
    if (cls === 'Partially Correct') return 'badge-warning';
    return 'badge-danger';
  }

  translateClassification(cls: string): string {
    const map: Record<string, string> = {
      'Completely Correct': 'Totalmente Correto',
      'Partially Correct': 'Parcialmente Correto',
      'Completely Incorrect': 'Totalmente Incorreto'
    };
    return map[cls] || cls;
  }

  translateRecommendation(rec: string): string {
    const map: Record<string, string> = {
      'Proceed': 'Avançar para Próximo Tópico',
      'Conditional Progression': 'Progressão Condicional',
      'Rework': 'Revisar Conteúdo (Rework)'
    };
    return map[rec] || rec;
  }

  translateConfidence(conf: string): string {
    const map: Record<string, string> = {
      'high': 'Alta',
      'medium': 'Média',
      'low': 'Baixa'
    };
    return map[conf] || conf;
  }
}
