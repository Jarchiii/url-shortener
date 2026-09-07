// Business result unions
export type SaveResult = 'saved' | 'collision';
export type SafetyResult = 'safe' | 'unsafe';

// Ports (function signatures the domain depends on)
export type CodeGenerator = () => string;
export type UrlSaver = (code: string, url: string) => Promise<SaveResult>;
export type UrlLoader = (code: string) => Promise<string | null>;
export type CacheGetter = (code: string) => Promise<string | null>;
export type CacheSetter = (code: string, url: string) => Promise<void>;
export type SafetyChecker = (url: string) => Promise<SafetyResult>;
