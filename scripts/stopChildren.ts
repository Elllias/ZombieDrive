import type { ChildProcess } from 'node:child_process';

export async function stopChildren(children: ReadonlyArray<ChildProcess>): Promise<void> {
    await Promise.all(
        children.map((child): Promise<void> => {
            if (child.exitCode !== null || child.signalCode !== null) {
                return Promise.resolve();
            }

            return new Promise<void>((resolve) => {
                const timeout = setTimeout((): void => {
                    child.kill('SIGKILL');
                }, 5000);

                child.once('exit', (): void => {
                    clearTimeout(timeout);
                    resolve();
                });

                child.kill('SIGTERM');
            });
        }),
    );
}
