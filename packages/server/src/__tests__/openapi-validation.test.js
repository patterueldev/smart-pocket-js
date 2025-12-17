/**
 * OpenAPI Specification Validation Tests
 * 
 * Ensures that:
 * 1. All implemented routes are documented in the OpenAPI spec
 * 2. All documented routes are actually implemented
 * 3. HTTP methods match between implementation and documentation
 * 
 * This prevents documentation drift and catches missing endpoints early.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const app = require('../app');

// Helper to extract all routes from Express app
function extractExpressRoutes(expressApp) {
  const routes = [];
  
  function extractRoutes(stack, prefix = '') {
    stack.forEach(middleware => {
      if (middleware.route) {
        // Regular route
        const path = prefix + middleware.route.path;
        const methods = Object.keys(middleware.route.methods)
          .filter(method => middleware.route.methods[method])
          .map(m => m.toUpperCase());
        
        methods.forEach(method => {
          routes.push({
            method,
            path: path.replace(/\/$/, ''), // Remove trailing slash
            fullPath: path
          });
        });
      } else if (middleware.name === 'router' && middleware.handle.stack) {
        // Nested router
        const routerPath = middleware.regexp.source
          .replace('\\/?', '')
          .replace('(?=\\/|$)', '')
          .replace(/\\\//g, '/')
          .replace(/\^/g, '')
          .replace(/\$/g, '')
          .replace(/\?\(\?=.*?\)/g, '');
        
        extractRoutes(middleware.handle.stack, prefix + routerPath);
      }
    });
  }
  
  extractRoutes(expressApp._router.stack);
  return routes;
}

// Helper to extract routes from OpenAPI spec
function extractOpenAPIRoutes(specPath) {
  const specContent = fs.readFileSync(specPath, 'utf8');
  const spec = yaml.load(specContent);
  const routes = [];
  
  if (!spec.paths) {
    return routes;
  }
  
  Object.entries(spec.paths).forEach(([path, pathItem]) => {
    Object.entries(pathItem).forEach(([method, operation]) => {
      if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
        routes.push({
          method: method.toUpperCase(),
          path: path,
          operation: operation
        });
      }
    });
  });
  
  return routes;
}

// Helper to normalize paths for comparison
function normalizePath(path) {
  return path
    .replace(/\/$/, '') // Remove trailing slash
    .replace(/:(\w+)/g, '{$1}') // Convert :id to {id}
    .replace(/^\/api\/v1/, ''); // Remove API version prefix for comparison
}

// Helper to match paths (handles parameters)
function pathsMatch(implPath, specPath) {
  const normalizedImpl = normalizePath(implPath);
  const normalizedSpec = normalizePath(specPath);
  return normalizedImpl === normalizedSpec;
}

describe('OpenAPI Specification Validation', () => {
  let implementedRoutes;
  let documentedRoutes;
  const specPath = path.join(__dirname, '../../../../docs/api-spec.yaml');
  
  beforeAll(() => {
    implementedRoutes = extractExpressRoutes(app);
    documentedRoutes = extractOpenAPIRoutes(specPath);
    
    // Filter out internal Express routes (error handlers, etc.)
    implementedRoutes = implementedRoutes.filter(route => {
      return !route.path.includes('*') && 
             route.path !== '' &&
             route.path !== '/' &&
             !route.path.includes('undefined');
    });
  });
  
  describe('Route Implementation Coverage', () => {
    it('should have all documented routes implemented', () => {
      const missingRoutes = [];
      
      documentedRoutes.forEach(docRoute => {
        const found = implementedRoutes.some(implRoute => 
          pathsMatch(implRoute.path, docRoute.path) && 
          implRoute.method === docRoute.method
        );
        
        if (!found) {
          missingRoutes.push(`${docRoute.method} ${docRoute.path}`);
        }
      });
      
      if (missingRoutes.length > 0) {
        console.error('\n❌ Routes documented but not implemented:');
        missingRoutes.forEach(route => console.error(`  - ${route}`));
      }
      
      expect(missingRoutes).toEqual([]);
    });
    
    it('should have all implemented routes documented', () => {
      const undocumentedRoutes = [];
      
      // Skip health endpoints and auth endpoints as they might not need full OpenAPI docs
      const routesToCheck = implementedRoutes.filter(route => {
        // Include routes that should be documented
        return route.path.startsWith('/api/v1/') && 
               !route.path.includes('/health');
      });
      
      routesToCheck.forEach(implRoute => {
        const found = documentedRoutes.some(docRoute => 
          pathsMatch(implRoute.path, docRoute.path) && 
          implRoute.method === docRoute.method
        );
        
        if (!found) {
          undocumentedRoutes.push(`${implRoute.method} ${implRoute.path}`);
        }
      });
      
      if (undocumentedRoutes.length > 0) {
        console.error('\n❌ Routes implemented but not documented:');
        undocumentedRoutes.forEach(route => console.error(`  - ${route}`));
        console.error('\nAdd these routes to docs/api-spec.yaml');
      }
      
      expect(undocumentedRoutes).toEqual([]);
    });
  });
  
  describe('HTTP Method Validation', () => {
    it('should have matching HTTP methods for all routes', () => {
      const methodMismatches = [];
      
      documentedRoutes.forEach(docRoute => {
        const implRoute = implementedRoutes.find(r => 
          pathsMatch(r.path, docRoute.path) && r.method === docRoute.method
        );
        
        if (!implRoute) {
          methodMismatches.push({
            path: docRoute.path,
            documented: docRoute.method,
            implemented: 'NOT FOUND'
          });
        }
      });
      
      if (methodMismatches.length > 0) {
        console.error('\n❌ HTTP method mismatches:');
        methodMismatches.forEach(mismatch => {
          console.error(`  - ${mismatch.path}: documented as ${mismatch.documented}, but not implemented`);
        });
      }
      
      expect(methodMismatches).toEqual([]);
    });
  });
  
  describe('Route Path Validation', () => {
    it('should use consistent parameter naming (:{param} vs {param})', () => {
      const inconsistentParams = [];
      
      implementedRoutes.forEach(route => {
        const implParams = (route.path.match(/:\w+/g) || []).map(p => p.slice(1));
        
        const docRoute = documentedRoutes.find(r => 
          pathsMatch(r.path, route.path) && r.method === route.method
        );
        
        if (docRoute) {
          const docParams = (docRoute.path.match(/\{(\w+)\}/g) || []).map(p => p.slice(1, -1));
          
          // Check if parameter names match
          const implSet = new Set(implParams);
          const docSet = new Set(docParams);
          
          if (implParams.length !== docParams.length || 
              ![...implSet].every(p => docSet.has(p))) {
            inconsistentParams.push({
              path: route.path,
              implemented: implParams,
              documented: docParams
            });
          }
        }
      });
      
      if (inconsistentParams.length > 0) {
        console.error('\n❌ Parameter naming inconsistencies:');
        inconsistentParams.forEach(issue => {
          console.error(`  - ${issue.path}:`);
          console.error(`    Implemented: ${issue.implemented.join(', ') || 'none'}`);
          console.error(`    Documented: ${issue.documented.join(', ') || 'none'}`);
        });
      }
      
      expect(inconsistentParams).toEqual([]);
    });
  });
  
  describe('OpenAPI Spec Structure', () => {
    it('should have valid OpenAPI 3.0 structure', () => {
      const specContent = fs.readFileSync(specPath, 'utf8');
      const spec = yaml.load(specContent);
      
      expect(spec).toHaveProperty('openapi');
      expect(spec.openapi).toMatch(/^3\.0\./);
      expect(spec).toHaveProperty('info');
      expect(spec).toHaveProperty('paths');
      expect(spec).toHaveProperty('components');
    });
    
    it('should have all endpoints documented with required fields', () => {
      const specContent = fs.readFileSync(specPath, 'utf8');
      const spec = yaml.load(specContent);
      
      const incompleteEndpoints = [];
      
      Object.entries(spec.paths).forEach(([path, pathItem]) => {
        Object.entries(pathItem).forEach(([method, operation]) => {
          if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
            if (!operation.summary) {
              incompleteEndpoints.push(`${method.toUpperCase()} ${path}: missing summary`);
            }
            if (!operation.responses) {
              incompleteEndpoints.push(`${method.toUpperCase()} ${path}: missing responses`);
            }
            // Check for 200-level success response
            const hasSuccessResponse = operation.responses && 
              Object.keys(operation.responses).some(code => code.startsWith('2'));
            if (!hasSuccessResponse) {
              incompleteEndpoints.push(`${method.toUpperCase()} ${path}: missing success response`);
            }
          }
        });
      });
      
      if (incompleteEndpoints.length > 0) {
        console.error('\n⚠️  Incomplete endpoint documentation:');
        incompleteEndpoints.forEach(issue => console.error(`  - ${issue}`));
      }
      
      expect(incompleteEndpoints).toEqual([]);
    });
  });
  
  describe('Debugging Information', () => {
    it('should log all implemented routes (for reference)', () => {
      console.log('\n📋 Implemented Routes:');
      implementedRoutes
        .sort((a, b) => a.path.localeCompare(b.path))
        .forEach(route => {
          console.log(`  ${route.method.padEnd(7)} ${route.path}`);
        });
      
      console.log(`\nTotal: ${implementedRoutes.length} routes`);
    });
    
    it('should log all documented routes (for reference)', () => {
      console.log('\n📋 Documented Routes (OpenAPI):');
      documentedRoutes
        .sort((a, b) => a.path.localeCompare(b.path))
        .forEach(route => {
          console.log(`  ${route.method.padEnd(7)} ${route.path}`);
        });
      
      console.log(`\nTotal: ${documentedRoutes.length} routes`);
    });
  });
});
