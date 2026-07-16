const { Client } = require('ssh2');

const config = {
  host: 'app.spkconstruction.co.th',
  port: 22,
  username: 'root',
  password: 'Spk@dcem987'
};

const conn = new Client();

function sshExec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => resolve(out));
    });
  });
}

conn.on('ready', async () => {
  console.log('=== VMS .env file ===');
  const env = await sshExec(conn, 'cat /var/www/html/vms/server/.env 2>/dev/null || echo "NO .env FOUND"');
  console.log(env);

  console.log('\n=== NGINX sites-enabled ===');
  const nginxFiles = await sshExec(conn, 'ls /etc/nginx/sites-enabled/');
  console.log(nginxFiles);

  console.log('\n=== NGINX VMS proxy config ===');
  const nginxVms = await sshExec(conn, 'grep -r "vms" /etc/nginx/sites-enabled/ 2>/dev/null | head -30');
  console.log(nginxVms);

  console.log('\n=== PM2 VMS env vars ===');
  const pm2env = await sshExec(conn, 'pm2 env 23 2>/dev/null | grep -i "port\\|url\\|host" | head -20');
  console.log(pm2env);

  console.log('\n=== server.js port config ===');
  const serverJs = await sshExec(conn, 'head -30 /var/www/html/vms/server/server.js');
  console.log(serverJs);

  conn.end();
}).on('error', (err) => {
  console.error('SSH Error:', err.message);
}).connect(config);
