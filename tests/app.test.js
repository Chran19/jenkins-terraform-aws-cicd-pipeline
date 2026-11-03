/**
 * Automated Unit & Integration Tests for Cloud DevOps Application
 * In-memory test execution using stream.Writable for full Node.js HTTP stream compatibility
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { Readable, Writable } = require('stream');
const server = require('../server');

class MockResponse extends Writable {
    constructor(resolve) {
        super();
        this.resolve = resolve;
        this.statusCode = 200;
        this.headers = {};
        this.chunks = [];
    }

    setHeader(name, val) {
        this.headers[name.toLowerCase()] = val;
    }

    writeHead(code, headers = {}) {
        this.statusCode = code;
        for (const [k, v] of Object.entries(headers)) {
            this.headers[k.toLowerCase()] = v;
        }
    }

    _write(chunk, encoding, callback) {
        this.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        callback();
    }

    end(chunk) {
        if (chunk) {
            this.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        super.end();
        const rawBody = Buffer.concat(this.chunks).toString('utf8');
        let parsed = rawBody;
        try {
            parsed = JSON.parse(rawBody);
        } catch {
            parsed = rawBody;
        }
        this.resolve({
            statusCode: this.statusCode,
            headers: this.headers,
            body: parsed
        });
    }
}

function testRequest({ method = 'GET', url = '/', headers = {} }) {
    return new Promise((resolve) => {
        const req = new Readable({
            read() {
                this.push(null);
            }
        });
        req.method = method;
        req.url = url;
        req.headers = { host: 'localhost:3000', ...headers };

        const res = new MockResponse(resolve);
        server.emit('request', req, res);
    });
}

describe('DevOps Cloud Monitor API & Integration Test Suite', () => {
    test('1. Static Dashboard Delivery: GET / should return 200 and text/html', async () => {
        const res = await testRequest({ url: '/' });
        assert.strictEqual(res.statusCode, 200);
        assert.match(res.headers['content-type'], /text\/html/);
        assert.ok(typeof res.body === 'string' && res.body.includes('CloudOps Telemetry Portal'));
    });

    test('2. Health Check API: GET /api/health should return 200 with status "healthy"', async () => {
        const res = await testRequest({ url: '/api/health' });
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.status, 'healthy');
        assert.strictEqual(res.body.statusCode, 200);
        assert.ok(res.body.timestamp);
        assert.strictEqual(typeof res.body.uptime, 'number');
    });

    test('3. System Metrics API: GET /api/metrics should return valid CPU and Memory metrics', async () => {
        const res = await testRequest({ url: '/api/metrics' });
        assert.strictEqual(res.statusCode, 200);
        assert.ok(res.body.cpuCount > 0);
        assert.ok(typeof res.body.totalMemoryBytes === 'number');
        assert.ok(res.body.memoryUsagePercent >= 0 && res.body.memoryUsagePercent <= 100);
        assert.ok(res.body.platform);
    });

    test('4. Jenkins Pipeline API: GET /api/pipeline should return 10 successful stages', async () => {
        const res = await testRequest({ url: '/api/pipeline' });
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.status, 'SUCCESS');
        assert.strictEqual(Array.isArray(res.body.stages), true);
        assert.strictEqual(res.body.stages.length, 10);
        
        for (const stage of res.body.stages) {
            assert.strictEqual(stage.status, 'SUCCESS');
        }
    });

    test('5. Infrastructure IaC API: GET /api/infrastructure should return AWS EC2 resource telemetry', async () => {
        const res = await testRequest({ url: '/api/infrastructure' });
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.provider, 'AWS');
        assert.strictEqual(res.body.resources.state, 'running');
        assert.ok(res.body.resources.instanceId.startsWith('i-'));
        assert.deepStrictEqual(res.body.resources.openPorts, [22, 80, 443, 3000]);
        assert.strictEqual(res.body.resources.tags.ManagedBy, 'Terraform');
    });

    test('6. Project Metadata API: GET /api/info should contain CNAD CA-2 course and rubric information', async () => {
        const res = await testRequest({ url: '/api/info' });
        assert.strictEqual(res.statusCode, 200);
        assert.ok(res.body.rubricCriteria.length >= 5);
        assert.ok(res.body.technologies.includes('Jenkins'));
        assert.ok(res.body.technologies.includes('Terraform'));
    });

    test('7. 404 Handler: GET /api/unknown-endpoint should return 404 with JSON error object', async () => {
        const res = await testRequest({ url: '/api/unknown-endpoint' });
        assert.strictEqual(res.statusCode, 404);
        assert.strictEqual(res.body.error, 'Not Found');
        assert.ok(Array.isArray(res.body.availableEndpoints));
    });
});
