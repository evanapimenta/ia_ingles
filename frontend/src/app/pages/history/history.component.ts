import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Session, PreBlockModel } from '../../models';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-history',
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
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
  sessions: Session[] = [];
  filteredSessions: Session[] = [];
  preBlocks: PreBlockModel[] = [];
  preBlockMap: Map<string, string> = new Map();

  loading = false;
  searchQuery = '';

  // Stats
  totalSessions = 0;
  proceedCount = 0;
  conditionalCount = 0;
  reworkCount = 0;

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.loading = true;
    
    // Fetch preblocks first, then sessions
    this.apiService.getPreBlocks().subscribe({
      next: (blocks) => {
        this.preBlocks = blocks;
        this.preBlockMap.clear();
        blocks.forEach(b => this.preBlockMap.set(b.blockId, b.blockName));
        
        this.fetchSessions();
      },
      error: (err) => {
        console.error('Error fetching preblocks for history:', err);
        this.fetchSessions(); // Try fetching sessions anyway
      }
    });
  }

  fetchSessions(): void {
    this.apiService.getSessions().subscribe({
      next: (sessionsList) => {
        // Only keep completed sessions
        this.sessions = sessionsList.filter(s => s.status === 'completed');
        this.calculateStats();
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching sessions:', err);
        this.loading = false;
      }
    });
  }

  calculateStats(): void {
    this.totalSessions = this.sessions.length;
    this.proceedCount = this.sessions.filter(s => s.teacherReport?.recommendation === 'Proceed').length;
    this.conditionalCount = this.sessions.filter(s => s.teacherReport?.recommendation === 'Conditional Progression').length;
    this.reworkCount = this.sessions.filter(s => s.teacherReport?.recommendation === 'Rework').length;
  }

  applyFilters(): void {
    this.filteredSessions = this.sessions.filter(session => {
      // Search Query (matching sessionId, block name, or artifact snippet)
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase().trim();
        const blockName = this.getPreBlockName(session.preBlockId).toLowerCase();
        const artifact = (session.submission?.artifact || '').toLowerCase();
        const narrative = (session.submission?.narrative || '').toLowerCase();
        const sessionId = session.sessionId.toLowerCase();

        return (
          sessionId.includes(query) ||
          blockName.includes(query) ||
          artifact.includes(query) ||
          narrative.includes(query)
        );
      }

      return true;
    });
  }

  getPreBlockName(id: string): string {
    return this.preBlockMap.get(id) || id;
  }

  getClassificationLabel(classification: string | undefined): string {
    if (!classification) return '';
    switch (classification) {
      case 'Completely Correct': return 'Totalmente Correto';
      case 'Partially Correct': return 'Parcialmente Correto';
      case 'Completely Incorrect': return 'Totalmente Incorreto';
      default: return classification;
    }
  }

  getRecommendationLabel(recommendation: string | undefined): string {
    if (!recommendation) return '';
    switch (recommendation) {
      case 'Proceed': return 'Avançar';
      case 'Conditional Progression': return 'Progressão Condicional';
      case 'Rework': return 'Refazer';
      default: return recommendation;
    }
  }

  viewSession(session: Session): void {
    this.router.navigate([`/report/${session.sessionId}`]);
  }

  startNewSession(): void {
    this.router.navigate(['/submit']);
  }
}
