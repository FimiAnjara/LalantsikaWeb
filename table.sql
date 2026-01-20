CREATE TABLE type_utilisateur(
   id_type_utilisateur SERIAL,
   libelle VARCHAR(50)  NOT NULL,
   PRIMARY KEY(id_type_utilisateur),
   UNIQUE(libelle)
);

CREATE TABLE statut(
   id_statut SERIAL,
   libelle VARCHAR(50)  NOT NULL,
   PRIMARY KEY(id_statut),
   UNIQUE(libelle)
);

CREATE TABLE point(
   id_point SERIAL,
   coordonnee GEOGRAPHY NOT NULL,
   PRIMARY KEY(id_point)
);

CREATE TABLE entreprise(
   id_entreprise SERIAL,
   nom VARCHAR(250)  NOT NULL,
   PRIMARY KEY(id_entreprise)
);

CREATE TABLE utilisateur(
   id_utilisateur SERIAL,
   identifiant VARCHAR(50)  NOT NULL,
   mdp VARCHAR(150)  NOT NULL,
   id_type_utilisateur INTEGER NOT NULL,
   PRIMARY KEY(id_utilisateur),
   UNIQUE(identifiant),
   FOREIGN KEY(id_type_utilisateur) REFERENCES type_utilisateur(id_type_utilisateur)
);

CREATE TABLE signalement(
   id_signalement SERIAL,
   daty TIMESTAMP,
   id_entreprise INTEGER,
   id_utilisateur INTEGER NOT NULL,
   id_statut INTEGER NOT NULL,
   id_point INTEGER NOT NULL,
   PRIMARY KEY(id_signalement),
   UNIQUE(id_point),
   FOREIGN KEY(id_entreprise) REFERENCES entreprise(id_entreprise),
   FOREIGN KEY(id_utilisateur) REFERENCES utilisateur(id_utilisateur),
   FOREIGN KEY(id_statut) REFERENCES statut(id_statut),
   FOREIGN KEY(id_point) REFERENCES point(id_point)
);

CREATE TABLE histo_statut(
   id_histo_statut SERIAL,
   daty TIMESTAMP,
   id_statut INTEGER NOT NULL,
   id_signalement INTEGER NOT NULL,
   PRIMARY KEY(id_histo_statut),
   FOREIGN KEY(id_statut) REFERENCES statut(id_statut),
   FOREIGN KEY(id_signalement) REFERENCES signalement(id_signalement)
);
