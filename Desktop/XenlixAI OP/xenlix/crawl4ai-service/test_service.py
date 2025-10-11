import requests
import json

def test_crawl4ai_service():
    """Test Crawl4AI service endpoints"""
    base_url = "http://127.0.0.1:8002"
    
    try:
        # Test health endpoint
        print("Testing health endpoint...")
        response = requests.get(f"{base_url}/health", timeout=10)
        print(f"Health Status: {response.status_code}")
        print(f"Health Response: {response.json()}")
        
        # Test crawl endpoint with a simple page
        print("\nTesting crawl endpoint...")
        crawl_data = {
            "url": "https://example.com",
            "include_raw_html": False,
            "word_count_threshold": 100
        }
        
        response = requests.post(f"{base_url}/crawl", json=crawl_data, timeout=30)
        print(f"Crawl Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Crawl Success: {result.get('success', False)}")
            if result.get('success'):
                print(f"Content Length: {len(result.get('content', ''))}")
                print(f"Semantic Analysis: {result.get('semantic_analysis', {})}")
        else:
            print(f"Crawl Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Service not running on port 8002")
    except requests.exceptions.Timeout:
        print("⏱️ Service timeout")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_crawl4ai_service()