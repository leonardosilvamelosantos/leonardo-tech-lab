import unittest

from app import app


class CharacterApiTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_page_and_profile_are_served(self):
        with self.client.get('/') as page:
            self.assertEqual(page.status_code, 200)
        with self.client.get('/profile.json') as profile:
            self.assertEqual(profile.status_code, 200)

    def test_character_accepts_valid_variables(self):
        response = self.client.post('/api/character', json={
            'cor': 'menta', 'velocidade': 5, 'energia': 5, 'acessorio': 'oculos'
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['personagem']['velocidade'], 5)
        self.assertEqual(response.json['motor'], 'Flask / Python')

    def test_character_rejects_invalid_variables(self):
        response = self.client.post('/api/character', json={
            'cor': 'menta', 'velocidade': 100, 'energia': 5, 'acessorio': 'nenhum'
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json)


if __name__ == '__main__':
    unittest.main()
