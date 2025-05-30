const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5001/mortgage-firebase-firebase/europe-west3/api';
const TEST_USER_EMAIL = 'premium@test.com';
const TEST_USER_PASSWORD = 'testpassword123';

let authToken = '';
let testCalculationId = '';
let testComparisonId = '';
let testScenarioId = '';

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ ${method.toUpperCase()} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
};

// Test functions
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  try {
    // Login with premium user
    const loginResponse = await makeRequest('POST', '/auth/login', {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    authToken = loginResponse.data.token;
    console.log('✅ Authentication successful');
    return true;
  } catch (error) {
    console.log('❌ Authentication failed - creating premium user...');
    
    try {
      // Register premium user
      await makeRequest('POST', '/auth/register', {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        displayName: 'Premium Test User'
      });
      
      // Login
      const loginResponse = await makeRequest('POST', '/auth/login', {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });
      
      authToken = loginResponse.data.token;
      
      // Upgrade to premium (this would normally be done via payment)
      await makeRequest('PUT', '/users/tier', {
        tier: 'premium'
      });
      
      console.log('✅ Premium user created and authenticated');
      return true;
    } catch (createError) {
      console.error('❌ Failed to create premium user:', createError.message);
      return false;
    }
  }
}

async function testCalculationCreation() {
  console.log('\n📊 Creating test calculation...');
  
  try {
    const response = await makeRequest('POST', '/calculations', {
      title: 'Premium Test Calculation',
      loanAmount: 500000,
      interestRate: 4.5,
      loanTerm: 30,
      downPayment: 100000
    });
    
    testCalculationId = response.data.id;
    console.log('✅ Test calculation created:', testCalculationId);
    return true;
  } catch (error) {
    console.error('❌ Failed to create test calculation');
    return false;
  }
}

async function testLoanComparison() {
  console.log('\n🔄 Testing Loan Comparison...');
  
  try {
    // Test comparison calculation (without saving)
    const comparisonData = {
      title: 'Premium Loan Comparison Test',
      loans: [
        {
          title: 'Loan Option A',
          loanAmount: 500000,
          interestRate: 4.5,
          loanTerm: 30,
          downPayment: 100000
        },
        {
          title: 'Loan Option B',
          loanAmount: 500000,
          interestRate: 4.0,
          loanTerm: 30,
          downPayment: 100000
        },
        {
          title: 'Loan Option C',
          loanAmount: 500000,
          interestRate: 5.0,
          loanTerm: 25,
          downPayment: 100000
        }
      ]
    };
    
    // Calculate comparison
    const calcResponse = await makeRequest('POST', '/comparisons/calculate', comparisonData);
    console.log('✅ Comparison calculation successful');
    console.log(`   Best loan: ${calcResponse.data.summary.bestLoan.title}`);
    console.log(`   Total savings: $${calcResponse.data.summary.totalSavings.toLocaleString()}`);
    
    // Save comparison
    const saveResponse = await makeRequest('POST', '/comparisons/save', comparisonData);
    testComparisonId = saveResponse.data.id;
    console.log('✅ Comparison saved:', testComparisonId);
    
    // Get comparison
    const getResponse = await makeRequest('GET', `/comparisons/${testComparisonId}`);
    console.log('✅ Comparison retrieved successfully');
    
    // List comparisons
    const listResponse = await makeRequest('GET', '/comparisons');
    console.log(`✅ Listed ${listResponse.data.comparisons.length} comparisons`);
    
    return true;
  } catch (error) {
    console.error('❌ Loan comparison test failed');
    return false;
  }
}

async function testScenarioModeling() {
  console.log('\n📈 Testing Scenario Modeling...');
  
  try {
    // Generate rate change scenarios
    const rateScenarios = await makeRequest('POST', '/scenarios/rate-change');
    console.log(`✅ Generated ${rateScenarios.data.length} rate change scenarios`);
    
    // Generate stress test scenarios
    const stressScenarios = await makeRequest('POST', '/scenarios/stress-test');
    console.log(`✅ Generated ${stressScenarios.data.length} stress test scenarios`);
    
    // Create what-if scenario analysis
    const scenarioData = {
      title: 'Premium Scenario Analysis Test',
      baseCalculationId: testCalculationId,
      scenarios: [
        {
          name: 'Rate Increase +1%',
          type: 'rate-change',
          parameters: {
            rateChange: 1.0
          }
        },
        {
          name: 'Extra Payment $500/month',
          type: 'what-if',
          parameters: {
            extraPayment: 500
          }
        },
        {
          name: 'Moderate Recession',
          type: 'stress-test',
          parameters: {
            stressLevel: 'moderate'
          }
        }
      ]
    };
    
    // Calculate scenarios
    const calcResponse = await makeRequest('POST', '/scenarios/what-if', scenarioData);
    console.log('✅ Scenario calculation successful');
    console.log(`   Best case: ${calcResponse.data.analysis.bestCase.description}`);
    console.log(`   Worst case: ${calcResponse.data.analysis.worstCase.description}`);
    
    // Save scenario analysis
    const saveResponse = await makeRequest('POST', '/scenarios/save', scenarioData);
    testScenarioId = saveResponse.data.id;
    console.log('✅ Scenario analysis saved:', testScenarioId);
    
    // Get scenario analysis
    const getResponse = await makeRequest('GET', `/scenarios/${testScenarioId}`);
    console.log('✅ Scenario analysis retrieved successfully');
    
    // List scenarios
    const listResponse = await makeRequest('GET', '/scenarios');
    console.log(`✅ Listed ${listResponse.data.scenarios.length} scenario analyses`);
    
    return true;
  } catch (error) {
    console.error('❌ Scenario modeling test failed');
    return false;
  }
}

async function testExportGeneration() {
  console.log('\n📄 Testing Export Generation...');
  
  try {
    // Test PDF export
    const pdfExport = await makeRequest('POST', '/exports/pdf', {
      dataType: 'calculation',
      dataId: testCalculationId
    });
    console.log('✅ PDF export request created:', pdfExport.data.id);
    
    // Test Excel export
    const excelExport = await makeRequest('POST', '/exports/excel', {
      dataType: 'comparison',
      dataId: testComparisonId
    });
    console.log('✅ Excel export request created:', excelExport.data.id);
    
    // Test CSV export
    const csvExport = await makeRequest('POST', '/exports/csv', {
      dataType: 'scenario',
      dataId: testScenarioId
    });
    console.log('✅ CSV export request created:', csvExport.data.id);
    
    // Get export history
    const historyResponse = await makeRequest('GET', '/exports/history');
    console.log(`✅ Retrieved export history: ${historyResponse.data.exports.length} exports`);
    
    // Check export status
    const statusResponse = await makeRequest('GET', `/exports/${pdfExport.data.id}`);
    console.log(`✅ Export status: ${statusResponse.data.status}`);
    
    return true;
  } catch (error) {
    console.error('❌ Export generation test failed');
    return false;
  }
}

async function testPremiumFeatureAccess() {
  console.log('\n🔒 Testing Premium Feature Access Control...');
  
  try {
    // Test with premium user (should work)
    await makeRequest('GET', '/comparisons');
    console.log('✅ Premium user can access comparison features');
    
    // TODO: Test with free user (should fail)
    // This would require creating a separate free user and testing access
    
    return true;
  } catch (error) {
    console.error('❌ Premium feature access test failed');
    return false;
  }
}

// Main test runner
async function runPremiumTests() {
  console.log('🚀 Starting Premium Features Test Suite...');
  console.log('='.repeat(50));
  
  const tests = [
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Calculation Creation', fn: testCalculationCreation },
    { name: 'Loan Comparison', fn: testLoanComparison },
    { name: 'Scenario Modeling', fn: testScenarioModeling },
    { name: 'Export Generation', fn: testExportGeneration },
    { name: 'Premium Feature Access', fn: testPremiumFeatureAccess }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ Test "${test.name}" threw an error:`, error.message);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All premium features tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runPremiumTests().catch(console.error);
}

module.exports = {
  runPremiumTests,
  testAuthentication,
  testLoanComparison,
  testScenarioModeling,
  testExportGeneration
};