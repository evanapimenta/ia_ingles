import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { DemoCase } from '../types';

export class DemoController {
  private dataDir: string;

  constructor() {
    this.dataDir = path.resolve(__dirname, '../../../data');
    if (!fs.existsSync(this.dataDir)) {
      this.dataDir = path.resolve(process.cwd(), '../data');
    }
    if (!fs.existsSync(this.dataDir)) {
      this.dataDir = path.resolve(process.cwd(), 'data');
    }
  }

  private getDemoCasesPath(): string {
    return path.join(this.dataDir, 'demo-cases');
  }

  listDemoCases = async (req: Request, res: Response): Promise<void> => {
    try {
      const demoPath = this.getDemoCasesPath();
      if (!fs.existsSync(demoPath)) {
        res.json([]);
        return;
      }

      const files = fs.readdirSync(demoPath);
      const cases: DemoCase[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const content = fs.readFileSync(path.join(demoPath, file), 'utf-8');
            cases.push(JSON.parse(content));
          } catch (e) {
            console.error(`Error reading demo case ${file}:`, e);
          }
        }
      }

      cases.sort((a, b) => a.caseId.localeCompare(b.caseId));
      res.json(cases);
    } catch (error) {
      console.error('Error in listDemoCases:', error);
      res.status(500).json({ error: 'Failed to list demo cases' });
    }
  };

  initializeDemoCases = async (req: Request, res: Response): Promise<void> => {
    try {
      const demoPath = this.getDemoCasesPath();
      const filesExist = fs.existsSync(demoPath) && fs.readdirSync(demoPath).length > 0;
      
      res.json({
        success: true,
        message: filesExist 
          ? 'Casos de demonstração carregados com sucesso a partir do diretório de dados.' 
          : 'Diretório de casos demonstrativos vazio ou ausente. Por favor, verifique se os arquivos JSON existem no workspace.'
      });
    } catch (error) {
      console.error('Error in initializeDemoCases:', error);
      res.status(500).json({ error: 'Failed to initialize demo cases' });
    }
  };
}
