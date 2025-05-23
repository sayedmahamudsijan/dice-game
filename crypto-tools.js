const crypto = require('crypto');

const KEY_SIZE_BYTES = 32; // Constant for key size (256 bits)

class CryptoUtils {
  static generateKey() {
    return crypto.randomBytes(KEY_SIZE_BYTES);
  }

  static computeHMAC(key, number) {
    return crypto.createHmac('sha3-256', key).update(String(number)).digest('hex').toUpperCase();
  }
}

module.exports = CryptoUtils;
