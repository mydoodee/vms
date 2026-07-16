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
  console.log('=== Restarting VMS PM2 ===');
  const restartRes = await sshExec(conn, 'pm2 restart vms');
  console.log(restartRes);

  console.log('=== Checking Localhost 3055 version response again ===');
  const versionRes = await sshExec(conn, 'curl -s http://localhost:3055/api/app/version');
  console.log(versionRes);

  conn.end();
}).on('error', (err) => {
  console.error('SSH Error:', err.message);
}).connect(config);
