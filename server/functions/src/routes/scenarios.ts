import express, { Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { premiumOnlyMiddleware } from '../middleware/premiumOnly';
import { validate } from '../middleware/validation';
import { scenarioService } from '../services/scenarioService';
import { SCENARIO_VALIDATION_RULES } from '../types/scenario';

const router = express.Router();

// Apply authentication and premium middleware to all routes
router.use(authMiddleware);
router.use(premiumOnlyMiddleware);

// Validation schemas
const createScenarioValidation = [
  body('title')
    .isLength({ min: SCENARIO_VALIDATION_RULES.title.minLength, max: SCENARIO_VALIDATION_RULES.title.maxLength })
    .withMessage(`Title must be between ${SCENARIO_VALIDATION_RULES.title.minLength} and ${SCENARIO_VALIDATION_RULES.title.maxLength} characters`),
  body('baseCalculationId')
    .isUUID()
    .withMessage('Base calculation ID must be a valid UUID'),
  body('scenarios')
    .isArray({ min: SCENARIO_VALIDATION_RULES.scenarios.min, max: SCENARIO_VALIDATION_RULES.scenarios.max })
    .withMessage(`Must have between ${SCENARIO_VALIDATION_RULES.scenarios.min} and ${SCENARIO_VALIDATION_RULES.scenarios.max} scenarios`),
  validate
];

// POST /api/scenarios/rate-change - Generate rate change scenarios
router.post('/rate-change', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenarios = scenarioService.generateRateChangeScenarios();
    res.json({
      success: true,
      data: scenarios
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/scenarios/stress-test - Generate stress test scenarios
router.post('/stress-test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenarios = scenarioService.generateStressTestScenarios();
    res.json({
      success: true,
      data: scenarios
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/scenarios/what-if - Calculate what-if scenario
router.post('/what-if', createScenarioValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, baseCalculationId, scenarios } = req.body;
    const userId = req.user!.uid;
    
    const results = await scenarioService.calculateScenarios({ title, baseCalculationId, scenarios }, userId);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/scenarios/save - Save scenario analysis
router.post('/save', createScenarioValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, baseCalculationId, scenarios } = req.body;
    const userId = req.user!.uid;
    
    const analysis = await scenarioService.createScenarioAnalysis({ title, baseCalculationId, scenarios }, userId);
    
    res.status(201).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/scenarios/:id - Get scenario analysis
router.get('/:id', [param('id').isUUID(), validate], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.uid;
    
    const analysis = await scenarioService.getScenarioAnalysis(id, userId);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/scenarios - List user's scenario analyses
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.uid;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await scenarioService.getUserScenarios(userId, page, limit);
    
    res.json({
      success: true,
      data: {
        scenarios: result.scenarios,
        pagination: {
          page,
          limit,
          total: result.total,
          hasMore: result.hasMore
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/scenarios/:id - Delete scenario analysis
router.delete('/:id', [param('id').isUUID(), validate], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.uid;
    
    await scenarioService.deleteScenarioAnalysis(id, userId);
    
    res.json({
      success: true,
      message: 'Scenario analysis deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;