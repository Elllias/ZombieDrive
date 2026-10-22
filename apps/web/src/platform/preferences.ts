export const PREFERENCES = {
    read(key: string): boolean {
        try {
            return localStorage.getItem(`zombie-drive:${ key }`) === '1';
        } catch {
            return false;
        }
    },

    write(key: string, value: boolean): void {
        try {
            localStorage.setItem(`zombie-drive:${ key }`, value ? '1' : '0');
        } catch {
            // Storage can be unavailable in an embedded browser; gameplay remains available.
        }
    },
};
