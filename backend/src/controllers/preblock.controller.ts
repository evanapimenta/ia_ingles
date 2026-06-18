import { Request, Response } from 'express';
import { PreBlockService } from '../services/preblock.service';

export class PreBlockController {
  private preBlockService: PreBlockService;

  constructor(preBlockService: PreBlockService) {
    this.preBlockService = preBlockService;
  }

  listPreBlocks = async (req: Request, res: Response): Promise<void> => {
    try {
      const list = await this.preBlockService.listPreBlocks();
      res.json(list);
    } catch (error) {
      console.error('Error listing preblocks:', error);
      res.status(500).json({ error: 'Failed to list pre-blocks' });
    }
  };

  getPreBlock = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const block = await this.preBlockService.getPreBlock(id);
      if (!block) {
        res.status(404).json({ error: `Pre-block ${id} not found` });
        return;
      }
      res.json(block);
    } catch (error) {
      console.error(`Error getting preblock ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to retrieve pre-block' });
    }
  };
}
