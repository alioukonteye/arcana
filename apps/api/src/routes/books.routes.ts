import { Router } from 'express';
import multer from 'multer';
import { BooksController } from '../controllers/books.controller';
import { WhitelistMiddleware } from '../middlewares/whitelist.middleware';

const router = Router();

// Secure Multer configuration
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    },
    fileFilter: (_req, file, cb) => {
        // Only allow images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

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
