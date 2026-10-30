const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001';

/**
 * Predicts the root-cause category and confidence score for a ticket.
 * Communicates with the Python Flask ML microservice.
 * Includes a resilient heuristic fallback in case the ML service is temporarily unreachable.
 */
const predictRootCause = async (title, description) => {
  const text = `${title || ''} ${description || ''}`.trim();

  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/predict`,
      { title, text, threshold: 0.30 },
      { timeout: 4000 }
    );

    if (response.data) {
      return {
        predictedCategory: response.data.predicted_category || 'Other / Unknown',
        confidence: response.data.confidence || 0.0,
        confidenceLevel: response.data.confidence_level || 'low',
        isLowConfidence: Boolean(response.data.is_low_confidence),
        probabilities: response.data.class_probabilities || {},
        modelArchitecture: response.data.model_architecture || 'TF-IDF + Text Classifier',
        predictedAt: new Date(),
        source: 'ml_microservice'
      };
    }
  } catch (error) {
    console.warn(`[AI Service] ML microservice call to ${ML_SERVICE_URL} failed (${error.message}). Using fallback classifier.`);
  }

  // Graceful rule-based heuristic fallback if ML service is unreachable
  return fallbackRuleBasedClassifier(text);
};

/**
 * Fallback rule-based classifier based on technical keywords.
 */
const fallbackRuleBasedClassifier = (text) => {
  const lower = text.toLowerCase();

  const rules = [
    {
      category: 'Network Issues',
      keywords: ['vpn', 'wifi', 'wi-fi', 'internet', 'network', 'dns', 'router', 'gateway', 'latency', 'ping', 'firewall', 'ip address', 'bandwidth', 'packet']
    },
    {
      category: 'Hardware Issues',
      keywords: ['printer', 'screen', 'monitor', 'keyboard', 'laptop', 'mouse', 'battery', 'charger', 'hardware', 'overheat', 'fan', 'cable', 'docking', 'ram', 'display']
    },
    {
      category: 'Software Issues',
      keywords: ['crash', 'freeze', 'bug', 'error code', 'application', 'software', 'excel', 'browser', 'dll', 'macro', 'install', 'update failed', 'exception', 'program']
    },
    {
      category: 'Login and Authentication',
      keywords: ['login', 'password', 'auth', '2fa', 'mfa', 'locked', 'sso', 'okta', 'authenticator', 'badge', 'credential', 'token', 'reset password', 'account locked']
    },
    {
      category: 'Database Issues',
      keywords: ['database', 'sql', 'mysql', 'postgres', 'query', 'deadlock', 'replica', 'mongodb', 'redis', 'table', 'slow query', 'foreign key', 'index']
    },
    {
      category: 'Email and Communication',
      keywords: ['email', 'outlook', 'teams', 'slack', 'mail', 'exchange', 'smtp', 'imap', 'zoom', 'inbox', 'bounce', 'deliverability', 'mailbox']
    }
  ];

  let bestMatch = 'Other / Unknown';
  let bestScore = 0;
  const probabilities = {
    'Network Issues': 0.05,
    'Hardware Issues': 0.05,
    'Software Issues': 0.05,
    'Login and Authentication': 0.05,
    'Database Issues': 0.05,
    'Email and Communication': 0.05,
    'Other / Unknown': 0.70
  };

  for (const rule of rules) {
    let matches = 0;
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) {
        matches++;
      }
    }
    if (matches > bestScore) {
      bestScore = matches;
      bestMatch = rule.category;
    }
  }

  const confidence = bestScore > 0 ? Math.min(0.50 + bestScore * 0.15, 0.92) : 0.25;
  const confidenceLevel = confidence >= 0.70 ? 'high' : (confidence >= 0.40 ? 'medium' : 'low');

  if (bestScore > 0) {
    probabilities[bestMatch] = confidence;
    probabilities['Other / Unknown'] = +(1 - confidence).toFixed(2);
  }

  return {
    predictedCategory: bestMatch,
    confidence: +confidence.toFixed(2),
    confidenceLevel,
    isLowConfidence: confidence < 0.40,
    probabilities,
    modelArchitecture: 'Rule-Based Fallback Classifier (ML service offline)',
    predictedAt: new Date(),
    source: 'fallback_engine'
  };
};

/**
 * Fetch ML model evaluation metrics from Python service
 */
const getModelMetrics = async () => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/metrics`, { timeout: 3000 });
    return response.data;
  } catch (error) {
    return {
      status: 'offline',
      message: 'ML Service is currently unavailable or initializing',
      error: error.message
    };
  }
};

module.exports = {
  predictRootCause,
  getModelMetrics
};
