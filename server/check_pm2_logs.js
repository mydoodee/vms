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
      let stdout = '', stderr = '';
      stream.on('close', (code) => {
        resolve({ stdout: stdout.trim(), stderr: stderr.trim(), code });
      });
      stream.on('data', d => stdout += d);
      stream.stderr.on('data', d => stderr += d);
    });
  });
}

conn.on('ready', async () => {
  console.log('⚡ Connected to production server...');
  try {
    console.log('--- CMAPI Out Log (last 40 lines) ---');
    const { stdout: outLog } = await sshExec(conn, 'tail -n 40 /var/www/html/cmapi/logs/out.log');
    console.log(outLog);

    console.log('\n--- CMAPI Error Log (last 40 lines) ---');
    const { stdout: errLog } = await sshExec(conn, 'tail -n 40 /var/www/html/cmapi/logs/error.log');
    console.log(errLog);

    console.log('\n--- AMS Server Out Log (last 20 lines) ---');
    const { stdout: vmsLog } = await sshExec(conn, 'tail -n 20 /var/www/html/vms/server/logs/out.log');
    console.log(vmsLog);
  } catch (err) {
    console.error('Error executing commands:', err);
  }
  conn.end();
}).on('error', (err) => {
  console.error('SSH Connection error:', err);
}).connect(config);
