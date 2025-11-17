CREATE DATABASE IF NOT EXISTS BD06_RESPUESTASESTUDIANTES
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

USE BD06_RESPUESTASESTUDIANTES;
CREATE TABLE IF NOT EXISTS respuestas_alumno (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(100)    NOT NULL,
  ensayo_id     VARCHAR(200)    NOT NULL,
  fecha_iso     VARCHAR(40)     NOT NULL,
  respuestas_json JSON          NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_ensayo (username, ensayo_id),
  KEY idx_user (username),
  KEY idx_ensayo (ensayo_id)
);
