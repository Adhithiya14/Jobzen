import requests

def test_upload():
    url = "http://localhost:8000/resume/analyze"
    # Create a dummy PDF file content (minimal valid PDF structure not needed for pypdf sometimes, but let's send bytes)
    # Actually pypdf might fail if not valid PDF, but we want to fail with 200 OK and empty text, or 500?
    # Let's send a text file disguised as PDF to see if it crashes or handles exception.
    
    files = {'file': ('test.pdf', b'%PDF-1.4\n1 0 obj\n<<\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF', 'application/pdf')}
    
    try:
        print(f"Sending POST request to {url}...")
        response = requests.post(url, files=files)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    try:
        import requests
    except ImportError:
        print("installing requests...")
        import os
        os.system("pip install requests")
        import requests
    
    test_upload()
