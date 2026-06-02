import CryptoJS from 'crypto-js';

// In a real-world scenario, you would use a more robust key exchange (e.g., Diffie-Hellman)
// For this implementation, we derive a shared secret from the participants' IDs.
const getSecretKey = (id1, id2) => {
    if (!id1 || !id2) return "fallback-secret-key";
    const sortedIds = [id1.toString(), id2.toString()].sort().join('-');
    return sortedIds; 
};

export const encryptMessage = (message, senderId, receiverId) => {
    try {
        const key = getSecretKey(senderId, receiverId);
        return CryptoJS.AES.encrypt(message, key).toString();
    } catch (error) {
        console.error("Encryption error:", error);
        return message;
    }
};

export const decryptMessage = (encryptedMessage, senderId, receiverId) => {
    try {
        const key = getSecretKey(senderId, receiverId);
        const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return decrypted || "[Decryption Failed]";
    } catch (error) {
        console.error("Decryption error:", error);
        return "[Encrypted Message]";
    }
};
