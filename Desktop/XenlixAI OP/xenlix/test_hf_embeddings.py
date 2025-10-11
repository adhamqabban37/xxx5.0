import requests
import json

def test_hf_embeddings():
    """Test HuggingFace embedding generation"""
    try:
        response = requests.post('http://localhost:3000/api/test-hf', json={
            "texts": [
                "What is AEO optimization?",
                "How to improve website rankings?",
                "Best SEO practices for 2024"
            ]
        })
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Embedding test successful!")
            print(f"Model: {result.get('embeddings', {}).get('model')}")
            print(f"Input texts: {result.get('inputCount')}")
            print(f"Processing time: {result.get('embeddings', {}).get('usage', {}).get('processingTimeMs')}ms")
            print(f"Embeddings generated: {len(result.get('embeddings', {}).get('embeddings', []))}")
            if result.get('embeddings', {}).get('embeddings'):
                print(f"Embedding dimensions: {len(result['embeddings']['embeddings'][0])}")
        else:
            print(f"❌ Request failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_hf_embeddings()