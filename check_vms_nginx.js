const { Client } = require('ssh2');
const config = { host: 'app.spkconstruction.co.th', port: 22, username: 'root', password: 'Spk@dcem987' };
const conn = new Client();

function sshExec(conn, cmd) {
  return new Promise((res, rej) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return rej(err);
      let out = '';
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => res(out));
    });
  });
}

conn.on('ready', async () => {
  console.log('=== VMS/3055 in nginx ===');
  const nginxVms = await sshExec(conn, 'grep -n "vms" /etc/nginx/sites-enabled/default | head -20');
  console.log(nginxVms || 'NOT FOUND');

  console.log('\n=== Direct port 3055 health ===');
  const directHealth = await sshExec(conn, 'curl -s http://localhost:3055/api/health');
  console.log(directHealth);

  console.log('\n=== Via nginx /vms/api/health ===');
  const nginxHealth = await sshExec(conn, 'curl -sk https://app.spkconstruction.co.th/vms/api/health');
  console.log(nginxHealth);

  conn.end();
}).on('error', (err) => {
  console.error('SSH Error:', err.message);
}).connect(config);
