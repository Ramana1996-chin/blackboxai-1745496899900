from flask import Flask, jsonify, request
import requests
from datetime import datetime
import os
from dotenv import load_dotenv

app = Flask(__name__)

# API Configuration
API_KEY = "pub_8274176ad593ca6b1bb2e08eb96811531a1ef"
NEWS_API_URL = "https://newsdata.io/api/1"

def try_fetch_news(params, endpoint):
    try:
        # Adjust parameters for NewsData.io
        params["apikey"] = API_KEY
        if "category" in params:
            params["category"] = "top" if params["category"] == "general" else params["category"]
        if endpoint == "top-headlines":
            endpoint = "news"  # NewsData.io uses different endpoint
            
        response = requests.get(f"{NEWS_API_URL}/{endpoint}", params=params)
        if response.status_code == 200:
            data = response.json()
            return data.get("results", [])
    except Exception as e:
        print(f"Error with API: {str(e)}")
    return []

# Configure static file serving
app.static_folder = 'static'
app.static_url_path = ''

@app.route('/')
def serve_app():
    return app.send_static_file('index.html')

@app.route('/js/<path:path>')
def serve_js(path):
    return app.send_static_file(f'js/{path}')

# Category mappings
CATEGORIES = {
    'local': 'top',
    'state': 'politics',
    'national': 'politics',
    'sports': 'sports',
    'entertainment': 'entertainment',
    'technology': 'technology'
}

def format_article(article, category=None):
    return {
        "title": article.get('title', ''),
        "description": article.get('description', 'వివరణ అందుబాటులో లేదు'),
        "category": category or "స్థానికం",
        "time": format_time(article.get('pubDate', '')),
        "source": article.get('source_id', 'తెలియని మూలం'),
        "image": article.get('image_url', 'https://via.placeholder.com/400x200'),
        "url": article.get('link', '#')
    }

@app.route('/api/news/local')
def get_local_news():
    try:
        params = {
            "country": "in",
            "language": "te",
            "category": "top",
            "q": "తెలంగాణ OR ఆంధ్రప్రదేశ్",
            "size": 10
        }
        
        articles = try_fetch_news(params, "news")
        formatted_articles = [format_article(article) for article in articles]
        return jsonify(formatted_articles[:9])
    except Exception as e:
        print(f"Error fetching news: {str(e)}")
        return jsonify({"error": "వార్తలు పొందడంలో తప్పు జరిగింది. దయచేసి మళ్ళీ ప్రయత్నించండి"}), 500

@app.route('/api/news/category/<category>')
def get_news_by_category(category):
    try:
        params = {
            "country": "in",
            "language": "te",
            "size": 10,
            "category": CATEGORIES.get(category.lower(), 'top')
        }

        # Add specific search terms for state and national news
        if category.lower() == 'state':
            params["q"] = "తెలంగాణ OR ఆంధ్రప్రదేశ్"
        elif category.lower() == 'national':
            params["q"] = "భారత్ OR ఇండియా"

        print(f"Fetching news with params: {params}")
        articles = try_fetch_news(params, "news")
        formatted_articles = [format_article(article, category.capitalize()) for article in articles]
        return jsonify(formatted_articles[:9])
    except Exception as e:
        print(f"Error fetching news: {str(e)}")
        return jsonify({"error": "వార్తలు పొందడంలో తప్పు జరిగింది. దయచేసి మళ్ళీ ప్రయత్నించండి"}), 500

def format_time(timestamp):
    """Convert timestamp to relative time in Telugu"""
    try:
        article_time = datetime.strptime(timestamp, "%Y-%m-%dT%H:%M:%SZ")
        now = datetime.utcnow()
        diff = now - article_time
        
        if diff.days > 0:
            return f"{diff.days} రోజుల క్రితం"
        elif diff.seconds // 3600 > 0:
            hours = diff.seconds // 3600
            return f"{hours} గంటల క్రితం"
        elif diff.seconds // 60 > 0:
            minutes = diff.seconds // 60
            return f"{minutes} నిమిషాల క్రితం"
        else:
            return "ఇప్పుడే"
    except:
        return "ఇటీవల"

if __name__ == '__main__':
    # Move static files to correct location
    os.makedirs('static', exist_ok=True)
    if os.path.exists('index.html'):
        os.rename('index.html', 'static/index.html')
    if not os.path.exists('static/js'):
        os.makedirs('static/js', exist_ok=True)
    if os.path.exists('js/app.js'):
        os.rename('js/app.js', 'static/js/app.js')
        
    app.run(host='0.0.0.0', port=8000, debug=True)
