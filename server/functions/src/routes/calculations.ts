import { Router, Request, Response, NextFunction } from 'express';
import { CalculationService } from '../services/calculationService';
import { authMiddleware } from '../middleware/auth';
import { checkCalculationLimitMiddleware, trackCalculationSave } from '../middleware/usageTracking';
import { AppError } from '../utils/errors';

const router = Router();

// Get user's calculations (paginated)
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // Max 50 per page

    if (page < 1 || limit < 1) {
      throw new AppError('Page and limit must be positive numbers', 400);
    }

    const result = await CalculationService.getUserCalculations(req.user.uid, page, limit);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Save new calculation
router.post('/save', 
  authMiddleware, 
  checkCalculationLimitMiddleware, 
  trackCalculationSave,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { title, loanAmount, interestRate, loanTerm, downPayment, extraPayments, isPublic } = req.body;

      if (!title || !loanAmount || !interestRate || !loanTerm) {
        throw new AppError('Missing required fields: title, loanAmount, interestRate, loanTerm', 400);
      }

      const calculationData = {
        title,
        loanAmount: parseFloat(loanAmount),
        interestRate: parseFloat(interestRate),
        loanTerm: parseInt(loanTerm),
        downPayment: downPayment ? parseFloat(downPayment) : undefined,
        extraPayments: extraPayments || [],
        isPublic: Boolean(isPublic)
      };

      const calculation = await CalculationService.createCalculation(req.user.uid, calculationData);
      
      res.status(201).json({
        success: true,
        data: calculation,
        message: 'Calculation saved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get specific calculation
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    
    if (!id) {
      throw new AppError('Calculation ID is required', 400);
    }

    const calculation = await CalculationService.getCalculation(id, req.user.uid);
    
    res.json({
      success: true,
      data: calculation
    });
  } catch (error) {
    next(error);
  }
});

// Update existing calculation
router.put('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    const { title, loanAmount, interestRate, loanTerm, downPayment, extraPayments, isPublic } = req.body;

    if (!id) {
      throw new AppError('Calculation ID is required', 400);
    }

    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (loanAmount !== undefined) updateData.loanAmount = parseFloat(loanAmount);
    if (interestRate !== undefined) updateData.interestRate = parseFloat(interestRate);
    if (loanTerm !== undefined) updateData.loanTerm = parseInt(loanTerm);
    if (downPayment !== undefined) updateData.downPayment = parseFloat(downPayment);
    if (extraPayments !== undefined) updateData.extraPayments = extraPayments;
    if (isPublic !== undefined) updateData.isPublic = Boolean(isPublic);

    if (Object.keys(updateData).length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    const calculation = await CalculationService.updateCalculation(id, req.user.uid, updateData);
    
    res.json({
      success: true,
      data: calculation,
      message: 'Calculation updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Delete calculation
router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    
    if (!id) {
      throw new AppError('Calculation ID is required', 400);
    }

    await CalculationService.deleteCalculation(id, req.user.uid);
    
    res.json({
      success: true,
      message: 'Calculation deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Generate public sharing token
router.post('/:id/share', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    
    if (!id) {
      throw new AppError('Calculation ID is required', 400);
    }

    const shareData = await CalculationService.shareCalculation(id, req.user.uid);
    
    res.json({
      success: true,
      data: shareData,
      message: 'Calculation shared successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get public shared calculation (no auth required)
router.get('/public/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      throw new AppError('Public token is required', 400);
    }

    // Validate token format (should be 64 character hex string)
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      throw new AppError('Invalid public token format', 400);
    }

    const calculation = await CalculationService.getCalculationByPublicToken(token);
    
    // Remove sensitive information for public access
    const publicCalculation = {
      ...calculation,
      userId: undefined, // Don't expose user ID
      publicToken: undefined // Don't expose the token in response
    };
    
    res.json({
      success: true,
      data: publicCalculation
    });
  } catch (error) {
    next(error);
  }
});

// Calculate mortgage without saving (utility endpoint)
router.post('/calculate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { loanAmount, interestRate, loanTerm, downPayment, extraPayments } = req.body;

    if (!loanAmount || !interestRate || !loanTerm) {
      throw new AppError('Missing required fields: loanAmount, interestRate, loanTerm', 400);
    }

    // Validate input data using the same validation as the service
    const tempData = {
      title: 'temp', // Required for validation but not used
      loanAmount: parseFloat(loanAmount),
      interestRate: parseFloat(interestRate),
      loanTerm: parseInt(loanTerm),
      downPayment: downPayment ? parseFloat(downPayment) : undefined,
      extraPayments: extraPayments || []
    };

    CalculationService.validateCalculationData(tempData);

    const results = CalculationService.calculateMortgage(
      tempData.loanAmount,
      tempData.interestRate,
      tempData.loanTerm,
      tempData.downPayment || 0,
      tempData.extraPayments
    );
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
});

export default router;