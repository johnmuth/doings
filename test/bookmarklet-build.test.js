const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const vm = require('vm');
const { JSDOM } = require('jsdom');

describe('Bookmarklet Build Verification', () => {
  it('should compile bookmarklet into dist/bookmarklet.min.js without syntax errors', () => {
    const rootDir = path.resolve(__dirname, '..');
    const scriptPath = path.join(rootDir, 'scripts', 'build-bookmarklet.sh');
    const distPath = path.join(rootDir, 'bookmarklet', 'dist', 'bookmarklet.min.js');

    const testUrl = 'https://script.google.com/macros/s/TEST_DEPLOYMENT_12345/exec';
    execSync(`"${scriptPath}" "${testUrl}"`, { stdio: 'pipe' });

    assert.ok(fs.existsSync(distPath), 'dist/bookmarklet.min.js should exist');
    const minified = fs.readFileSync(distPath, 'utf8').trim();

    assert.ok(minified.startsWith('javascript:'), 'Bookmarklet must start with javascript:');
    assert.ok(minified.includes('TEST_DEPLOYMENT_12345'), 'Bookmarklet must contain the injected webhook URL');

    // Extract the JS code without javascript: prefix and test syntax execution in sandbox
    const jsCode = minified.slice('javascript:'.length);

    // Verify it parses as valid JavaScript without throwing SyntaxError
    assert.doesNotThrow(() => {
      new vm.Script(jsCode);
    }, 'Minified JavaScript should be syntactically valid');

    // Run in a mock browser environment
    const dom = new JSDOM(`<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>`, {
      url: 'https://example.com/test'
    });

    let fetchCalled = false;
    let fetchPayload = null;

    dom.window.fetch = async (url, options) => {
      fetchCalled = true;
      fetchPayload = JSON.parse(options.body);
      return { ok: true, json: async () => ({ status: 'success' }) };
    };

    const context = vm.createContext(dom.window);
    assert.doesNotThrow(() => {
      vm.runInContext(jsCode, context);
    }, 'Bookmarklet should execute in browser window context without errors');
  });
});
