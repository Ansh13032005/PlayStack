import { Router } from 'express';
import { authController } from '../controller/auth.controller';
import { verifyTokenMiddleware } from '../../../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// Strict rate limiting for auth endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per `window` (here, per 15 minutes)
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// POST /api/auth/login
router.post('/login', authLimiter, (req, res, next) => authController.login(req, res, next));

// POST /api/auth/logout
router.post('/logout', verifyTokenMiddleware, (req, res, next) => authController.logout(req, res, next));

// POST /api/auth/refresh
router.post('/refresh', (req, res, next) => authController.refreshTokens(req, res, next));

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, (req, res, next) => authController.forgotPassword(req, res, next));

// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, (req, res, next) => authController.resetPassword(req, res, next));

export default router;
