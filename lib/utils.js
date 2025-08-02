import { sha256 } from 'js-sha256';

export const createPlayerFingerprint = () => {
    if (typeof window === 'undefined') return '';
    const data = `${navigator.userAgent}${screen.width}${screen.height}`;
    return sha256(data);
};