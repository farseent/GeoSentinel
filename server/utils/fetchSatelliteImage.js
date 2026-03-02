const { spawn } = require('child_process');
const path = require('path');

const fetchGEEImage = (bounds, dateFrom, dateTo, requestId, label) => {
  return new Promise((resolve, reject) => {

    const args = JSON.stringify({ bounds, dateFrom, dateTo, requestId: requestId.toString(), label });

    const pythonPath = process.env.PYTHON_PATH || 'python';
    const scriptPath = path.join(__dirname, 'fetchGEEImage.py');

    const python = spawn(pythonPath, [scriptPath, args], {
      env: { ...process.env },  // pass all env vars including GEE_PROJECT_ID
    });

    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    python.on('close', (code) => {
      try {
        const result = JSON.parse(output.trim());
        if (result.success) {
          resolve(result.filename);
        } else {
          reject(new Error(result.error));
        }
      } catch (e) {
        reject(new Error(`Python error: ${errorOutput || output}`));
      }
    });
  });
};

module.exports = fetchGEEImage;