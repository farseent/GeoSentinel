// You can add more helpers if needed
exports.isEmail = email => /\S+@\S+\.\S+/.test(email);
exports.isStrongPassword = password => password.length >= 6;