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
        assert page.locator("#projects-list article").count() == 6
        assert "Leonardo Santos" in page.locator("#profile-identity").inner_text()
        assert page.locator('#github-link').get_attribute('href') == 'https://github.com/leonardosilvamelosantos'
        assert page.locator('#projects-list a[href*="taskbar-code"]').count() == 1
        previews = page.locator('.project-preview img')
        assert previews.count() == 4
        gif = page.locator('.project-preview img[src$=".gif"]')
        gif.scroll_into_view_if_needed()
        assert gif.evaluate('async img => { await img.decode(); return img.naturalWidth === 500; }')
        smart_salao = page.locator('.project-row').filter(has=page.get_by_role('heading', name='SmartSalão / SalaoIA'))
        smart_salao.get_by_role('button', name='Ver imagem').click()
        assert page.locator('#project-lightbox').is_visible()
        assert page.locator('#project-lightbox-image').evaluate('async img => { await img.decode(); return img.naturalWidth === 657; }')
        assert 'blur' in page.locator('#project-lightbox').evaluate("el => getComputedStyle(el, '::backdrop').backdropFilter")
        page.screenshot(path=str(out_dir / f"{name}-smart-salao-lightbox.png"))
        page.keyboard.press('Escape')
        assert page.locator('#project-lightbox').is_hidden()
        academic = page.locator('.project-row').filter(has=page.get_by_role('heading', name='Painel Acadêmico'))
        academic.get_by_role('button', name='Ver imagem').click()
        assert page.locator('#project-lightbox-image').evaluate('async img => { await img.decode(); return img.naturalWidth === 1884; }')
        page.locator('#project-lightbox-close').click()
        assert page.locator('#project-lightbox').is_hidden()
        certificate = page.locator('.project-row').filter(has=page.get_by_role('heading', name='Certificado SRC'))
        certificate.get_by_role('button', name='Ver imagem').click()
        assert page.locator('#project-lightbox-image').evaluate('async img => { await img.decode(); return img.naturalWidth === 1888; }')
        page.keyboard.press('Escape')
        assert page.locator('#project-lightbox').is_hidden()
        assert page.locator('#projects-list a[href*="certificado-src"]').count() == 1
        assert page.locator('#projects-list a[href*="JusTrack"]').count() == 1
        assert page.locator('#projects-list a[href*="landing-page-de-certificado"]').count() == 1
        assert page.locator('#portfolio-link').is_visible()
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
