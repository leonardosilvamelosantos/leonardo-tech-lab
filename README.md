# Laboratório de ideias

Portfólio interativo para apresentar projetos de desenvolvimento e uma demonstração de ensino de programação. O visitante altera variáveis de um personagem, vê o código Python correspondente e joga um minijogo de coletar estrelas.

## Executar com Flask

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Abra `http://127.0.0.1:5000`. O Flask serve a página e valida a configuração do personagem em `POST /api/character`.

## Publicar no GitHub Pages

O mesmo `index.html`, `static/` e `profile.json` funciona sem servidor Python. Publique o repositório no GitHub e, em **Settings → Pages**, escolha **Deploy from a branch**, sua branch principal e a pasta **/(root)**. O minijogo roda integralmente no navegador; a API Flask só fica disponível em hospedagens Python.

Para testar o modo estático localmente:

```powershell
python -m http.server 8000
```

Abra `http://127.0.0.1:8000`.

## Personalizar

Edite [`profile.json`](profile.json): nome, localização, biografia, currículo, links, projetos e áreas de atuação. Os pesos de `skills` são uma distribuição visual de foco, não notas de proficiência; podem ser alterados ou renomeados. Não publique dados pessoais que não queira divulgar.

Os projetos selecionados já estão em `projects`. Cada entrada aceita `title`, `type`, `description`, `tags`, `url` e, se o projeto não tiver link público, `linkLabel`. Links vazios não serão publicados como URLs. SmartSalão/SalaoIA e Painel Acadêmico estão identificados como projetos sem repositório público.

As prévias ficam em `static/media/`. Para adicionar outra, inclua `preview` no projeto com `src`, `alt` e `caption`. Use `lightbox: true` para abrir imagens ampliadas sobre o fundo desfocado; o GIF do Task Bar Hero Code é exibido diretamente na lista.

## Estrutura

- `index.html` — conteúdo e navegação;
- `static/styles.css` — identidade visual responsiva;
- `static/app.js` — personagem, minijogo e renderização do perfil;
- `profile.json` — conteúdo editável;
- `app.py` — servidor Flask e API opcional.

## Testes

```powershell
python -m unittest discover -s tests
```
