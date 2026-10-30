const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  authorRole: {
    type: String,
    enum: ['customer', 'support_engineer', 'admin'],
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  isInternal: {
    type: Boolean,
    default: false // Internal notes visible only to engineers & admins
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const historySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  performerName: {
    type: String,
    default: 'System'
  },
  details: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Please provide ticket title / subject'],
    trim: true,
    maxlength: 150
  },
  description: {
    type: String,
    required: [true, 'Please provide detailed description of the issue'],
    trim: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  category: {
    type: String,
    enum: [
      'Network Issues',
      'Hardware Issues',
      'Software Issues',
      'Login and Authentication',
      'Database Issues',
      'Email and Communication',
      'Other / Unknown'
    ],
    default: 'Other / Unknown'
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  aiPrediction: {
    predictedCategory: {
      type: String,
      default: 'Other / Unknown'
    },
    confidence: {
      type: Number,
      default: 0.0
    },
    confidenceLevel: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'low'
    },
    isLowConfidence: {
      type: Boolean,
      default: false
    },
    probabilities: {
      type: Map,
      of: Number,
      default: {}
    },
    modelArchitecture: {
      type: String,
      default: 'TF-IDF + Text Classifier'
    },
    predictedAt: {
      type: Date,
      default: Date.now
    }
  },
  resolutionNotes: {
    type: String,
    default: ''
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  comments: [commentSchema],
  history: [historySchema],
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileSize: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-generate human-readable ticket number (e.g. HD-1001) before save if not present
ticketSchema.pre('save', async function(next) {
  this.updatedAt = new Date();
  if (!this.ticketNumber) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const datePrefix = new Date().toISOString().slice(2, 7).replace('-', '');
    this.ticketNumber = `TICK-${datePrefix}-${randomSuffix}`;
  }
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
