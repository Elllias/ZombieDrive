import os
import re
import shlex
import shutil
import sys
import tempfile
from pathlib import Path


ASSIGNMENT = re.compile(r"^\s*(?:export\s+)?TELEGRAM_BOT_TOKEN\s*=")
TOKEN = re.compile(r"\d+:[A-Za-z0-9_-]+")


def current_token(source: str) -> str:
    values = [line.split("=", 1)[1] for line in source.splitlines() if ASSIGNMENT.match(line)]
    parts = shlex.split(values[-1], comments=True) if values else []
    return parts[0] if len(parts) == 1 else ""


def save_token(path: Path, source: str, token: str) -> None:
    backup = path.with_name(path.name + ".before-telegram")
    if not backup.exists():
        shutil.copyfile(path, backup)
        backup.chmod(0o600)

    lines = [line for line in source.splitlines() if not ASSIGNMENT.match(line)]
    lines.append("TELEGRAM_BOT_TOKEN=" + token)
    descriptor, temporary = tempfile.mkstemp(dir=path.parent, prefix=".env.telegram.")
    try:
        with os.fdopen(descriptor, "w") as stream:
            stream.write("\n".join(lines) + "\n")
        os.chmod(temporary, 0o600)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def configure(path: Path, incoming: str) -> None:
    if path.is_symlink() or not path.is_file():
        raise ValueError("Server environment file is unavailable")

    source = path.read_text()
    previous = current_token(source)
    token = incoming or previous
    if not TOKEN.fullmatch(token):
        raise ValueError("TELEGRAM_BOT_TOKEN must be configured locally or on the server before deployment")

    if token != previous:
        save_token(path, source, token)
    print("Telegram server configuration is ready.")


if __name__ == "__main__":
    try:
        if len(sys.argv) != 2:
            raise ValueError("Expected a server environment file path")
        configure(Path(sys.argv[1]), sys.stdin.read().strip())
    except (OSError, ValueError):
        print("Telegram configuration failed. Check TELEGRAM_BOT_TOKEN locally or on the server.", file=sys.stderr)
        sys.exit(2)
