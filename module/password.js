const crypto = require('crypto');

const saltLength = 16;

function createHash(password) {
  var salt = generateSalt(saltLength);
  var passwordData = sha512(password, salt);
  return passwordData.salt + passwordData.passwordHash;
}

function validateHash(hash, password) {
  var salt = hash.substr(0, saltLength);
  var validHash = sha512(password, salt);
  return hash === (validHash.salt+validHash.passwordHash);
}

function generateSalt(length) {
  return crypto.randomBytes(Math.ceil(length/2))
          .toString('hex')
          .slice(0,length);
}

function sha512(password, salt) {
  var hash = crypto.createHmac('sha512', salt);
  hash.update(password);
  var value = hash.digest('hex');
  return {
      salt:salt,
      passwordHash:value
  };
}

module.exports = {
  'hash': createHash,
  'validate': validateHash
};
