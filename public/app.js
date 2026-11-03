/**
 * CloudOps Portal Frontend Script
 * Interactivity, Dynamic Fetching, & Tab Switching
 */

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    loadPipelineData();
    loadMetricsData();
    loadHealthData();

    document.getElementById('refresh-pipeline-btn')?.addEventListener('click', loadPipelineData);
    document.getElementById('refresh-metrics-btn')?.addEventListener('click', loadMetricsData);

    // Initial test runner call for API Explorer
    testEndpoint('/api/health');

    // Auto-update metrics periodically
    setInterval(loadMetricsData, 10000);
});

// Tab Switching
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// Fetch Pipeline Status
async function loadPipelineData() {
    try {
        const res = await fetch('/api/pipeline');
        const data = await res.json();

        const container = document.getElementById('pipeline-stages-list');
        if (!container) return;

        container.innerHTML = '';

        data.stages.forEach((stage, idx) => {
            const card = document.createElement('div');
            card.className = 'stage-card stage-success';
            card.innerHTML = `
                <div class="stage-num">STAGE 0${stage.id}</div>
                <div class="stage-name">${stage.name}</div>
                <div class="stage-status"><span>✓</span> ${stage.status}</div>
                <div class="stage-duration">${stage.duration}</div>
            `;
            container.appendChild(card);

            if (idx < data.stages.length - 1) {
                const connector = document.createElement('div');
                connector.className = 'stage-connector';
                connector.textContent = '➔';
                container.appendChild(connector);
            }
        });

        const buildKpi = document.getElementById('kpi-build');
        if (buildKpi) {
            buildKpi.textContent = `BUILD #${data.buildNumber} ${data.status}`;
        }
    } catch (err) {
        console.error('Failed to load pipeline data:', err);
    }
}

// Fetch Metrics
async function loadMetricsData() {
    try {
        const res = await fetch('/api/metrics');
        const data = await res.json();

        // Memory
        const memPct = document.getElementById('metric-mem-pct');
        const memBar = document.getElementById('metric-mem-bar');
        const memDetail = document.getElementById('metric-mem-detail');

        if (memPct) memPct.textContent = `${data.memoryUsagePercent}%`;
        if (memBar) memBar.style.width = `${data.memoryUsagePercent}%`;
        if (memDetail) {
            const usedMb = Math.round(data.usedMemoryBytes / 1024 / 1024);
            const totalMb = Math.round(data.totalMemoryBytes / 1024 / 1024);
            memDetail.textContent = `Used: ${usedMb.toLocaleString()} MB / Total: ${totalMb.toLocaleString()} MB`;
        }

        // CPU
        const cpuCount = document.getElementById('metric-cpu-count');
        const cpuModel = document.getElementById('metric-cpu-model');
        const arch = document.getElementById('metric-arch');

        if (cpuCount) cpuCount.textContent = `${data.cpuCount} Cores`;
        if (cpuModel) cpuModel.textContent = data.cpuModel;
        if (arch) arch.textContent = `Architecture: ${data.platform} (${data.arch})`;

        // Uptime & Host
        const uptime = document.getElementById('metric-uptime');
        const hostname = document.getElementById('metric-hostname');
        const os = document.getElementById('metric-os');

        if (uptime) uptime.textContent = `${data.appUptimeSeconds}s`;
        if (hostname) hostname.textContent = `Host: ${data.hostname}`;
        if (os) os.textContent = `OS: ${data.platform}`;

    } catch (err) {
        console.error('Failed to load metrics:', err);
    }
}

// Fetch Health
async function loadHealthData() {
    try {
        const res = await fetch('/api/health');
        const data = await res.json();

        const healthEl = document.getElementById('kpi-health');
        const uptimeEl = document.getElementById('kpi-uptime');

        if (healthEl) healthEl.textContent = `${data.status.toUpperCase()} (${data.statusCode})`;
        if (uptimeEl) uptimeEl.textContent = `App Uptime: ${data.uptime}s • v${data.version}`;
    } catch (err) {
        console.error('Failed to load health:', err);
    }
}

// REST API Tester
async function testEndpoint(endpoint) {
    const titleEl = document.getElementById('api-active-endpoint');
    const codeEl = document.getElementById('api-response-code');

    if (titleEl) titleEl.textContent = `GET ${endpoint} (Executing...)`;
    if (codeEl) codeEl.textContent = '// Sending HTTP request...';

    const t0 = performance.now();
    try {
        const res = await fetch(endpoint);
        const json = await res.json();
        const duration = Math.round(performance.now() - t0);

        if (titleEl) {
            titleEl.textContent = `GET ${endpoint} (HTTP ${res.status} OK • ${duration}ms)`;
        }
        if (codeEl) {
            codeEl.textContent = JSON.stringify(json, null, 2);
        }
    } catch (err) {
        if (titleEl) titleEl.textContent = `GET ${endpoint} (Error)`;
        if (codeEl) codeEl.textContent = `Error fetching endpoint: ${err.message}`;
    }
}
window.testEndpoint = testEndpoint;

