import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Health check passed' });
});

export const healthRouter = router;