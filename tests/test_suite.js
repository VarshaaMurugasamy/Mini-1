/**
 * Automated End-to-End Test Suite
 * Tests AI Microservice, Express API, MongoDB Storage, and Role-Based Access Control (RBAC)
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:5000/api';
const ML_URL = 'http://localhost:5001';

let customerToken = '';
let customerId = '';
let engineerToken = '';
let engineerId = '';
let adminToken = '';
let testTicketId = '';

async function runTests() {
  console.log('\n=============================================================');
  console.log('🧪 RUNNING INTELLIGENT HELPDESK AUTOMATED TEST SUITE');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  };

  try {
    // -------------------------------------------------------------
    // 1. Python ML Microservice Tests
    // -------------------------------------------------------------
    console.log('🔹 1. TESTING PYTHON MACHINE LEARNING MICROSERVICE (/predict & /metrics)');
    
    // ML Health check
    const mlHealth = await axios.get(`${ML_URL}/health`);
    assert(mlHealth.data.status === 'online', 'ML Microservice is online and healthy');
    assert(mlHealth.data.model_loaded === true, 'ML Classifier and Vectorizer are loaded into memory');

    // ML Prediction: Network issue
    const netPred = await axios.post(`${ML_URL}/predict`, {
      title: 'VPN Connection Drop',
      text: 'Cannot connect to company VPN from home. Ping to gateway times out.'
    });
    assert(netPred.data.predicted_category === 'Network Issues', `AI accurately classified 'Network Issues' (predicted: ${netPred.data.predicted_category})`);
    assert(netPred.data.confidence > 0.40, `Confidence score is statistically sound (${(netPred.data.confidence * 100).toFixed(1)}%)`);

    // ML Prediction: Hardware issue
    const hwPred = await axios.post(`${ML_URL}/predict`, {
      title: 'Broken Laptop Display',
      text: 'Laptop screen flickers and turns black after slight movement. Keyboard keys E and R fail.'
    });
    assert(hwPred.data.predicted_category === 'Hardware Issues', `AI accurately classified 'Hardware Issues' (predicted: ${hwPred.data.predicted_category})`);

    // ML Prediction: Database issue
    const dbPred = await axios.post(`${ML_URL}/predict`, {
      title: 'SQL deadlocks',
      text: 'PostgreSQL database connection pool exhausted during customer checkout queries.'
    });
    assert(dbPred.data.predicted_category === 'Database Issues', `AI accurately classified 'Database Issues' (predicted: ${dbPred.data.predicted_category})`);

    // ML Metrics
    const mlMetrics = await axios.get(`${ML_URL}/metrics`);
    assert(mlMetrics.data.accuracy > 0.60, `Model accuracy on test set is verified at ${(mlMetrics.data.accuracy * 100).toFixed(1)}%`);

    // -------------------------------------------------------------
    // 2. Authentication & JWT Tokens
    // -------------------------------------------------------------
    console.log('\n🔹 2. TESTING AUTHENTICATION & ROLE TOKENS');

    // Customer login
    const custRes = await axios.post(`${BACKEND_URL}/auth/login`, {
      email: 'customer@helpdesk.com',
      password: 'password123'
    });
    customerToken = custRes.data.token;
    customerId = custRes.data.user.id;
    assert(customerToken && custRes.data.user.role === 'customer', 'Customer authentication succeeded with role: customer');

    // Engineer login
    const engRes = await axios.post(`${BACKEND_URL}/auth/login`, {
      email: 'engineer@helpdesk.com',
      password: 'password123'
    });
    engineerToken = engRes.data.token;
    engineerId = engRes.data.user.id;
    assert(engineerToken && engRes.data.user.role === 'support_engineer', 'Support Engineer authentication succeeded with role: support_engineer');

    // Admin login
    const adminRes = await axios.post(`${BACKEND_URL}/auth/login`, {
      email: 'admin@helpdesk.com',
      password: 'admin123'
    });
    adminToken = adminRes.data.token;
    assert(adminToken && adminRes.data.user.role === 'admin', 'Administrator authentication succeeded with role: admin');

    // -------------------------------------------------------------
    // 3. Ticket Creation & Root-Cause Mapping
    // -------------------------------------------------------------
    console.log('\n🔹 3. TESTING TICKET CREATION & AUTOMATED ROOT CAUSE MAPPING');

    const newTicketRes = await axios.post(
      `${BACKEND_URL}/tickets`,
      {
        title: 'Office WiFi dropping repeatedly on floor 2',
        description: 'WiFi keeps disconnecting every 5 minutes on our MacBook workstations and DNS resolution fails.',
        priority: 'High'
      },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );

    const ticket = newTicketRes.data.ticket;
    testTicketId = ticket._id;
    assert(ticket.ticketNumber && ticket.ticketNumber.startsWith('TICK-'), `Generated unique Ticket Number: ${ticket.ticketNumber}`);
    assert(ticket.category === 'Network Issues', `AI Root Cause mapped correctly to '${ticket.category}'`);
    assert(ticket.aiPrediction && ticket.aiPrediction.confidence > 0, `AI Prediction record stored with confidence: ${(ticket.aiPrediction.confidence * 100).toFixed(1)}%`);
    assert(ticket.status === 'Open', 'Initial status is set to Open');

    // -------------------------------------------------------------
    // 4. Role-Based Access Control (RBAC) Security Boundaries
    // -------------------------------------------------------------
    console.log('\n🔹 4. TESTING ROLE-BASED ACCESS CONTROL (RBAC) BOUNDARIES');

    // Customer attempting to access Admin Stats
    try {
      await axios.get(`${BACKEND_URL}/stats/dashboard`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(false, 'Customer was able to access Admin dashboard (SECURITY BREACH)');
    } catch (err) {
      assert(err.response?.status === 403, 'RBAC successfully prevented Customer from accessing Admin statistics (HTTP 403 Forbidden)');
    }

    // Customer attempting to access User Management
    try {
      await axios.get(`${BACKEND_URL}/users`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(false, 'Customer was able to access User management (SECURITY BREACH)');
    } catch (err) {
      assert(err.response?.status === 403, 'RBAC successfully prevented Customer from accessing User list (HTTP 403 Forbidden)');
    }

    // Customer attempting to update Ticket Status
    try {
      await axios.patch(
        `${BACKEND_URL}/tickets/${testTicketId}/status`,
        { status: 'Resolved' },
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );
      assert(false, 'Customer was able to update ticket status (SECURITY BREACH)');
    } catch (err) {
      assert(err.response?.status === 403, 'RBAC successfully blocked Customer from updating ticket status (HTTP 403 Forbidden)');
    }

    // -------------------------------------------------------------
    // 5. Support Engineer Workflow & Ticket Resolution
    // -------------------------------------------------------------
    console.log('\n🔹 5. TESTING SUPPORT ENGINEER WORKFLOW & RESOLUTION');

    // Engineer assigns ticket to themselves
    const assignRes = await axios.patch(
      `${BACKEND_URL}/tickets/${testTicketId}/assign`,
      { engineerId: engineerId },
      { headers: { Authorization: `Bearer ${engineerToken}` } }
    );
    assert(assignRes.data.ticket.assignedTo?._id === engineerId, 'Support Engineer successfully assigned ticket to themselves');

    // Engineer updates status to 'In Progress' and adds note
    const progressRes = await axios.patch(
      `${BACKEND_URL}/tickets/${testTicketId}/status`,
      { status: 'In Progress' },
      { headers: { Authorization: `Bearer ${engineerToken}` } }
    );
    assert(progressRes.data.ticket.status === 'In Progress', "Support Engineer updated status to 'In Progress'");

    // Engineer adds resolution note & marks 'Resolved'
    const resolveRes = await axios.patch(
      `${BACKEND_URL}/tickets/${testTicketId}/status`,
      {
        status: 'Resolved',
        resolutionNotes: 'Power cycled floor 2 Cisco AP switch and flushed local DNS cache.'
      },
      { headers: { Authorization: `Bearer ${engineerToken}` } }
    );
    assert(resolveRes.data.ticket.status === 'Resolved', "Ticket status updated to 'Resolved'");
    assert(resolveRes.data.ticket.resolutionNotes.includes('Power cycled'), 'Resolution notes saved successfully in MongoDB');

    // Customer views updated status
    const custView = await axios.get(`${BACKEND_URL}/tickets/${testTicketId}`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert(custView.data.ticket.status === 'Resolved', 'Customer view reflects updated Resolved status');

    // -------------------------------------------------------------
    // 6. Admin Analytics Verification
    // -------------------------------------------------------------
    console.log('\n🔹 6. TESTING ADMINISTRATOR DASHBOARD METRICS');

    const adminStats = await axios.get(`${BACKEND_URL}/stats/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminStats.data.stats.totalTickets >= 6, `Admin dashboard reflects real-time total tickets (${adminStats.data.stats.totalTickets})`);
    assert(adminStats.data.stats.resolvedTickets >= 1, `Admin dashboard reflects resolved ticket count (${adminStats.data.stats.resolvedTickets})`);
    assert(adminStats.data.stats.categoryBreakdown['Network Issues'] >= 1, 'Network Issues category breakdown aggregated accurately');

    console.log('\n=============================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('=============================================================\n');

  } catch (err) {
    console.error('\n❌ Unhandled error during test execution:', err.message);
    if (err.response?.data) console.error('Response data:', err.response.data);
    process.exit(1);
  }
}

runTests();
