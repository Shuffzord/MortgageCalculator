import express, { Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { premiumOnlyMiddleware } from '../middleware/premiumOnly';
import { validate } from '../middleware/validation';
import { exportService } from '../services/exportService';
import { logger } from '../utils/logger';
import { EXPORT_VALIDATION_RULES } from '../types/export';

const router = express.Router();

// Apply authentication and premium middleware to all routes
router.use(authMiddleware);
router.use(premiumOnlyMiddleware);

// Validation schemas
const createExportValidation = [
  body('type')
    .isIn(EXPORT_VALIDATION_RULES.type)
    .withMessage(`Export type must be one of: ${EXPORT_VALIDATION_RULES.type.join(', ')}`),
  body('dataType')
    .isIn(EXPORT_VALIDATION_RULES.dataType)
    .withMessage(`Data type must be one of: ${EXPORT_VALIDATION_RULES.dataType.join(', ')}`),
  body('dataId')
    .isUUID()
    .withMessage('Data ID must be a valid UUID'),
  validate
];

// POST /api/exports/pdf - Generate PDF export
router.post('/pdf', createExportValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dataType, dataId, options } = req.body;
    const userId = req.user!.uid;
    
    logger.info(`Creating PDF export for user: ${userId}`);
    
    const exportRequest = await exportService.createExport({
      type: 'pdf',
      dataType,
      dataId,
      options
    }, userId);
    
    res.status(201).json({
      success: true,
      data: exportRequest
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/exports/excel - Generate Excel export
router.post('/excel', createExportValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dataType, dataId, options } = req.body;
    const userId = req.user!.uid;
    
    logger.info(`Creating Excel export for user: ${userId}`);
    
    const exportRequest = await exportService.createExport({
      type: 'excel',
      dataType,
      dataId,
      options
    }, userId);
    
    res.status(201).json({
      success: true,
      data: exportRequest
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/exports/csv - Generate CSV export
router.post('/csv', createExportValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dataType, dataId, options } = req.body;
    const userId = req.user!.uid;
    
    logger.info(`Creating CSV export for user: ${userId}`);
    
    const exportRequest = await exportService.createExport({
      type: 'csv',
      dataType,
      dataId,
      options
    }, userId);
    
    res.status(201).json({
      success: true,
      data: exportRequest
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/exports/history - Get export history
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.uid;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await exportService.getUserExports(userId, page, limit);
    
    res.json({
      success: true,
      data: {
        exports: result.exports,
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

// GET /api/exports/download/:id - Download export file
router.get('/download/:id', [param('id').isUUID(), validate], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.uid;
    
    const exportRequest = await exportService.getExport(id, userId);
    
    if (exportRequest.status !== 'completed') {
      res.status(400).json({
        success: false,
        error: 'Export is not ready for download'
      });
      return;
    }
    
    if (!exportRequest.downloadUrl) {
      res.status(404).json({
        success: false,
        error: 'Download URL not available'
      });
      return;
    }
    
    // Check if export has expired
    if (new Date() > exportRequest.expiresAt) {
      res.status(410).json({
        success: false,
        error: 'Export has expired'
      });
      return;
    }
    
    // In a real implementation, you would redirect to the cloud storage URL
    // or stream the file directly
    res.json({
      success: true,
      data: {
        downloadUrl: exportRequest.downloadUrl,
        fileName: exportRequest.fileName,
        fileSize: exportRequest.fileSize,
        expiresAt: exportRequest.expiresAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/exports/:id - Get export status
router.get('/:id', [param('id').isUUID(), validate], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.uid;
    
    const exportRequest = await exportService.getExport(id, userId);
    
    res.json({
      success: true,
      data: exportRequest
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/exports/:id - Delete export
router.delete('/:id', [param('id').isUUID(), validate], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.uid;
    
    await exportService.deleteExport(id, userId);
    
    res.json({
      success: true,
      message: 'Export deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;