import requests
import json

def test_buscar():
    url = "http://localhost:5000/api/buscar"
    headers = {"Content-Type": "application/json"}
    data = {
        "nuc": "199-2020-ELAB-00094",
        "pagina": 1,
        "registros": 20
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_buscar()
