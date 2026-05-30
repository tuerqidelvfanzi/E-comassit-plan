/**
 * 触发 API 上的批量采集任务（Playwright 在 API 服务内运行）
 *
 * 用法：
 *   API_URL=http://127.0.0.1:8080 TOKEN=<jwt> npx tsx src/cli.ts run <batchJobId>
 */
const apiUrl = (process.env.API_URL ?? 'http://127.0.0.1:8080').replace(/\/+$/, '');
const token = process.env.TOKEN ?? '';

const [cmd, jobId] = process.argv.slice(2);

async function main() {
  if (cmd !== 'run' || !jobId) {
    console.log('Usage: TOKEN=... API_URL=... npx tsx src/cli.ts run <batchJobId>');
    process.exit(1);
  }
  const res = await fetch(`${apiUrl}/api/v1/collect-jobs/batch/${jobId}/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const json = await res.json();
  console.log(json);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
