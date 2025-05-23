const crypto = require('crypto');

const KEY_SIZE_BYTES = 32; 

class CryptoUtils {
  static generateKey() {
    return crypto.randomBytes(KEY_SIZE_BYTES);
  }

  static generateRandomInt(max) {
    if (max < 0) throw new Error('Max must be non-negative');
    const range = max + 1;
    const threshold = (-(range % 256)) % 256; 
    let bytes;
    do {
      bytes = crypto.randomBytes(4);
    } while (bytes[0] < threshold);
    return bytes.readUInt32BE(0) % range;
  }

  static computeHMAC(key, number) {
    return crypto.createHmac('sha3-256', key).update(String(number)).digest('hex').toUpperCase();
  }
}

module.exports = CryptoUtils;
