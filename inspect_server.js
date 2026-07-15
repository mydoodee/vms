const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const config = {
  host: 'app.spkconstruction.co.th',
  port: 22,
  username: 'root',
  password: 'Spk@dcem987'
};

const localApkPath = 'c:\\Users\\it\\Desktop\\WEB-MENU2GO\\SPK\\Vehicle Maintenance System (VMS)\\client_mobile\\build\\app\\outputs\\flutter-apk\\app-release.apk';
const remoteApkDir = '/var/www/html/vms/server/apk';
const remoteApkPath = '/var/www/html/vms/server/apk/app-release.apk';

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

conn.on('ready', async () => {
  console.log('⚡ Connected via SSH. Starting APK upload...');
  
  try {
    conn.sftp(async (err, sftp) => {
      if (err) throw err;

      // 1. Ensure remote directory exists
      console.log('📁 Creating remote directory if not exists:', remoteApkDir);
      await runSshCommand(conn, `mkdir -p ${remoteApkDir}`);

      // 2. Upload APK file
      console.log('📤 Uploading APK...');
      console.log(`Local path: ${localApkPath}`);
      console.log(`Remote path: ${remoteApkPath}`);

      await new Promise((resolve, reject) => {
        sftp.fastPut(localApkPath, remoteApkPath, (err) => {
          if (err) {
            console.error('❌ Upload failed:', err);
            reject(err);
          } else {
            console.log('✅ Upload completed successfully!');
            resolve();
          }
        });
      });

      // 3. Fix permissions
      console.log('🔧 Fixing remote file permissions...');
      await runSshCommand(conn, `chmod 755 ${remoteApkPath} && chown www-data:www-data ${remoteApkPath}`);
      console.log('✅ Permissions fixed!');

      // 4. Verify remote file
      console.log('🔍 Verifying remote file...');
      const verifyRes = await runSshCommand(conn, `ls -lh ${remoteApkPath}`);
      console.log(verifyRes.stdout || verifyRes.stderr);

      conn.end();
    });
  } catch (error) {
    console.error('❌ Operation failed:', error);
    conn.end();
  }
});

conn.connect(config);
