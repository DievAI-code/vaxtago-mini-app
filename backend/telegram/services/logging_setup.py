import logging


def setup_logging() -> logging.Logger:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [VaxtaGo Bot] %(levelname)s: %(message)s",
    )
    return logging.getLogger("vaxtago")