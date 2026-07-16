const { Client } = require('ssh2');
const config = { host: 'app.spkconstruction.co.th', port: 22, username: 'root', password: 'Spk@dcem987' };
const conn = new Client();

function sshExec(conn, cmd) {
  return new Promise((res, rej) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => res(out));
    });
  });
}

conn.on('ready', async () => {
  console.log('=== VMS error.log ===');
  const errorLog = await sshExec(conn, 'tail -n 40 /var/www/html/vms/server/logs/error.log');
  console.log(errorLog || '(empty)');

  console.log('\n=== VMS out.log ===');
  const outLog = await sshExec(conn, 'tail -n 40 /var/www/html/vms/server/logs/out.log');
  console.log(outLog || '(empty)');

  console.log('\n=== Localhost version check ===');
  const ver = await sshExec(conn, 'curl -s http://localhost:3055/api/app/version');
  console.log(ver || '(empty)');

  conn.end();
}).on('error', (err) => {
  console.error('SSH Error:', err.message);
}).connect(config);
