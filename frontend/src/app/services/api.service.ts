import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PreBlockModel, Session, DemoCase } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getPreBlocks(): Observable<PreBlockModel[]> {
    return this.http.get<PreBlockModel[]>(`${this.baseUrl}/preblocks`);
  }

  getPreBlock(id: string): Observable<PreBlockModel> {
    return this.http.get<PreBlockModel>(`${this.baseUrl}/preblocks/${id}`);
  }

  createSession(preBlockId: string): Observable<Session> {
    return this.http.post<Session>(`${this.baseUrl}/sessions`, { preBlockId });
  }

  getSessions(): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.baseUrl}/sessions`);
  }

  getSession(id: string): Observable<Session> {
    return this.http.get<Session>(`${this.baseUrl}/sessions/${id}`);
  }

  submitSubmission(id: string, artifact: string, narrative: string): Observable<Session> {
    return this.http.post<Session>(`${this.baseUrl}/sessions/${id}/submit`, { artifact, narrative });
  }

  submitVFUAnswer(id: string, answer: string): Observable<Session> {
    return this.http.post<Session>(`${this.baseUrl}/sessions/${id}/vfu`, { answer });
  }

  getSuggestedAnswer(id: string): Observable<{ suggestedAnswer: string }> {
    return this.http.get<{ suggestedAnswer: string }>(`${this.baseUrl}/sessions/${id}/suggested-answer`);
  }

  getDemoCases(): Observable<DemoCase[]> {
    return this.http.get<DemoCase[]>(`${this.baseUrl}/demo-cases`);
  }

  initializeDemoCases(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/demo-cases/initialize`, {});
  }

  getConfig(): Observable<{ demoMode: boolean }> {
    return this.http.get<{ demoMode: boolean }>(`${this.baseUrl}/config`);
  }
}
