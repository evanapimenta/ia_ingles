import * as fs from 'fs';
import * as path from 'path';
import { PreBlockModel } from '../types';

export class PreBlockService {
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

  private getPreblocksPath(): string {
    return path.join(this.dataDir, 'preblocks');
  }

  async listPreBlocks(): Promise<PreBlockModel[]> {
    const preblocksPath = this.getPreblocksPath();
    if (!fs.existsSync(preblocksPath)) {
      return [];
    }

    const files = fs.readdirSync(preblocksPath);
    const preblocks: PreBlockModel[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const content = fs.readFileSync(path.join(preblocksPath, file), 'utf-8');
          preblocks.push(JSON.parse(content));
        } catch (error) {
          console.error(`Error reading preblock file ${file}:`, error);
        }
      }
    }

    return preblocks;
  }

  async getPreBlock(id: string): Promise<PreBlockModel | null> {
    const preblocksPath = this.getPreblocksPath();
    const filePath = path.join(preblocksPath, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as PreBlockModel;
    } catch (error) {
      console.error(`Error loading preblock ${id}:`, error);
      return null;
    }
  }
}
