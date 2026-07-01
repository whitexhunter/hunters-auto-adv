import { Router, Request, Response } from 'express';

const router = Router();

router.post('/campaign/:campaignId', async (req: Request, res: Response) => {
  const { campaignId } = req.params;
  const { event, data } = req.body;
  console.log(`[Webhook] Campaign ${campaignId} - ${event}:`, data);
  res.json({ received: true });
});

export default router;
