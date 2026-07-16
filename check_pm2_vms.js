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
  console.log('=== PM2 show vms ===');
  const showVms = await sshExec(conn, 'pm2 show vms');
  console.log(showVms);

  console.log('=== PM2 list ===');
  const pm2List = await sshExec(conn, 'pm2 list');
  console.log(pm2List);

  conn.end();
}).on('error', (err) => {
  console.error('SSH Error:', err.message);
}).connect(config);
