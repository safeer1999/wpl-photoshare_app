const crypto = require('crypto');

/**
 * Return a salted and hashed password entry from a clear text password.
 * @param {string} clearTextPassword
 * @return {object} passwordEntry where passwordEntry is an object with two
 * string properties:
 *    salt - The salt used for the password.
 *    hash - The sha1 hash of the password and salt.
 */
function makePasswordEntry(clearTextPassword) {
    // Generate a random salt
    const salt = crypto.randomBytes(8).toString('hex');
    
    // Create the hash using sha1
    const hash = crypto.createHmac('sha1', salt)
                       .update(clearTextPassword)
                       .digest('hex');

    return {
        salt: salt,
        hash: hash
    };
}

/**
 * Return true if the specified clear text password and salt generates the
 * specified hash.
 * @param {string} hash
 * @param {string} salt
 * @param {string} clearTextPassword
 * @return {boolean}
 */
function doesPasswordMatch(hash, salt, clearTextPassword) {
    // Recreate the hash using the provided salt and clear text password
    const newHash = crypto.createHmac('sha1', salt)
                          .update(clearTextPassword)
                          .digest('hex');

    // Compare the newly generated hash with the provided hash
    return newHash === hash;
}

module.exports = {
    makePasswordEntry,
    doesPasswordMatch
};