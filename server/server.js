const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const app = require('./app');
const initGaragesTable = require('./database/init_garages');
const initRenewalsTable = require('./database/init_renewals');
const initInsuranceCompaniesTable = require('./database/init_insurance_companies');

const PORT = process.env.PORT || 3000;

// Initialize Database upgrades
initGaragesTable();
initRenewalsTable();
initInsuranceCompaniesTable();

app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║  🚗 Automotive Maintenance System (AMS)  ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║   Server:  http://localhost:${PORT}          ║`);
    console.log(`║   API:     http://localhost:${PORT}/api      ║`);
    console.log(`║   Health:  http://localhost:${PORT}/api/health║`);
    console.log(`║   Env:     ${(process.env.NODE_ENV || 'development').padEnd(28)}║`);
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
});
