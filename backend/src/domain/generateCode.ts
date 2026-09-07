import { customAlphabet } from 'nanoid';
import type { CodeGenerator } from './ports.js';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const CODE_LENGTH = 7;

const nano = customAlphabet(ALPHABET, CODE_LENGTH);

export const generateCode: CodeGenerator = () => nano();
