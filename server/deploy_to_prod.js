const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const config = {
  host: 'app.spkconstruction.co.th',
  port: 22,
  username: 'root',
  password: 'Spk@dcem987'
};

const conn = new Client();

async function runSshCommand(connection, command) {
  return new Promise((resolve, reject) => {
    connection.exec(command, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });
      stream.on('data', data => stdout += data);
      stream.stderr.on('data', data => stderr += data);
    });
  });
}

async function ensureRemoteDir(sftp, remoteDir) {
  const parts = remoteDir.split('/');
  let current = '';
  for (const part of parts) {
    if (!part) continue;
    current += '/' + part;
    try {
      await new Promise((resolve, reject) => {
        sftp.mkdir(current, (err) => {
          // Ignore error if it already exists
          resolve();
        });
      });
    } catch (e) {}
  }
}

async function uploadDir(sftp, localDir, remoteDir) {
  await ensureRemoteDir(sftp, remoteDir);

  const entries = fs.readdirSync(localDir, { withFileTypes: true });

  for (const entry of entries) {
    const localPath = path.join(localDir, entry.name);
    const remotePath = remoteDir + '/' + entry.name;

    if (entry.isDirectory()) {
      if (['node_modules', 'uploads', '.git', 'logs', 'scratch', 'dist-temp'].includes(entry.name)) {
        continue;
      }
      await uploadDir(sftp, localPath, remotePath);
    } else {
      if (['scratch_deploy.js', 'deploy_to_prod.js', 'test_delete.ps1', 'inspect_server.js'].includes(entry.name)) {
        continue;
      }
      console.log(`Uploading: ${entry.name}`);
      await new Promise((resolve, reject) => {
        sftp.fastPut(localPath, remotePath, (err) => {
          if (err) {
            console.error(`❌ Fail upload: ${entry.name}`, err.message);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  }
}

conn.on('ready', async () => {
  console.log('⚡ Connected via SSH. Starting deployment process (under /vms)...');
  
  try {
    conn.sftp(async (err, sftp) => {
      if (err) throw err;
      
      // 1. Upload Backend Files to /vms/server
      console.log('\n--- UPLOADING BACKEND FILES ---');
      const localBackendDir = path.join(__dirname);
      const remoteBackendDir = '/var/www/html/vms/server';
      await uploadDir(sftp, localBackendDir, remoteBackendDir);
      console.log('✅ Backend upload complete!');

      // Create uploads directory remote if not exists
      await ensureRemoteDir(sftp, remoteBackendDir + '/uploads');
      await ensureRemoteDir(sftp, remoteBackendDir + '/logs');
      console.log('✅ Remote directories verified.');

      // 2. Upload Frontend built dist Files to /vms/client-admin/dist
      console.log('\n--- UPLOADING FRONTEND BUILT FILES ---');
      const localFrontendDir = path.join(__dirname, '..', 'client-admin', 'dist');
      const remoteFrontendDir = '/var/www/html/vms/client-admin/dist';
      await uploadDir(sftp, localFrontendDir, remoteFrontendDir);
      console.log('✅ Frontend upload complete!');

      // 3. Edit Nginx Configuration back to /vms
      console.log('\n--- CONFIGURING NGINX ---');
      const nginxRes = await runSshCommand(conn, 'cat /etc/nginx/sites-available/default');
      if (nginxRes.code !== 0) throw new Error('Cannot read Nginx configuration');
      
      let nginxConf = nginxRes.stdout;
      
      // Replace /ams occurrences back to /vms
      nginxConf = nginxConf.replace(/\/ams\//g, '/vms/');
      nginxConf = nginxConf.replace(/\/ams\b/g, '/vms');

      // Write Nginx config remotely
      console.log('Writing updated Nginx configuration...');
      await new Promise((resolve, reject) => {
        const stream = sftp.createWriteStream('/etc/nginx/sites-available/default');
        stream.on('close', resolve);
        stream.on('error', reject);
        stream.write(nginxConf);
        stream.end();
      });

      // Test and reload Nginx
      const nginxTest = await runSshCommand(conn, 'nginx -t');
      console.log('Nginx config check:', nginxTest.stderr);
      if (nginxTest.code === 0) {
        await runSshCommand(conn, 'systemctl reload nginx');
        console.log('✅ Nginx configuration reloaded successfully!');
      } else {
        console.error('❌ Nginx config test FAILED!');
      }

      // 4. Edit ecosystem.config.js
      console.log('\n--- CONFIGURING PM2 ECOSYSTEM ---');
      const ecoRes = await runSshCommand(conn, 'cat /var/www/html/timesnap/ecosystem.config.js');
      if (ecoRes.code === 0) {
        let ecoConf = ecoRes.stdout;
        
        const newVmsAppBlock = `{
            name: 'vms',
            script: 'server.js',
            cwd: '/var/www/html/vms/server',
            instances: 1,
            exec_mode: 'fork',
            env: {
                NODE_ENV: 'production',
                PORT: 3055,
                DB_HOST: '192.168.1.146',
                DB_USER: 'spk2024',
                DB_PASSWORD: 'Password@99',
                DB_NAME: 'spk_qcar',
                DB_PORT: '27019',
                JWT_SECRET: 'vms_jwt_secret_spk2024_very_secure_key',
                JWT_EXPIRES_IN: '24h',
                UPLOAD_LIMIT: '300',
                UPLOAD_PATH: './uploads',
                LOGGING_ENABLED: 'true'
            },
            watch: false,
            max_memory_restart: '1G',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            error_file: '/var/www/html/vms/server/logs/error.log',
            out_file: '/var/www/html/vms/server/logs/out.log',
            combine_logs: true,
            time: true,
            autorestart: true,
        }`;
        
        ecoConf = ecoConf.replace(/\{\s*name:\s*'(timesnap|ams)'[\s\S]*?combine_logs:\s*true,[\s\S]*?time:\s*true,[\s\S]*?autorestart:\s*true,\s*\}/, newVmsAppBlock);
        
        if (!ecoConf.includes("'vms'")) {
          ecoConf = ecoConf.replace(/name:\s*'(timesnap|ams)'/g, "name: 'vms'");
          ecoConf = ecoConf.replace(/cwd:\s*'\/var\/www\/html\/(timesnap|ams\/server)'/g, "cwd: '/var/www/html/vms/server'");
          ecoConf = ecoConf.replace(/error_file:\s*'\/var\/www\/html\/(timesnap|ams\/server)\/logs\/error\.log'/g, "error_file: '/var/www/html/vms/server/logs/error.log'");
          ecoConf = ecoConf.replace(/out_file:\s*'\/var\/www\/html\/(timesnap|ams\/server)\/logs\/out\.log'/g, "out_file: '/var/www/html/vms/server/logs/out.log'");
        }

        await new Promise((resolve, reject) => {
          const stream = sftp.createWriteStream('/var/www/html/timesnap/ecosystem.config.js');
          stream.on('close', resolve);
          stream.on('error', reject);
          stream.write(ecoConf);
          stream.end();
        });
        console.log('✅ ecosystem.config.js updated successfully!');
      }

      // 5. Install Remote Node Modules
      console.log('\n--- INSTALLING NODE MODULES ON SERVER ---');
      console.log('Running npm install...');
      const npmInstall = await runSshCommand(conn, 'cd /var/www/html/vms/server && npm install --omit=dev');
      console.log(npmInstall.stdout);
      console.log('✅ Remote node modules installed!');

      // 6. PM2 Start / Restart
      console.log('\n--- PM2 START VMS APP ---');
      await runSshCommand(conn, 'pm2 delete timesnap 2>/dev/null || true');
      await runSshCommand(conn, 'pm2 delete ams 2>/dev/null || true');
      const pm2Res = await runSshCommand(conn, 'pm2 start /var/www/html/timesnap/ecosystem.config.js --only vms || pm2 restart vms');
      console.log(pm2Res.stdout);
      await runSshCommand(conn, 'pm2 save');
      console.log('✅ PM2 Process list updated and VMS application started.');

      console.log('\n--- FIXING REMOTE FILE PERMISSIONS ---');
      await runSshCommand(conn, 'chmod -R 755 /var/www/html/vms && chown -R www-data:www-data /var/www/html/vms');
      console.log('✅ Remote permissions fixed!');

      console.log('\n🎉 DEPLOYMENT FINISHED SUCCESSFULLY!');
      conn.end();
    });
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    conn.end();
  }
});

conn.connect(config);
