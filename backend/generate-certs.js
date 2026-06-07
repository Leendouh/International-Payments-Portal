const selfsigned = require('selfsigned');
const fs = require('node:fs');
const path = require('node:path');

// Create certs directory if it doesn't exist
const certsDir = path.join(__dirname, '../certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

// Read additional hosts from environment variable
const additionalHosts = process.env.CERT_ADDITIONAL_HOSTS ? process.env.CERT_ADDITIONAL_HOSTS.split(',') : [];
const additionalIPs = process.env.CERT_ADDITIONAL_IPS ? process.env.CERT_ADDITIONAL_IPS.split(',') : [];

const attrs = [{ name: 'commonName', value: 'localhost' }];
const opts = {
  keySize: 2048,
  days: 365,
  algorithm: 'sha256',
  extensions: [
    {
      name: 'basicConstraints',
      cA: true,
    },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true,
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true,
    },
    {
      name: 'subjectAltName',
      altNames: [
        {
          type: 2, // DNS
          value: 'localhost',
        },
        ...additionalHosts.map(host => ({ type: 2, value: host })),
        {
          type: 7, // IP
          ip: '127.0.0.1',
        },
        ...additionalIPs.map(ip => ({ type: 7, ip })),
      ],
    },
  ],
};

const pems = selfsigned.generate(attrs, opts);

fs.writeFileSync(path.join(certsDir, 'key.pem'), pems.private);
fs.writeFileSync(path.join(certsDir, 'cert.pem'), pems.cert);

console.log('SSL certificates generated successfully!');
