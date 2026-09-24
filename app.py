"""Flask entry point for the portfolio and its optional Python demonstration API."""

from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory


ROOT = Path(__file__).resolve().parent
app = Flask(__name__, static_folder="static")


@app.get("/")
def home():
    return send_from_directory(ROOT, "index.html")


@app.get("/profile.json")
def profile():
    return send_from_directory(ROOT, "profile.json")


@app.post("/api/character")
def character():
    """Validate and interpret the same variables shown in the browser."""
    values = request.get_json(silent=True)
    if not isinstance(values, dict):
        return jsonify(error="Envie um objeto JSON com as variáveis do personagem."), 400

    try:
        speed = int(values["velocidade"])
        energy = int(values["energia"])
    except (KeyError, ValueError, TypeError):
        return jsonify(error="Velocidade e energia precisam ser números inteiros."), 400

    color = values.get("cor")
    accessory = values.get("acessorio")
    if not 2 <= speed <= 8 or not 3 <= energy <= 7:
        return jsonify(error="Use velocidade de 2 a 8 e energia de 3 a 7."), 400
    if color not in ("menta", "ciano", "coral"):
        return jsonify(error="Escolha menta, ciano ou coral para a cor."), 400
    if accessory not in ("nenhum", "oculos", "antena"):
        return jsonify(error="Escolha nenhum, óculos ou antena para o acessório."), 400

    return jsonify(
        personagem={
            "velocidade": speed,
            "energia": energy,
            "cor": color,
            "acessorio": accessory,
        },
        dica="Mais velocidade facilita alcançar pontos; mais energia permite mais erros.",
        motor="Flask / Python",
    )


if __name__ == "__main__":
    app.run(debug=True)
