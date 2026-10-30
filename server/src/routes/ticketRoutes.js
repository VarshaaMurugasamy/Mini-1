const express = require('express');
const router = express.Router();
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  assignTicket,
  addComment,
  reclassifyTicket
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // All ticket endpoints require authentication

router.route('/')
  .post(createTicket)
  .get(getTickets);

router.route('/:id')
  .get(getTicketById);

router.route('/:id/status')
  .patch(authorize('support_engineer', 'admin'), updateTicketStatus);

router.route('/:id/assign')
  .patch(authorize('support_engineer', 'admin'), assignTicket);

router.route('/:id/comments')
  .post(addComment);

router.route('/:id/reclassify')
  .post(authorize('support_engineer', 'admin'), reclassifyTicket);

module.exports = router;
