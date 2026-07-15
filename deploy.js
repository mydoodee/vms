const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const config = {
  host: 'app.spkconstruction.co.th',
  port: 22,
  username: 'root',
  password: 'Spk@dcem987'
};

const projectRoot = __dirname;

async function sshExec(connection, command) {
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

async function sftpUpload(connection, localFile, remoteFile) {
  return new Promise((resolve, reject) => {
    connection.sftp((err, sftp) => {
      if (err) return reject(err);
      sftp.fastPut(localFile, remoteFile, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
}

async function sftpUploadDir(connection, localDir, remoteDir) {
  return new Promise((resolve, reject) => {
    connection.sftp(async (err, sftp) => {
      if (err) return reject(err);
      
      const upload = async (local, remote) => {
        const stats = fs.statSync(local);
        if (stats.isDirectory()) {
          const baseName = path.basename(local);
          if (['node_modules', 'uploads', '.git', 'logs', 'scratch', 'dist-temp', 'build'].includes(baseName)) {
            return;
          }
          
          await sshExec(connection, `mkdir -p "${remote}"`);
          const files = fs.readdirSync(local);
          for (const file of files) {
            await upload(path.join(local, file), remote + '/' + file);
          }
        } else {
          await new Promise((res, rej) => {
            sftp.fastPut(local, remote, (err) => {
              if (err) rej(err);
              else res();
            });
          });
        }
      };
      
      try {
        await upload(localDir, remoteDir);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });
}

const conn = new Client();

conn.on('ready', async () => {
  console.log('\n⚡ SSH Connected to production server (under /vms)...');
  
  try {
    console.log('\n🔍 Step 3: Checking server structure...');
    const { stdout: structure } = await sshExec(conn, 'ls -la /var/www/html/vms/ 2>/dev/null || echo "DIR_NOT_FOUND"');
    console.log(structure);

    console.log('\n📤 Step 4: Uploading server files...');
    await sshExec(conn, 'mkdir -p /var/www/html/vms/server');
    await sshExec(conn, 'mkdir -p /var/www/html/vms/client-admin');
    
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

    const migrationFile = path.join(serverDir, 'create_access_table.js');
    if (fs.existsSync(migrationFile)) {
      await sftpUpload(conn, migrationFile, '/var/www/html/vms/server/create_access_table.js');
      console.log('  ✅ Uploaded create_access_table.js');
    }

    console.log('\n📤 Step 5: Uploading client-admin build...');
    const distDir = path.join(projectRoot, 'client-admin', 'dist');
    if (fs.existsSync(distDir)) {
      await sshExec(conn, 'mkdir -p /var/www/html/vms/client-admin/dist');
      await sshExec(conn, 'rm -rf /var/www/html/vms/client-admin/dist/*');
      await sftpUploadDir(conn, distDir, '/var/www/html/vms/client-admin/dist');
      console.log('  ✅ Client-admin build uploaded');
    }

    console.log('\n🗄️ Step 6: Running database migration...');
    const { stdout: migOut } = await sshExec(conn, 'cd /var/www/html/vms/server && node create_access_table.js 2>&1');
    console.log(`  ${migOut}`);

    console.log('\n🔄 Step 7: Installing dependencies & restarting...');
    const { stdout: npmOut } = await sshExec(conn, 'cd /var/www/html/vms/server && npm install --production 2>&1');
    console.log(`  npm install done (${npmOut.split('\n').length} lines)`);

    await sshExec(conn, 'pm2 delete ams 2>/dev/null || true');
    await sshExec(conn, 'pm2 delete vms-server 2>/dev/null || true');
    const { stdout: pm2Out } = await sshExec(conn, 'pm2 restart vms 2>&1 || pm2 start /var/www/html/vms/server/server.js --name vms 2>&1');
    console.log(`  ${pm2Out}`);
    await sshExec(conn, 'pm2 save 2>/dev/null');

    console.log('\n✅ Step 8: Verifying deployment...');
    const { stdout: pm2Status } = await sshExec(conn, 'pm2 list 2>&1');
    console.log(pm2Status);

    console.log('\n🎉 Revert Deployment completed successfully!');
    
  } catch (e) {
    console.error('❌ Deployment error:', e.message);
  }

  conn.end();
}).on('error', (err) => {
  console.error('SSH Error:', err.message);
}).connect(config);
