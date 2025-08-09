const fs = require('fs');
const path = require('path');

function dbPath(name) {
  const p = path.join(__dirname, 'data', `${name}.json`);
  if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify({}, null, 2));
  return p;
}

function load(name) {
  const p = dbPath(name);
  return JSON.parse(fs.readFileSync(p, 'utf8') || '{}');
}

function save(name, data) {
  const p = dbPath(name);
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

module.exports = { load, save };
