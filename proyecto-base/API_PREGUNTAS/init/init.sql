SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS BD06_PREGUNTAS CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE BD06_PREGUNTAS;

CREATE TABLE IF NOT EXISTS preguntas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  enunciado VARCHAR(255) NOT NULL,
  alternativa_a VARCHAR(255) NOT NULL,
  alternativa_b VARCHAR(255) NOT NULL,
  alternativa_c VARCHAR(255) NOT NULL,
  alternativa_d VARCHAR(255) NOT NULL,
  respuesta_correcta VARCHAR(255) NOT NULL,
  tema VARCHAR(100),
  es_libre TINYINT(1) NOT NULL DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

INSERT INTO preguntas (
  enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, respuesta_correcta, tema, es_libre
) VALUES
("¿Cuál es el valor de pi aproximado a dos decimales?", "3.14", "3.41", "2.71", "1.62", "3.14", "Matematicas", 0),
("¿Cuál es la fórmula de la velocidad promedio?", "v = d/t", "v = m/a", "v = t/d", "v = a x t", "v = d/t", "Fisica", 0),
("¿Qué elemento químico tiene el símbolo Fe?", "Fósforo", "Hierro", "Flúor", "Francio", "Hierro", "Quimica", 0),
("¿Cuál es la función principal del sustantivo en una oración?", "Expresar acción", "Indicar sujeto", "Modificar verbo", "Describir adjetivos", "Indicar sujeto", "Lenguaje", 0),
("¿En qué año comenzó la Primera Guerra Mundial?", "1914", "1939", "1812", "1945", "1914", "Historia", 0),
("¿Cuál es el resultado de la operación 9^2?", "18", "81", "27", "72", "81", "Matematicas", 0),
("¿Qué ley establece que para cada acción hay una reacción igual y opuesta?", "Primera Ley de Newton", "Segunda Ley de Newton", "Tercera Ley de Newton", "Ley de Gravitación Universal", "Tercera Ley de Newton", "Fisica", 0),
("¿Cuál es el pH de una solución neutra?", "7", "0", "14", "5", "7", "Quimica", 0),
("¿Qué tipo de palabra es 'rápidamente'?", "Adjetivo", "Adverbio", "Sustantivo", "Verbo", "Adverbio", "Lenguaje", 0),
("¿Quién fue el primer presidente de los Estados Unidos?", "George Washington", "Thomas Jefferson", "Abraham Lincoln", "John Adams", "George Washington", "Historia", 0),
("¿Cuál es el resultado de 12 x 8?", "96", "108", "88", "98", "96", "Matematicas", 1),
("¿Cuál es la unidad del SI para la fuerza?", "Joule", "Pascal", "Newton", "Watt", "Newton", "Fisica", 1),
("¿Cuál es el número atómico del Oxígeno?", "6", "7", "8", "16", "8", "Quimica", 1),
("¿Cuál es el antónimo de 'rápido'?", "ligero", "lento", "veloz", "pronto", "lento", "Lenguaje", 1),
("¿En qué año se proclamó la Independencia de Chile?", "1810", "1817", "1818", "1821", "1818", "Historia", 1),
("¿Quién es reconocido como el Director Supremo y libertador de Chile?", "José de San Martín", "Bernardo O'Higgins", "Manuel Bulnes", "Diego Portales", "Bernardo O'Higgins", "Historia", 1),
("¿Qué batalla de 1818 consolidó la Independencia de Chile?", "Batalla de Chacabuco", "Batalla de Maipú", "Batalla de Rancagua", "Batalla de Lircay", "Batalla de Maipú", "Historia", 1),
("¿En qué año ocurrió la Batalla de Chacabuco?", "1810", "1814", "1817", "1820", "1817", "Historia", 1),
("¿Cuál es el valor de 5! (factorial)?", "20", "60", "120", "240", "120", "Matematicas", 1),
("¿Cuál es la derivada de x^2?", "x", "2x", "x^2", "2x^2", "2x", "Matematicas", 1),
("¿Qué magnitud mide un barómetro?", "Temperatura", "Presión", "Humedad", "Velocidad", "Presión", "Fisica", 1),
("¿Cuál es la aceleración de gravedad aproximada en la Tierra?", "9.8 m/s^2", "8.9 m/s^2", "10.8 m/s^2", "1 g/cm^3", "9.8 m/s^2", "Fisica", 1),
("¿Qué tipo de enlace une a los átomos en el NaCl?", "Covalente", "Metálico", "Iónico", "Puente de hidrógeno", "Iónico", "Quimica", 1),
("¿Cuál es la fórmula del ácido sulfúrico?", "HCl", "H2SO4", "HNO3", "H2CO3", "H2SO4", "Quimica", 1),
("¿Qué es un sinónimo?", "Palabra de sentido opuesto", "Palabra de igual o parecido significado", "Palabra inventada", "Palabra técnica", "Palabra de igual o parecido significado", "Lenguaje", 1),
("Seleccione la palabra correctamente acentuada:", "camion", "camión", "camíon", "cami ón", "camión", "Lenguaje", 1),
("¿Qué suceso marca tradicionalmente el inicio del proceso de Independencia de Chile?", "Batalla de Maipú", "Primera Junta Nacional de Gobierno", "Batalla de Rancagua", "Guerra del Pacífico", "Primera Junta Nacional de Gobierno", "Historia", 1),
("¿En qué año fue la Primera Junta Nacional de Gobierno en Chile?", "1808", "1810", "1812", "1814", "1810", "Historia", 1),
("¿Qué tratado puso fin a la Guerra del Pacífico para Chile y Perú?", "Tratado de Ancón", "Tratado de Versalles", "Tratado de Tordesillas", "Tratado de Ayacucho", "Tratado de Ancón", "Historia", 1),
("¿Qué presidente chileno impulsó fuertemente la educación pública a fines del siglo XIX?", "Pedro Aguirre Cerda", "Arturo Alessandri Palma", "José Manuel Balmaceda", "Gabriel González Videla", "José Manuel Balmaceda", "Historia", 1);
