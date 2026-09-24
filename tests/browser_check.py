"""Smoke check for the portfolio in Flask or static mode."""

import sys
from pathlib import Path

from playwright.sync_api import sync_playwright


base_url = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:5000"
out_dir = Path(".impeccable/review")
out_dir.mkdir(parents=True, exist_ok=True)

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    for name, width, height in (("desktop", 1440, 900), ("mobile", 390, 844)):
        page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(base_url)
        page.wait_for_load_state("networkidle")
        assert page.locator("#bio").inner_text().strip()
        assert page.locator("#projects-list article").count() >= 1
        page.locator('input[name="cor"][value="ciano"]').check()
        page.locator("#velocidade").fill("8")
        assert 'cor = "ciano"' in page.locator("#code-preview").inner_text()
        assert "velocidade = 8" in page.locator("#code-preview").inner_text()
        page.locator("#start-game").click()
        assert page.locator("#game-overlay").is_hidden()
        page.wait_for_timeout(150)
        assert not errors, errors
        assert page.locator("body").evaluate("el => el.scrollWidth <= window.innerWidth + 1"), f"horizontal overflow at {width}px"
        page.screenshot(path=str(out_dir / f"{name}.png"), full_page=True)
        page.close()
    browser.close()

print(f"Browser check passed for desktop and mobile at {base_url}")
