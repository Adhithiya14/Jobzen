import requests

def test_upload():
    url = "http://localhost:8001/resume/analyze"  # Changed to 8001
    files = {'file': ('test.pdf', b'%PDF-1.4\n1 0 obj\n<<\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF', 'application/pdf')}
    
    try:
        print(f"Sending POST request to {url}...")
        response = requests.post(url, files=files)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_upload()
