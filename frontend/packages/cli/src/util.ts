import { join as pathJoin } from 'path';
import { homedir } from 'os';
import { readFile } from 'fs/promises';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface KeystoreMap {
  [publicKey: string]: Ed25519Keypair;
}

/**
 * https://github.com/MystenLabs/sui/blob/6a61564ec9ef2fe0457aefaae6545c45fc2b8f24/crates/sui-types/src/crypto.rs#L190
 */
function isSuiEd25519Key(bytes: Buffer): boolean {
  return bytes[0] === 0x00;
}

export async function loadKeystore() {
  const HOME_DIR = homedir();
  const CONFIG_DIR = '.sui/sui_config';
  const keystorePath = pathJoin(HOME_DIR, CONFIG_DIR, 'sui.keystore');

  const keystoreMap: KeystoreMap = {};
  try {
    const keystoreFile = await readFile(keystorePath, { encoding: 'utf-8' });
    const keys: string[] = JSON.parse(keystoreFile);

    keys.forEach((key) => {
      const rawBuf = Buffer.from(key, 'base64');
      if (!isSuiEd25519Key(rawBuf)) {
        return;
      }
      const keyPair = Ed25519Keypair.fromSecretKey(rawBuf.subarray(1));

      keystoreMap[keyPair.getPublicKey().toSuiAddress()] = keyPair;
    });

    return keystoreMap;
  } catch (error) {
    console.error('Error loading the keystore:', error);
    throw error;
  }
}
