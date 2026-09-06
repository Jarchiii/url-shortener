import { customAlphabet } from 'nanoid';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const CODE_LENGTH = 7;

const nano = customAlphabet(ALPHABET, CODE_LENGTH);

export function generateCode(): string {
  return nano();
}
