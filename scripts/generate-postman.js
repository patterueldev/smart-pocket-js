#!/usr/bin/env node
/**
 * Generate Postman Collection from OpenAPI Specification
 * 
 * This script converts the OpenAPI spec to a Postman Collection v2.1
 * Keeps the collection in sync with the API specification.
 * 
 * Usage:
 *   node scripts/generate-postman.js
 *   npm run postman:generate
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Paths
const OPENAPI_SPEC_PATH = path.join(__dirname, '../docs/api-spec.yaml');
const POSTMAN_COLLECTION_PATH = path.join(__dirname, '../docs/smart-pocket.postman_collection.json');
const POSTMAN_ENV_PATH = path.join(__dirname, '../docs/smart-pocket.postman_environment.json');

// Read and parse OpenAPI spec
function loadOpenAPISpec() {
  const specContent = fs.readFileSync(OPENAPI_SPEC_PATH, 'utf8');
  return yaml.load(specContent);
}

// Convert OpenAPI path parameters to Postman format
function convertPathParams(path) {
  return path.replace(/{(\w+)}/g, ':$1');
}

// Convert OpenAPI operation to Postman request
function convertOperationToRequest(path, method, operation, spec) {
  const request = {
    name: operation.summary || `${method.toUpperCase()} ${path}`,
    request: {
      method: method.toUpperCase(),
      header: [
        {
          key: 'Content-Type',
          value: 'application/json',
          type: 'text'
        }
      ],
      url: {
        raw: `{{baseUrl}}${convertPathParams(path)}`,
        host: ['{{baseUrl}}'],
        path: convertPathParams(path).split('/').filter(p => p)
      }
    }
  };

  // Add description
  if (operation.description) {
    request.request.description = operation.description;
  }

  // Add request body if present
  if (operation.requestBody) {
    const content = operation.requestBody.content;
    if (content && content['application/json']) {
      const schema = content['application/json'].schema;
      const example = content['application/json'].example || generateExample(schema, spec);
      
      request.request.body = {
        mode: 'raw',
        raw: JSON.stringify(example, null, 2),
        options: {
          raw: {
            language: 'json'
          }
        }
      };
    }
  }

  // Add path parameters
  if (path.includes('{')) {
    request.request.url.variable = [];
    const params = path.match(/{(\w+)}/g);
    if (params) {
      params.forEach(param => {
        const paramName = param.slice(1, -1);
        request.request.url.variable.push({
          key: paramName,
          value: `sample-${paramName}`,
          description: `Path parameter: ${paramName}`
        });
      });
    }
  }

  // Add query parameters
  if (operation.parameters) {
    const queryParams = operation.parameters.filter(p => p.in === 'query');
    if (queryParams.length > 0) {
      request.request.url.query = queryParams.map(param => ({
        key: param.name,
        value: param.example || param.schema?.default || '',
        description: param.description,
        disabled: !param.required
      }));
    }
  }

  return request;
}

// Generate example from schema
function generateExample(schema, spec) {
  if (!schema) return {};
  
  // Handle $ref
  if (schema.$ref) {
    const refPath = schema.$ref.split('/').slice(2); // Remove #/components/
    let refSchema = spec.components;
    refPath.forEach(part => {
      refSchema = refSchema[part];
    });
    return generateExample(refSchema, spec);
  }

  // Handle different types
  if (schema.type === 'object') {
    const example = {};
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([key, prop]) => {
        example[key] = prop.example || generateExample(prop, spec);
      });
    }
    return example;
  }

  if (schema.type === 'array') {
    return [generateExample(schema.items, spec)];
  }

  // Primitive types
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;

  // Type-based defaults
  const defaults = {
    string: 'string',
    number: 0,
    integer: 0,
    boolean: false,
    object: {},
    array: []
  };

  return defaults[schema.type] || null;
}

// Group requests by tags or paths
function groupRequests(spec) {
  const groups = {
    'Authentication': [],
    'Health': [],
    'OCR': [],
    'Transactions': [],
    'Payees': [],
    'Accounts': [],
    'Products': [],
    'Google Sheets': []
  };

  Object.entries(spec.paths).forEach(([path, pathItem]) => {
    Object.entries(pathItem).forEach(([method, operation]) => {
      if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
        const request = convertOperationToRequest(path, method, operation, spec);
        
        // Determine group
        let group = 'Other';
        if (path.includes('/connect') || path.includes('/disconnect')) {
          group = 'Authentication';
        } else if (path.includes('/health')) {
          group = 'Health';
        } else if (path.includes('/ocr')) {
          group = 'OCR';
        } else if (path.includes('/transaction')) {
          group = 'Transactions';
        } else if (path.includes('/payee')) {
          group = 'Payees';
        } else if (path.includes('/account')) {
          group = 'Accounts';
        } else if (path.includes('/product') || path.includes('/item')) {
          group = 'Products';
        } else if (path.includes('/google-sheets')) {
          group = 'Google Sheets';
        }
        
        if (groups[group]) {
          groups[group].push(request);
        } else {
          groups['Other'] = groups['Other'] || [];
          groups['Other'].push(request);
        }
      }
    });
  });

  return groups;
}

// Generate Postman Collection
function generatePostmanCollection(spec) {
  const groups = groupRequests(spec);
  
  const collection = {
    info: {
      name: spec.info.title || 'Smart Pocket API',
      description: spec.info.description || '',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      _postman_id: 'smart-pocket-api-v1'
    },
    auth: {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{bearerToken}}',
          type: 'string'
        }
      ]
    },
    variable: [
      {
        key: 'baseUrl',
        value: 'http://localhost:3001/api/v1',
        type: 'string'
      },
      {
        key: 'apiKey',
        value: 'dev_api_key_change_me',
        type: 'string'
      },
      {
        key: 'bearerToken',
        value: '',
        type: 'string'
      }
    ],
    item: []
  };

  // Add groups as folders
  Object.entries(groups).forEach(([groupName, requests]) => {
    if (requests.length > 0) {
      collection.item.push({
        name: groupName,
        description: `${groupName} endpoints`,
        item: requests
      });
    }
  });

  return collection;
}

// Generate Postman Environment
function generatePostmanEnvironment() {
  return {
    id: 'smart-pocket-dev-env',
    name: 'Smart Pocket Development',
    values: [
      {
        key: 'baseUrl',
        value: 'http://localhost:3001/api/v1',
        type: 'default',
        enabled: true
      },
      {
        key: 'apiKey',
        value: 'dev_api_key_change_me',
        type: 'default',
        enabled: true
      },
      {
        key: 'bearerToken',
        value: '',
        type: 'secret',
        enabled: true
      },
      {
        key: 'serverUrl',
        value: 'http://localhost:3001',
        type: 'default',
        enabled: true
      }
    ],
    _postman_variable_scope: 'environment',
    _postman_exported_at: new Date().toISOString(),
    _postman_exported_using: 'OpenAPI Generator Script'
  };
}

// Main function
function main() {
  console.log('📋 Generating Postman Collection from OpenAPI Spec...\n');
  
  try {
    // Load OpenAPI spec
    console.log('1️⃣  Loading OpenAPI spec from:', OPENAPI_SPEC_PATH);
    const spec = loadOpenAPISpec();
    console.log(`   ✅ Loaded: ${spec.info.title} v${spec.info.version}`);
    console.log(`   📊 Found ${Object.keys(spec.paths).length} paths\n`);
    
    // Generate Postman collection
    console.log('2️⃣  Converting to Postman Collection...');
    const collection = generatePostmanCollection(spec);
    console.log(`   ✅ Generated ${collection.item.length} folders\n`);
    
    // Generate environment
    console.log('3️⃣  Generating Postman Environment...');
    const environment = generatePostmanEnvironment();
    console.log(`   ✅ Generated environment with ${environment.values.length} variables\n`);
    
    // Write files
    console.log('4️⃣  Writing files...');
    fs.writeFileSync(
      POSTMAN_COLLECTION_PATH,
      JSON.stringify(collection, null, 2)
    );
    console.log(`   ✅ Collection: ${POSTMAN_COLLECTION_PATH}`);
    
    fs.writeFileSync(
      POSTMAN_ENV_PATH,
      JSON.stringify(environment, null, 2)
    );
    console.log(`   ✅ Environment: ${POSTMAN_ENV_PATH}\n`);
    
    console.log('🎉 Postman Collection generated successfully!\n');
    console.log('📌 Next steps:');
    console.log('   1. Import collection: docs/smart-pocket.postman_collection.json');
    console.log('   2. Import environment: docs/smart-pocket.postman_environment.json');
    console.log('   3. Set your API key and server URL in the environment');
    console.log('   4. Use "Connect" endpoint to get bearer token\n');
    
  } catch (error) {
    console.error('❌ Error generating Postman collection:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generatePostmanCollection, generatePostmanEnvironment };
