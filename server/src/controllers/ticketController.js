const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { predictRootCause } = require('../services/aiService');

// @route   POST /api/tickets
// @desc    Create a new helpdesk ticket (Runs AI category prediction)
// @access  Private (Customer, Support Engineer, Admin)
exports.createTicket = async (req, res) => {
  try {
    const { title, description, priority, attachments } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Ticket title and description are required.'
      });
    }

    // Step 1: Run AI root-cause classification pipeline
    const aiResult = await predictRootCause(title, description);

    // Step 2: Assemble ticket with AI prediction mapping
    const ticketData = {
      title,
      description,
      priority: priority || 'Medium',
      category: aiResult.predictedCategory,
      customer: req.user._id,
      aiPrediction: {
        predictedCategory: aiResult.predictedCategory,
        confidence: aiResult.confidence,
        confidenceLevel: aiResult.confidenceLevel,
        isLowConfidence: aiResult.isLowConfidence,
        probabilities: aiResult.probabilities,
        modelArchitecture: aiResult.modelArchitecture,
        predictedAt: aiResult.predictedAt
      },
      attachments: attachments || [],
      history: [
        {
          action: 'Ticket Created',
          performedBy: req.user._id,
          performerName: req.user.name,
          details: `Ticket submitted. Automated Root Cause Analysis mapped category to '${aiResult.predictedCategory}' with ${(aiResult.confidence * 100).toFixed(1)}% confidence.`
        }
      ]
    };

    const ticket = await Ticket.create(ticketData);
    await ticket.populate('customer', 'name email department');

    return res.status(201).json({
      success: true,
      message: 'Ticket created and classified successfully.',
      ticket
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating ticket.'
    });
  }
};

// @route   GET /api/tickets
// @desc    Get tickets with role-based filtering, search, and pagination
// @access  Private
exports.getTickets = async (req, res) => {
  try {
    const { status, priority, category, search, assigned, page = 1, limit = 50 } = req.query;

    const query = {};

    // Role-based access boundary: customers only see their own tickets
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    } else if (req.user.role === 'support_engineer') {
      if (assigned === 'me') {
        query.assignedTo = req.user._id;
      } else if (assigned === 'unassigned') {
        query.assignedTo = null;
      }
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await Ticket.countDocuments(query);
    const tickets = await Ticket.find(query)
      .populate('customer', 'name email department')
      .populate('assignedTo', 'name email department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      count: tickets.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      tickets
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving tickets.'
    });
  }
};

// @route   GET /api/tickets/:id
// @desc    Get ticket details by ID
// @access  Private
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customer', 'name email department')
      .populate('assignedTo', 'name email department')
      .populate('comments.author', 'name email role');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found.'
      });
    }

    // Security check: customer can only view their own tickets
    if (
      req.user.role === 'customer' &&
      ticket.customer._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only view your own tickets.'
      });
    }

    // Filter out internal comments if requester is customer
    if (req.user.role === 'customer') {
      ticket.comments = ticket.comments.filter(c => !c.isInternal);
    }

    return res.status(200).json({
      success: true,
      ticket
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving ticket.'
    });
  }
};

// @route   PATCH /api/tickets/:id/status
// @desc    Update ticket status and resolution notes
// @access  Private (Support Engineer, Admin)
exports.updateTicketStatus = async (req, res) => {
  try {
    const { status, resolutionNotes, category } = req.body;

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const prevStatus = ticket.status;

    if (status) {
      ticket.status = status;
      if (status === 'Resolved' || status === 'Closed') {
        ticket.resolvedAt = new Date();
      }
    }

    if (resolutionNotes !== undefined) {
      ticket.resolutionNotes = resolutionNotes;
    }

    if (category) {
      ticket.category = category;
    }

    ticket.history.push({
      action: 'Status Updated',
      performedBy: req.user._id,
      performerName: req.user.name,
      details: `Status changed from '${prevStatus}' to '${status || prevStatus}'. ${resolutionNotes ? `Resolution note added: ${resolutionNotes}` : ''}`
    });

    await ticket.save();
    await ticket.populate('customer', 'name email department');
    await ticket.populate('assignedTo', 'name email department');

    return res.status(200).json({
      success: true,
      message: 'Ticket status updated successfully.',
      ticket
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating ticket status.'
    });
  }
};

// @route   PATCH /api/tickets/:id/assign
// @desc    Assign ticket to support engineer
// @access  Private (Support Engineer, Admin)
exports.assignTicket = async (req, res) => {
  try {
    const { engineerId } = req.body;

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    let engineer = null;
    if (engineerId) {
      engineer = await User.findById(engineerId);
      if (!engineer || !['support_engineer', 'admin'].includes(engineer.role)) {
        return res.status(400).json({
          success: false,
          message: 'Target user is not an active support engineer or administrator.'
        });
      }
      ticket.assignedTo = engineer._id;
    } else {
      ticket.assignedTo = null;
    }

    ticket.history.push({
      action: 'Ticket Assigned',
      performedBy: req.user._id,
      performerName: req.user.name,
      details: engineer ? `Assigned to ${engineer.name} (${engineer.email})` : 'Unassigned'
    });

    await ticket.save();
    await ticket.populate('customer', 'name email department');
    await ticket.populate('assignedTo', 'name email department');

    return res.status(200).json({
      success: true,
      message: engineer ? `Ticket assigned to ${engineer.name}.` : 'Ticket unassigned.',
      ticket
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error assigning ticket.'
    });
  }
};

// @route   POST /api/tickets/:id/comments
// @desc    Add comment or resolution note to ticket
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { text, isInternal } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text cannot be empty.'
      });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    // Customers cannot post internal notes
    const internalNote = req.user.role !== 'customer' && Boolean(isInternal);

    const newComment = {
      author: req.user._id,
      authorName: req.user.name,
      authorRole: req.user.role,
      text: text.trim(),
      isInternal: internalNote,
      createdAt: new Date()
    };

    ticket.comments.push(newComment);
    ticket.history.push({
      action: 'Comment Added',
      performedBy: req.user._id,
      performerName: req.user.name,
      details: internalNote ? 'Added an internal support note.' : 'Added a message.'
    });

    await ticket.save();
    await ticket.populate('customer', 'name email department');
    await ticket.populate('assignedTo', 'name email department');

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      comments: ticket.comments
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error adding comment.'
    });
  }
};

// @route   POST /api/tickets/:id/reclassify
// @desc    Trigger AI re-classification of ticket root-cause category
// @access  Private (Support Engineer, Admin)
exports.reclassifyTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const aiResult = await predictRootCause(ticket.title, ticket.description);

    ticket.aiPrediction = {
      predictedCategory: aiResult.predictedCategory,
      confidence: aiResult.confidence,
      confidenceLevel: aiResult.confidenceLevel,
      isLowConfidence: aiResult.isLowConfidence,
      probabilities: aiResult.probabilities,
      modelArchitecture: aiResult.modelArchitecture,
      predictedAt: aiResult.predictedAt
    };
    ticket.category = aiResult.predictedCategory;

    ticket.history.push({
      action: 'AI Re-Classification',
      performedBy: req.user._id,
      performerName: req.user.name,
      details: `Re-ran automated root cause analysis. Category mapped to '${aiResult.predictedCategory}' (${(aiResult.confidence * 100).toFixed(1)}%).`
    });

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: 'Ticket re-classified successfully.',
      category: ticket.category,
      aiPrediction: ticket.aiPrediction
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during re-classification.'
    });
  }
};
