
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

# Folder containing this server.py
GENERATOR_DIR = Path(__file__).resolve().parent

# Parent folder containing product.json
ECOMMERCE_DIR = GENERATOR_DIR.parent

PRODUCT_FILE = ECOMMERCE_DIR / "product.json"
HOST = "127.0.0.1"
PORT = 8766


class PriceGeneratorHandler(SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ECOMMERCE_DIR), **kwargs)

    def do_GET(self):
        path = urlparse(self.path).path

        # Open the price generator when the browser visits /
        if path == "/":
            self.send_response(302)
            self.send_header(
                "Location",
                "/price-generator/price-list.html"
            )
            self.end_headers()
            return

        # Check that the actual product file exists
        if path == "/product.json":
            if not PRODUCT_FILE.is_file():
                self.send_error(
                    404,
                    f"Product file not found: {PRODUCT_FILE}"
                )
                return

        super().do_GET()

    def log_message(self, format, *args):
        print("[WITTYFARE]", format % args)


if __name__ == "__main__":
    print("=" * 45)
    print(" WITTYFARE PRICE GENERATOR")
    print("=" * 45)
    print("Product file:", PRODUCT_FILE)
    print("File exists:", PRODUCT_FILE.is_file())

    if not PRODUCT_FILE.is_file():
        print("\nERROR: product.json was not found.")
        print("Check that it is inside the ecommerce folder.")
        raise SystemExit(1)

    print("\nOpen this address:")
    print(f"http://{HOST}:{PORT}")
    print("\nPress CTRL+C to stop.")
    print("=" * 45)

    server = ThreadingHTTPServer(
        (HOST, PORT),
        PriceGeneratorHandler
    )

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        server.server_close()

