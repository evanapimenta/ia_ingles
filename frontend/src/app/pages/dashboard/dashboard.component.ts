import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { DemoCase } from '../../models';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  demoCases: DemoCase[] = [];
  selectedCase: DemoCase | null = null;
  activeTab: 'artifact' | 'narrative' | 'answers' = 'artifact';
  
  loading = false;
  initializing = false;
  initialized = false;
  message = '';

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.fetchDemoCases();
  }

  fetchDemoCases(): void {
    this.loading = true;
    this.apiService.getDemoCases().subscribe({
      next: (cases) => {
        this.demoCases = cases;
        if (cases.length > 0) {
          this.initialized = true;
          // Auto-select Case 1
          this.selectCase(cases[0]);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching demo cases:', err);
        this.loading = false;
      }
    });
  }

  loadDemoCases(): void {
    this.initializing = true;
    this.apiService.initializeDemoCases().subscribe({
      next: (res) => {
        this.message = res.message;
        this.initialized = true;
        this.fetchDemoCases();
        this.initializing = false;
      },
      error: (err) => {
        console.error('Error initializing demo cases:', err);
        this.initializing = false;
      }
    });
  }

  selectCase(demoCase: DemoCase): void {
    this.selectedCase = demoCase;
    this.activeTab = 'artifact';
  }

  setTab(tab: 'artifact' | 'narrative' | 'answers'): void {
    this.activeTab = tab;
  }

  startDemo(caseId: string): void {
    this.router.navigate(['/submit'], { queryParams: { demoCaseId: caseId } });
  }

  startNewCase(): void {
    this.router.navigate(['/submit']);
  }
}
