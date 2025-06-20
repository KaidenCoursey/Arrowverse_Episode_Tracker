import requests
from bs4 import BeautifulSoup
import json

def scrape_arrowverse_episodes(save_to_file=True, file_name="arrowverse_episodes.json"):
    URL = "https://arrowverse.info/"
    HEADERS = {"User-Agent": "Mozilla/5.0"}

    try:
        resp = requests.get(URL, headers=HEADERS)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"Failed to fetch data: {e}")
        return None

    soup = BeautifulSoup(resp.text, "html.parser")
    episodes = []

    # Table rows hold the release-order data
    for row in soup.select("table tr")[1:]:
        cols = [c.text.strip() for c in row.find_all("td")]
        if len(cols) < 5:
            continue

        series, s_ep, title = cols[1], cols[2], cols[3]
        season, episode = s_ep.replace("S", "").split("E")

        episodes.append({
            "Series": series,
            "Title": title,
            "Season": season.zfill(2),
            "Episode": episode.zfill(2)
        })

    # Platform links
    series_links = {
        "Arrow": "https://www.netflix.com/title/70242081",
        "The Flash": "https://www.netflix.com/title/80027042",
        "Supergirl": "https://www.netflix.com/title/80072227",
        "DC's Legends of Tomorrow": "https://www.netflix.com/title/80100172",
        "Black Lightning": "https://www.netflix.com/title/80160840",
        "Batwoman": "https://www.netflix.com/title/81025217",
        "Superman & Lois": "https://www.netflix.com/title/81469021",
        "Constantine": "https://www.netflix.com/title/70288064"
    }

    data = {"Episodes": episodes, "Series": series_links}

    if save_to_file:
        with open(file_name, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)
        print(f"✅ Saved to {file_name}")

    return data
