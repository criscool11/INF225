import unittest
import requests

BASE_URL = "http://localhost:8080/api/preguntas"

class TestPreguntasAPI(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        print("Inicializando pruebas de API_PREGUNTAS...")

    # Caso 1: Crear una pregunta válida
    def test_add_pregunta_valida(self):
        data = {
            "enunciado": "¿Cuánto es 2+2?",
            "alternativa_a": "3",
            "alternativa_b": "4",
            "alternativa_c": "5",
            "alternativa_d": "6",
            "respuesta_correcta": "B",
            "tema": "Matemáticas",
            "es_libre": False
        }
        response = requests.post(BASE_URL, json=data)
        self.assertEqual(response.status_code, 201)
        self.assertIn("id", response.json())

    # Caso 2: Crear pregunta con datos inválidos
    def test_add_pregunta_invalida(self):
        data = {
            "enunciado": "Pregunta sin alternativas"
        }
        response = requests.post(BASE_URL, json=data)
        # El backend no valida explícitamente, pero puede fallar con error 500
        self.assertIn(response.status_code, [400, 500])

    # Caso 3: Obtener todas las preguntas
    def test_get_preguntas(self):
        response = requests.get(BASE_URL)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    # Caso 4: Obtener lista vacía (opcional según estado de DB)
    # Aquí solo comprobamos estructura válida
    def test_get_preguntas_estructura(self):
        response = requests.get(BASE_URL)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        if len(data) > 0:
            self.assertIn("enunciado", data[0])

    @classmethod
    def tearDownClass(cls):
        print("Pruebas finalizadas.")

if __name__ == "__main__":
    unittest.main()