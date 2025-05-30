import express, { Request, Response, NextFunction } from 'express';
import { body, param, query } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { premiumOnlyMiddleware } from '../middleware/premiumOnly';
import { validate } from '../middleware/validation';
import { comparisonService } from '../services/comparisonService';
import { logger } from '../utils/logger';
import { COMPARISON_VALIDATION_RULES } from '../types/comparison';

const router = express.Router();

// Apply authentication and premium middleware to all routes
router.use(authMiddleware);
router.use(premiumOnlyMiddleware);

// Validation schemas
const createComparisonValidation = [
  body('title')
    .isLength({ min: COMPARISON_VALIDATION_RULES.title.minLength, max: COMPARISON_VALIDATION_RULES.title.maxLength })
    .withMessage(`Title must be between ${COMPARISON_VALIDATION_RULES.title.minLength} and ${COMPARISON_VALIDATION_RULES.title.maxLength} characters`),
  body('loans')
    .isArray({ min: COMPARISON_VALIDATION_RULES.loans.min, max: COMPARISON_VALIDATION_RULES.loans.max })
    .withMessage(`Must compare between ${COMPARISON_VALIDATION_RULES.loans.min} and ${COMPARISON_VALIDATION_RULES.loans.max} loans`),
  body('loans.*.title')
    .notEmpty()
    .withMessage('Each loan must have a title'),
  body('loans.*.loanAmount')
    .isFloat({ min: COMPARISON_VALIDATION_RULES.loanAmount.min, max: COMPARISON_VALIDATION_RULES.loanAmount.max })
    .withMessage(`Loan amount must be between $${COMPARISON_VALIDATION_RULES.loanAmount.min.toLocaleString()} and $${COMPARISON_VALIDATION_RULES.loanAmount.max.toLocaleString()}`),
  body('loans.*.interestRate')
    .isFloat({ min: COMPARISON_VALIDATION_RULES.interestRate.min, max: COMPARISON_VALIDATION_RULES.interestRate.max })
    .withMessage(`Interest rate must be between ${COMPARISON_VALIDATION_RULES.interestRate.min}% and ${COMPARISON_VALIDATION_RULES.interestRate.max}%`),
  body('loans.*.loanTerm')
    .isInt({ min: COMPARISON_VALIDATION_RULES.loanTerm.min, max: COMPARISON_VALIDATION_RULES.loanTerm.max })
    .withMessage(`Loan term must be between ${COMPARISON_VALIDATION_RULES.loanTerm.min} and ${COMPARISON_VALIDATION_RULES.loanTerm.max} years`),
  body('loans.*.downPayment')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Down payment must be a positive number'),
  body('loans.*.extraPayments')
    .optional()
    .isArray()
    .withMessage('Extra payments must be an array'),
  validate
];

const updateComparisonValidation = [
  param('id').isUUID().withMessage('Invalid comparison ID'),
  body('title')
    .optional()
    .isLength({ min: COMPARISON_VALIDATION_RULES.title.minLength, max: COMPARISON_VALIDATION_RULES.title.maxLength })
    .withMessage(`Title must be between ${COMPARISON_VALIDATION_RULES.title.minLength} and ${COMPARISON_VALIDATION_RULES.title.maxLength} characters`),
  body('loans')
    .optional()
    .isArray({ min: COMPARISON_VALIDATION_RULES.loans.min, max: COMPARISON_VALIDATION_RULES.loans.max })
    .withMessage(`Must compare between ${COMPARISON_VALIDATION_RULES.loans.min} and ${COMPARISON_VALIDATION_RULES.loans.max} loans`),
  validate
];

const getComparisonValidation = [
  param('id').isUUID().withMessage('Invalid comparison ID'),
  validate
];

const listComparisonsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  validate
];

// POST /api/comparisons/calculate - Calculate loan comparison (without saving)
router.post('/calculate', createComparisonValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, loans } = req.body;
    const userId = req.user!.uid;
    
    logger.info(`Calculating comparison for user: ${userId}`);
    
    const results = await comparisonService.calculateComparison({ title, loans }, userId);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/comparisons/save - Save loan comparison
router.post('/save', createComparisonValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, loans } = req.body;
    const userId = req.user!.uid;
    
    logger.info(`Creating comparison for user: ${userId}`);
    
    const comparison = await comparisonService.createComparison({ title, loans }, userId);
    
    res.status(201).json({
      success: true,
      data: comparison
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/comparisons/:id - Get specific comparison
router.get('/:id', getComparisonValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.uid;
    
    const comparison = await comparisonService.getComparison(id, userId);
    
    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/comparisons/:id - Update comparison
router.put('/:id', updateComparisonValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user!.uid;
    
    logger.info(`Updating comparison: ${id} for user: ${userId}`);
    
    const comparison = await comparisonService.updateComparison(id, updateData, userId);
    
    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/comparisons/:id - Delete comparison
router.delete('/:id', getComparisonValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.uid;
    
    logger.info(`Deleting comparison: ${id} for user: ${userId}`);
    
    await comparisonService.deleteComparison(id, userId);
    
    res.json({
      success: true,
      message: 'Comparison deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/comparisons - List user's comparisons
router.get('/', listComparisonsValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.uid;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await comparisonService.getUserComparisons(userId, page, limit);
    
    res.json({
      success: true,
      data: {
        comparisons: result.comparisons,
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

export default router;