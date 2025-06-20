from flask import Flask, render_template
from .scrape import scrape_arrowverse_episodes

app = Flask(__name__)

results = scrape_arrowverse_episodes(True, 'Arrowverse/static/data.json')
print(results)
@app.route('/')
def main():
    return render_template('Index.html')


if __name__ == '__main__':
    app.run('0.0.0.0', 5000, True)