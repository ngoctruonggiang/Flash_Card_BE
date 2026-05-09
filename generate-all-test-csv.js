const fs = require('fs');
const path = require('path');

// Function to extract UC IDs from describe block
function extractUCFromDescribe(describeText) {
  const ucMatches = describeText.match(/UC-\d+/g);
  if (ucMatches && ucMatches.length > 0) {
    return ucMatches.join(', ');
  }
  return null;
}

// Function to extract requirement description from describe block
function extractReqDescFromDescribe(describeText) {
  // Try to extract text after UC-XX: pattern
  const match = describeText.match(/UC-\d+:\s*(.+?)(?:\s*&\s*UC-\d+:|$)/);
  if (match) {
    return match[1].trim();
  }
  
  // Try to extract text between last UC and " - " or end
  const altMatch = describeText.match(/UC-\d+:\s*(.+?)(?:\s*-|$)/);
  if (altMatch) {
    return altMatch[1].trim();
  }
  
  return null;
}

// Function to generate TC ID prefix from describe context
function generateTcPrefix(describeStack, reqDesc) {
  // Try to extract a meaningful prefix from the describe stack
  const context = describeStack.filter(d => d).join(' ');
  
  // Check for common patterns
  if (context.includes('AppController') || context.includes('app.controller')) {
    return 'TC-APPCTRL';
  }
  if (context.includes('AppService') || context.includes('app.service')) {
    return 'TC-APPSVC';
  }
  if (context.includes('AuthGuard') || context.includes('auth.guard')) {
    return 'TC-AUTHGUARD';
  }
  if (context.includes('RolesGuard') || context.includes('roles.guard')) {
    return 'TC-ROLESGUARD';
  }
  if (context.includes('GlobalExceptionFilter') || context.includes('global.filter')) {
    return 'TC-FILTER';
  }
  if (context.includes('ResponseInterceptor') || context.includes('response.interceptor')) {
    return 'TC-INTERCEPTOR';
  }
  if (context.includes('Scheduler')) {
    return 'TC-SCHEDULER';
  }
  
  // Use requirement description to generate prefix
  if (reqDesc && reqDesc !== 'Non-Functional Requirements') {
    const words = reqDesc.split(/[\s,&]+/)
      .filter(w => w.length > 2)
      .map(w => w.toUpperCase())
      .slice(0, 2);
    if (words.length > 0) {
      return 'TC-' + words.join('');
    }
  }
  
  return 'TC-GEN';
}

// Function to extract test structure from test files
function parseTestFile(filePath, testType) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const tests = [];
  
  // Parse describe and it blocks
  const lines = content.split('\n');
  let describeStack = [];
  let reqIdStack = [];
  let reqDescStack = [];
  let tcCounters = {}; // Track counters for each prefix

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Match describe blocks
    const describeMatch = trimmedLine.match(/describe\([`'"](.+?)[`'"]/);
    if (describeMatch) {
      const describeText = describeMatch[1];
      const depth = Math.floor((line.match(/^\s*/)[0].length) / 2);
      
      describeStack[depth] = describeText;
      describeStack = describeStack.slice(0, depth + 1);
      
      // Extract UC and requirement description
      const ucId = extractUCFromDescribe(describeText);
      const reqDesc = extractReqDescFromDescribe(describeText);
      
      if (ucId) {
        reqIdStack[depth] = ucId;
        reqIdStack = reqIdStack.slice(0, depth + 1);
      }
      
      if (reqDesc) {
        reqDescStack[depth] = reqDesc;
        reqDescStack = reqDescStack.slice(0, depth + 1);
      }
      
      continue;
    }

    // Match it blocks
    const itMatch = trimmedLine.match(/it\([`'"](.+?)[`'"]/);
    if (itMatch) {
      let testDesc = itMatch[1];
      const parentContext = describeStack.filter(d => d).join(' > ');

      // Extract TC ID from the test description or parent context
      // Try format with colon: "TC-XXX-001: description"
      let testTcIdMatch = testDesc.match(/^(TC-[A-Z0-9]+-\d+):\s*(.+)/);
      let tcId = null;
      let parentTcId = null;
      
      if (testTcIdMatch) {
        tcId = testTcIdMatch[1];
        testDesc = testTcIdMatch[2]; // Remove TC ID from description
      } else {
        // Try format without colon: "TC-XXX-001 description"
        testTcIdMatch = testDesc.match(/^(TC-[A-Z0-9]+-\d+)\s+(.+)/);
        if (testTcIdMatch) {
          tcId = testTcIdMatch[1];
          testDesc = testTcIdMatch[2]; // Remove TC ID from description
        } else {
          // Try to extract TC ID from parent context
          const parentTcIdMatch = parentContext.match(/(TC-[A-Z0-9]+-\d+)/);
          if (parentTcIdMatch) {
            parentTcId = parentTcIdMatch[1];
            tcId = parentTcId;
          }
        }
      }
      
      // If no TC ID found, generate one based on context
      if (!tcId) {
        const reqDesc = reqDescStack.filter(r => r).slice(-1)[0] || 'Non-Functional Requirements';
        const prefix = generateTcPrefix(describeStack, reqDesc);
        
        // Initialize counter for this prefix if needed
        if (!tcCounters[prefix]) {
          tcCounters[prefix] = 1;
        }
        
        // Generate TC ID with counter
        tcId = `${prefix}-${String(tcCounters[prefix]).padStart(3, '0')}`;
        tcCounters[prefix]++;
      }

      // Get the most recent UC ID and requirement description from the stack
      let reqId = reqIdStack.filter(r => r).slice(-1)[0] || 'UC-XX';
      let reqDesc = reqDescStack.filter(r => r).slice(-1)[0] || 'Non-Functional Requirements';

      // Special handling for SM2 algorithm tests
      if (parentContext.includes('SM2 Algorithm')) {
        reqId = 'UC-16';
        reqDesc = 'SM2 Spaced Repetition Algorithm';
      }
      
      // Special handling for Deck Customization tests
      if (parentContext.includes('Deck Customization')) {
        reqId = 'UC-13';
        reqDesc = 'Deck Customization';
      }

      // Check if this is a child step
      const isChildStep = testDesc.toLowerCase().includes('step') || 
                          parentContext.toLowerCase().includes('step') ||
                          testDesc.match(/^Step \d+:/);

      // For child steps, extract use case from parent describe
      let useCase = parentContext;
      if (isChildStep) {
        const parentDescribeMatch = parentContext.match(/TC-[A-Z0-9]+-\d+\s+(.+?)(?:\s*>\s*|$)/);
        if (parentDescribeMatch) {
          useCase = parentDescribeMatch[1];
        }
      }

      tests.push({
        reqId,
        reqDesc,
        tcId,
        tcDesc: testDesc,
        parentContext,
        testDesign: testType === 'e2e' ? 'E2E - Functional Tests' : 'Unit - Functional Tests',
        isChildStep,
        useCase
      });
    }
  }

  return tests;
}

// Generate CSV for a specific test type
function generateCSV(testDir, testType, outputFileName) {
  const testFiles = [];
  
  // Recursively find all test files
  function findTestFiles(dir) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        findTestFiles(fullPath);
      } else if (item.endsWith('.spec.ts') || item.endsWith('.e2e-spec.ts')) {
        testFiles.push(fullPath);
      }
    });
  }
  
  findTestFiles(testDir);

  let allTests = [];
  let rowNumber = 1;

  testFiles.forEach(file => {
    const fileName = path.basename(file);
    console.log(`Processing: ${fileName}`);
    const tests = parseTestFile(file, testType);
    
    tests.forEach(test => {
      allTests.push({
        no: rowNumber++,
        reqId: test.reqId,
        reqDesc: test.reqDesc,
        tcId: test.tcId,
        tcDesc: test.tcDesc,
        testDesign: test.testDesign,
        testDesigner: 'Development Team'
      });
    });
  });

  // Sort test cases by UC ID first, then by TC ID for better organization
  allTests.sort((a, b) => {
    // Extract first UC ID from reqId (handle multiple UCs like "UC-01, UC-02")
    const aUcMatch = a.reqId.match(/UC-(\d+)/);
    const bUcMatch = b.reqId.match(/UC-(\d+)/);
    
    // Handle Non-Functional Requirements (UC-XX) - put them at the end
    const aIsNonFunctional = a.reqId === 'UC-XX';
    const bIsNonFunctional = b.reqId === 'UC-XX';
    
    if (aIsNonFunctional && !bIsNonFunctional) return 1;
    if (!aIsNonFunctional && bIsNonFunctional) return -1;
    
    // Compare by UC ID first
    if (aUcMatch && bUcMatch) {
      const aUcNum = parseInt(aUcMatch[1]);
      const bUcNum = parseInt(bUcMatch[1]);
      
      if (aUcNum !== bUcNum) {
        return aUcNum - bUcNum;
      }
    }
    
    // If UC IDs are the same or not found, sort by TC ID
    const aTcMatch = a.tcId.match(/TC-([A-Z0-9]+)-(\d+)/);
    const bTcMatch = b.tcId.match(/TC-([A-Z0-9]+)-(\d+)/);
    
    if (aTcMatch && bTcMatch) {
      const aModule = aTcMatch[1];
      const bModule = bTcMatch[1];
      const aNum = parseInt(aTcMatch[2]);
      const bNum = parseInt(bTcMatch[2]);
      
      if (aModule !== bModule) {
        return aModule.localeCompare(bModule);
      }
      return aNum - bNum;
    }
    
    return a.tcId.localeCompare(b.tcId);
  });

  // Reassign row numbers after sorting
  allTests.forEach((test, index) => {
    test.no = index + 1;
  });

  // Generate CSV
  const csvHeader = 'No,Req ID,Req Desc,TC ID,TC Desc,Test Design,Test Designer\n';
  const csvRows = allTests.map(test => {
    // Escape quotes in descriptions
    const reqDesc = test.reqDesc.replace(/"/g, '""');
    const tcDesc = test.tcDesc.replace(/"/g, '""');
    
    return `${test.no},"${test.reqId}","${reqDesc}",${test.tcId},"${tcDesc}",${test.testDesign},${test.testDesigner}`;
  }).join('\n');

  const csv = csvHeader + csvRows;
  fs.writeFileSync(path.join(__dirname, outputFileName), csv);
  
  console.log(`Generated CSV with ${allTests.length} test cases`);
  console.log(`Output file: ${outputFileName}\n`);
}

// Main execution
function main() {
  console.log('=== Generating E2E Test Cases CSV ===');
  const e2eDir = path.join(__dirname, 'tests', 'e2e');
  generateCSV(e2eDir, 'e2e', 'e2e-test-cases.csv');
  
  console.log('=== Generating Unit Test Cases CSV ===');
  const unitDir = path.join(__dirname, 'tests', 'unit');
  generateCSV(unitDir, 'unit', 'unit-test-cases.csv');
  
  console.log('=== Done! ===');
}

main();
