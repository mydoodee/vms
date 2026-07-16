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
  console.log('=== VMS PM2 Status ===');
  const status = await sshExec(conn, 'pm2 show vms');
  console.log(status);

  console.log('=== PM2 logs (last 30 lines) ===');
  const logs = await sshExec(conn, 'pm2 logs vms --lines 30 --no-daemon');
  console.log(logs);

  conn.end();
}).on('error', (err) => {
  console.error('SSH Error:', err.message);
}).connect(config);
