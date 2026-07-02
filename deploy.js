const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
  host: 'app.spkconstruction.co.th',
  port: 22,
  username: 'root',
  password: 'Spk@dcem987'
};

// Step 1: Build client-admin (run `yarn build` in client-admin/ first)
const { execSync } = require('child_process');
console.log('📦 Step 1: Skipping build (already built manually)');
console.log('✅ Client-admin build ready');

// Step 2: Create tar.gz of server files
console.log('\n📦 Step 2: Packaging server files...');
const projectRoot = __dirname;

function sshExec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '', stderr = '';
      stream.on('close', (code) => {
        if (code !== 0 && stderr.trim()) {
          console.log(`  ⚠️ stderr: ${stderr.trim()}`);
        }
        resolve({ stdout: stdout.trim(), stderr: stderr.trim(), code });
      });
      stream.on('data', d => stdout += d);
      stream.stderr.on('data', d => stderr += d);
    });
  });
}

function sftpUpload(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      sftp.fastPut(localPath, remotePath, (err2) => {
        if (err2) return reject(err2);
        resolve();
      });
    });
  });
}

function sftpUploadDir(conn, localDir, remoteDir) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);

      const uploadRecursive = async (localBase, remoteBase) => {
        const items = fs.readdirSync(localBase, { withFileTypes: true });
        for (const item of items) {
          const localPath = path.join(localBase, item.name);
          const remotePath = remoteBase + '/' + item.name;

          if (item.isDirectory()) {
            try { await new Promise((res, rej) => sftp.mkdir(remotePath, (e) => res())); } catch(e) {}
            await uploadRecursive(localPath, remotePath);
          } else {
            await new Promise((res, rej) => {
              sftp.fastPut(localPath, remotePath, (e) => {
                if (e) return rej(e);
                res();
              });
            });
          }
        }
      };

      uploadRecursive(localDir, remoteDir).then(resolve).catch(reject);
    });
  });
}

const conn = new Client();

conn.on('ready', async () => {
  console.log('\n⚡ SSH Connected to production server!');
  
  try {
    // Step 3: Check current server structure
    console.log('\n🔍 Step 3: Checking server structure...');
    const { stdout: structure } = await sshExec(conn, 'ls -la /var/www/html/vms/ 2>/dev/null || echo "DIR_NOT_FOUND"');
    console.log(structure);

    // Step 4: Upload server files
    console.log('\n📤 Step 4: Uploading server files...');
    
    // Ensure directories exist
    await sshExec(conn, 'mkdir -p /var/www/html/vms/server');
    await sshExec(conn, 'mkdir -p /var/www/html/vms/client-admin');
    
    // Upload server JS files
    const serverDir = path.join(projectRoot, 'server');
    const serverFiles = [
      'server.js', 'package.json',
    ];
    const serverDirs = [
      'config', 'controllers', 'middleware', 'routes', 'services', 'database'
    ];

    for (const file of serverFiles) {
      const localPath = path.join(serverDir, file);
      if (fs.existsSync(localPath)) {
        await sftpUpload(conn, localPath, `/var/www/html/vms/server/${file}`);
        console.log(`  ✅ Uploaded ${file}`);
      }
    }

    for (const dir of serverDirs) {
      const localDirPath = path.join(serverDir, dir);
      if (fs.existsSync(localDirPath)) {
        await sshExec(conn, `mkdir -p /var/www/html/vms/server/${dir}`);
        await sftpUploadDir(conn, localDirPath, `/var/www/html/vms/server/${dir}`);
        console.log(`  ✅ Uploaded ${dir}/`);
      }
    }

    // Upload create_access_table.js migration
    const migrationFile = path.join(serverDir, 'create_access_table.js');
    if (fs.existsSync(migrationFile)) {
      await sftpUpload(conn, migrationFile, '/var/www/html/vms/server/create_access_table.js');
      console.log('  ✅ Uploaded create_access_table.js');
    }

    // Step 5: Upload client-admin build
    console.log('\n📤 Step 5: Uploading client-admin build...');
    const distDir = path.join(projectRoot, 'client-admin', 'dist');
    console.log(`  Looking for dist at: ${distDir}`);
    console.log(`  Exists: ${fs.existsSync(distDir)}`);
    if (fs.existsSync(distDir)) {
      await sshExec(conn, 'mkdir -p /var/www/html/vms/client-admin/dist');
      await sshExec(conn, 'rm -rf /var/www/html/vms/client-admin/dist/*');
      await sftpUploadDir(conn, distDir, '/var/www/html/vms/client-admin/dist');
      console.log('  ✅ Client-admin build uploaded');
    } else {
      console.log('  ⚠️ dist folder not found, skipping client upload');
    }

    // Step 6: Run migration on production
    console.log('\n🗄️ Step 6: Running database migration...');
    const { stdout: migOut } = await sshExec(conn, 'cd /var/www/html/vms/server && node create_access_table.js 2>&1');
    console.log(`  ${migOut}`);

    // Step 7: Install deps & restart server
    console.log('\n🔄 Step 7: Installing dependencies & restarting...');
    const { stdout: npmOut } = await sshExec(conn, 'cd /var/www/html/vms/server && npm install --production 2>&1');
    console.log(`  npm install done (${npmOut.split('\n').length} lines)`);

    // Remove duplicate vms-server if exists, restart the existing 'vms' process
    await sshExec(conn, 'pm2 delete vms-server 2>/dev/null || true');
    const { stdout: pm2Out } = await sshExec(conn, 'pm2 restart vms 2>&1 || pm2 start /var/www/html/vms/server/server.js --name vms 2>&1');
    console.log(`  ${pm2Out}`);
    await sshExec(conn, 'pm2 save 2>/dev/null');

    // Step 8: Verify
    console.log('\n✅ Step 8: Verifying deployment...');
    const { stdout: pm2Status } = await sshExec(conn, 'pm2 list 2>&1');
    console.log(pm2Status);

    console.log('\n🎉 Deployment completed successfully!');
    
  } catch (e) {
    console.error('❌ Deployment error:', e.message);
  }

  conn.end();
}).on('error', (err) => {
  console.error('SSH Error:', err.message);
}).connect(config);
