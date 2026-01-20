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
   nom VARCHAR(50)  NOT NULL,
   PRIMARY KEY(id_entreprise)
);

CREATE TABLE sexe(
   id_sexe SERIAL,
   libelle VARCHAR(50) ,
   PRIMARY KEY(id_sexe)
);

CREATE TABLE parametre(
   id_parametre SERIAL,
   tentative_max INTEGER NOT NULL,
   PRIMARY KEY(id_parametre)
);

CREATE TABLE utilisateur(
   id_utilisateur SERIAL,
   identifiant VARCHAR(50)  NOT NULL,
   mdp VARCHAR(250)  NOT NULL,
   nom VARCHAR(50)  NOT NULL,
   prenom VARCHAR(50)  NOT NULL,
   dtn DATE NOT NULL,
   email VARCHAR(50) ,
   id_sexe INTEGER NOT NULL,
   id_type_utilisateur INTEGER NOT NULL,
   PRIMARY KEY(id_utilisateur),
   UNIQUE(identifiant),
   FOREIGN KEY(id_sexe) REFERENCES sexe(id_sexe),
   FOREIGN KEY(id_type_utilisateur) REFERENCES type_utilisateur(id_type_utilisateur)
);

CREATE TABLE signalement(
   id_signalement SERIAL,
   daty TIMESTAMP,
   surface NUMERIC(15,2)  ,
   budget NUMERIC(15,2)  ,
   description TEXT,
   photo VARCHAR(150) ,
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
   image VARCHAR(250) ,
   description TEXT,
   id_statut INTEGER NOT NULL,
   id_signalement INTEGER NOT NULL,
   PRIMARY KEY(id_histo_statut),
   FOREIGN KEY(id_statut) REFERENCES statut(id_statut),
   FOREIGN KEY(id_signalement) REFERENCES signalement(id_signalement)
);

CREATE TABLE statut_utilisateur(
   id_statut_utilisateur SERIAL,
   date_ TIMESTAMP NOT NULL,
   etat INTEGER NOT NULL,
   id_utilisateur INTEGER NOT NULL,
   PRIMARY KEY(id_statut_utilisateur),
   FOREIGN KEY(id_utilisateur) REFERENCES utilisateur(id_utilisateur)
);
