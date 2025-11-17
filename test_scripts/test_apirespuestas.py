import unittest
import requests

BASE_URL = "http://localhost:8081/api/respuestas"

class TestRespuestasAPI(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        print("Inicializando pruebas de API_RESPUESTAS...")
        cls.test_id = None  # se usará para crear, actualizar y eliminar

    # Caso 1: Crear una respuesta válida
    def test_1_add_respuesta_valida(self):
        data = {
            "estudiante_id": 1,
            "pregunta_id": 1,
            "respuesta_entregada": "B"
        }
        response = requests.post(BASE_URL, json=data)
        self.assertIn(response.status_code, [200, 201], f"Error al crear respuesta: {response.text}")
        
        body = response.json()
        self.assertIn("id", body, "No se devolvió ID al crear respuesta")
        self.__class__.test_id = body["id"]

    # Caso 2: Crear una respuesta inválida
    def test_2_add_respuesta_invalida(self):
        data = {"estudiante_id": 2}
        response = requests.post(BASE_URL, json=data)
        self.assertIn(response.status_code, [400, 500])

    # Caso 3: Obtener todas las respuestas
    def test_3_get_respuestas(self):
        response = requests.get(BASE_URL)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    # Caso 4: Manejo de JSON inválido
    def test_4_envio_json_malformado(self):
        response = requests.post(BASE_URL, data="esto no es json") # no es json pq es plain text
        self.assertIn(response.status_code, [400, 500])

    @classmethod
    def tearDownClass(cls):
        print("Pruebas finalizadas.")

if __name__ == "__main__":
    unittest.main(verbosity=2)