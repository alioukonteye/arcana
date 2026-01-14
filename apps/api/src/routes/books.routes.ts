import { Router } from 'express';
import multer from 'multer';
import { BooksController } from '../controllers/books.controller';
import { WhitelistMiddleware } from '../middlewares/whitelist.middleware';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Apply auth middleware to all books routes
router.use(WhitelistMiddleware);

// Scan shelf (bulk)
router.post('/scan', upload.single('image'), BooksController.scan);

// Create single book (manual/wishlist)
router.post('/', BooksController.create);

// Get all books
router.get('/', BooksController.getAll);
router.get('/filters', BooksController.getFilterOptions);

// Get single book
router.get('/:id', BooksController.getById);

// Delete book
router.delete('/:id', BooksController.delete);

// Update status
router.patch('/:id/status', BooksController.updateStatus);
router.post('/:id/reading-status', BooksController.updateReadingStatus);
router.patch('/:id/loan', BooksController.updateLoan);
router.get('/:id/reading-card', BooksController.getReadingCard);

export const booksRouter = router;
