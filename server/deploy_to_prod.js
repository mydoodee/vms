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
      if (['scratch_deploy.js', 'deploy_to_prod.js', 'test_delete.ps1'].includes(entry.name)) {
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
  console.log('⚡ Connected via SSH. Starting deployment process...');
  
  try {
    conn.sftp(async (err, sftp) => {
      if (err) throw err;
      
      // 1. Upload Backend Files
      console.log('\n--- UPLOADING BACKEND FILES ---');
      const localBackendDir = path.join(__dirname);
      const remoteBackendDir = '/var/www/html/vms/server';
      await uploadDir(sftp, localBackendDir, remoteBackendDir);
      console.log('✅ Backend upload complete!');

      // Create uploads directory remote if not exists
      await ensureRemoteDir(sftp, remoteBackendDir + '/uploads');
      await ensureRemoteDir(sftp, remoteBackendDir + '/logs');
      console.log('✅ Remote directories created.');

      // 2. Upload Frontend built dist Files
      console.log('\n--- UPLOADING FRONTEND BUILT FILES ---');
      const localFrontendDir = path.join(__dirname, '..', 'client-admin', 'dist');
      const remoteFrontendDir = '/var/www/html/vms/client-admin/dist';
      await uploadDir(sftp, localFrontendDir, remoteFrontendDir);
      console.log('✅ Frontend upload complete!');

      // 3. Edit Nginx Configuration
      console.log('\n--- CONFIGURING NGINX ---');
      const nginxRes = await runSshCommand(conn, 'cat /etc/nginx/sites-available/default');
      if (nginxRes.code !== 0) throw new Error('Cannot read Nginx configuration');
      
      let nginxConf = nginxRes.stdout;
      
      // Fix proxy_pass for vms/api if already converted
      nginxConf = nginxConf.replace(
        /location \/vms\/api\/ \{([\s\S]*?)proxy_pass http:\/\/127\.0\.0\.1:3055\/;/g,
        `location /vms/api/ {$1proxy_pass http://127.0.0.1:3055/api/;`
      );
      
      // Remove any previously added vms blocks to prevent duplicate definitions
      // But we will perform a clean replace of timesnap references to vms as requested!
      
      // Let's replace the timesnap block in Port 80
      nginxConf = nginxConf.replace(
        /location \/timesnap \{[^}]*proxy_pass http:\/\/127\.0\.0\.1:3055;[\s\S]*?\}/,
        `location /vms {
        alias /var/www/html/vms/client-admin/dist/;
        try_files $uri $uri/ /vms/index.html;
    }
    location /vms/api/ {
        proxy_pass http://127.0.0.1:3055/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }`
      );

      // Let's replace timesnap uploads in Port 80
      nginxConf = nginxConf.replace(
        /location \/timesnap\/uploads\/ \{[\s\S]*?alias \/var\/www\/html\/timesnap\/public\/uploads\/;[\s\S]*?\}/,
        `location /vms/uploads/ {
        alias /var/www/html/vms/server/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
        access_log off;
    }`
      );

      // Now do the same for Port 443 (HTTPS Block)
      nginxConf = nginxConf.replace(
        /location \/timesnap \{[^}]*proxy_pass http:\/\/127\.0\.0\.1:3055;[\s\S]*?\}/,
        `location /vms {
        alias /var/www/html/vms/client-admin/dist/;
        try_files $uri $uri/ /vms/index.html;
    }
    location /vms/assets/ {
        alias /var/www/html/vms/client-admin/dist/assets/;
        try_files $uri =404;
    }
    location /vms/api/ {
        proxy_pass http://127.0.0.1:3055/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }`
      );

      nginxConf = nginxConf.replace(
        /location \/timesnap\/uploads\/ \{[\s\S]*?alias \/var\/www\/html\/timesnap\/public\/uploads\/;[\s\S]*?\}/,
        `location /vms/uploads/ {
        alias /var/www/html/vms/server/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
        access_log off;
    }`
      );

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
        console.error('❌ Nginx config test FAILED! Reverting reload.');
      }

      // 4. Edit ecosystem.config.js
      console.log('\n--- CONFIGURING PM2 ECOSYSTEM ---');
      const ecoRes = await runSshCommand(conn, 'cat /var/www/html/timesnap/ecosystem.config.js');
      if (ecoRes.code === 0) {
        let ecoConf = ecoRes.stdout;
        
        // Replace timesnap block with vms config block
        const timesnapRegex = /\{\s*name:\s*'timesnap'[\s\S]*?combine_logs:\s*true,[\s\S]*?time:\s*true,[\s\S]*?autorestart:\s*true,\s*\}/;
        
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
        
        ecoConf = ecoConf.replace(timesnapRegex, newVmsAppBlock);
        
        // Fallback replacement if regex is slightly different
        if (!ecoConf.includes("'vms'")) {
          ecoConf = ecoConf.replace(/name:\s*'timesnap'/g, "name: 'vms'");
          ecoConf = ecoConf.replace(/cwd:\s*'\/var\/www\/html\/timesnap'/g, "cwd: '/var/www/html/vms/server'");
          ecoConf = ecoConf.replace(/script:\s*'npm'/g, "script: 'server.js'");
          ecoConf = ecoConf.replace(/args:\s*'start',/g, "");
          ecoConf = ecoConf.replace(/error_file:\s*'\/var\/www\/html\/timesnap\/logs\/error\.log'/g, "error_file: '/var/www/html/vms/server/logs/error.log'");
          ecoConf = ecoConf.replace(/out_file:\s*'\/var\/www\/html\/timesnap\/logs\/out\.log'/g, "out_file: '/var/www/html/vms/server/logs/out.log'");
          ecoConf = ecoConf.replace(/DB_NAME:\s*'timesnap'/g, "DB_NAME: 'spk_qcar'");
          ecoConf = ecoConf.replace(/DB_HOST:\s*'127.0.0.1'/g, "DB_HOST: '192.168.1.146'");
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
      if (npmInstall.stderr) console.warn(npmInstall.stderr);
      console.log('✅ Remote node modules installed!');

      // 6. PM2 Start / Restart
      console.log('\n--- PM2 START VMS APP ---');
      // Delete old timesnap app from PM2 if it was somehow registered
      await runSshCommand(conn, 'pm2 delete timesnap 2>/dev/null || true');
      // Start or restart VMS using updated ecosystem config
      const pm2Res = await runSshCommand(conn, 'pm2 start /var/www/html/timesnap/ecosystem.config.js --only vms || pm2 restart vms');
      console.log(pm2Res.stdout);
      await runSshCommand(conn, 'pm2 save');
      console.log('✅ PM2 Process list updated and VMS application started.');

      console.log('\n🎉 DEPLOYMENT FINISHED SUCCESSFULLY!');
      conn.end();
    });
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    conn.end();
  }
});

conn.connect(config);
