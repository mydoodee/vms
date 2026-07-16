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
  console.log('=== Full VMS nginx block (lines 14-50) ===');
  const out = await sshExec(conn, 'sed -n "14,55p" /etc/nginx/sites-enabled/default');
  console.log(out);

  console.log('\n=== VMS nginx block second occurrence (lines 100-140) ===');
  const out2 = await sshExec(conn, 'sed -n "100,145p" /etc/nginx/sites-enabled/default');
  console.log(out2);

  console.log('\n=== Nginx error log (last 20 lines) ===');
  const errLog = await sshExec(conn, 'tail -n 20 /var/log/nginx/error.log');
  console.log(errLog);

  conn.end();
}).on('error', (err) => {
  console.error('SSH Error:', err.message);
}).connect(config);
