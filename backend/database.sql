-- Schema for iRRIG+ (Gestion d'Irrigation Agricole) - Alignement CdC

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Users (Agriculteurs & Admins)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'agriculteur' CHECK (role IN ('agriculteur', 'admin')),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pompes
CREATE TABLE IF NOT EXISTS pompes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nom VARCHAR(150) NOT NULL,
    debit_m3_h NUMERIC(10,2) NOT NULL CHECK (debit_m3_h > 0),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enrouleurs (et buses)
-- surface_travail = largeur de travail de l'enrouleur en mètres (ex: 80m)
CREATE TABLE IF NOT EXISTS enrouleurs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nom VARCHAR(150) NOT NULL,
    surface_travail NUMERIC(10,2),
    taille_buse VARCHAR(100) NOT NULL,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Champs (Parcelles)
CREATE TABLE IF NOT EXISTS champs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nom_champ VARCHAR(150) NOT NULL,
    surface_m2 NUMERIC(12,2) NOT NULL CHECK (surface_m2 > 0),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Irrigations (Sessions)
CREATE TABLE IF NOT EXISTS irrigations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    champ_id INTEGER NOT NULL REFERENCES champs(id) ON DELETE CASCADE,
    pompe_id INTEGER NOT NULL REFERENCES pompes(id) ON DELETE CASCADE,
    enrouleur_id INTEGER NOT NULL REFERENCES enrouleurs(id) ON DELETE CASCADE,
    type_culture VARCHAR(100) NOT NULL,
    distance_deroulee NUMERIC(10,2),
    taille_buse_session VARCHAR(100),
    largeur_travail NUMERIC(10,2),
    dose_mm NUMERIC(10,2),
    duree_h NUMERIC(10,2),
    methode_calcul VARCHAR(10) NOT NULL CHECK (methode_calcul IN ('dose', 'temps')),
    volume_total_m3 NUMERIC(14,2) NOT NULL CHECK (volume_total_m3 >= 0),
    date_debut TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_fin TIMESTAMP,
    statut VARCHAR(20) DEFAULT 'fini' CHECK (statut IN ('programme', 'lance', 'fini')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compensations (Restitution rivière pour la DDT)
CREATE TABLE IF NOT EXISTS compensations (
    id SERIAL PRIMARY KEY,
    date_jour DATE UNIQUE NOT NULL,
    volume_total_pompe_m3 NUMERIC(14,2) NOT NULL,
    volume_restitue_m3 NUMERIC(14,2) NOT NULL,
    valide_par_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin par défaut (password: password123)
INSERT INTO users (nom, email, mot_de_passe, role)
VALUES ('Admin', 'admin@irrigplus.local', '$2b$10$exLhm04NXkHQU0.NUM..neg.QxmB/lOwo2DuEuFV6esOuuTCuQB9O', 'admin');

-- Agriculteur de démo (password: password123)
INSERT INTO users (nom, email, mot_de_passe, role)
VALUES ('Jean Agriculteur', 'jean@agri.local', '$2b$10$exLhm04NXkHQU0.NUM..neg.QxmB/lOwo2DuEuFV6esOuuTCuQB9O', 'agriculteur');

-- Données de démo pour l'agriculteur
INSERT INTO champs (user_id, nom_champ, surface_m2) VALUES (2, 'Champ du Moulin', 20000);
INSERT INTO champs (user_id, nom_champ, surface_m2) VALUES (2, 'Parcelle Ouest', 35000);

INSERT INTO pompes (user_id, nom, debit_m3_h) VALUES (2, 'Pompe Principale 100m3', 100.00);
INSERT INTO pompes (user_id, nom, debit_m3_h) VALUES (2, 'Petite Pompe 20m3', 20.00);

-- surface_travail = largeur de travail en mètres
INSERT INTO enrouleurs (user_id, nom, surface_travail, taille_buse) VALUES (2, 'Enrouleur 300m', 60, '22mm');
INSERT INTO enrouleurs (user_id, nom, surface_travail, taille_buse) VALUES (2, 'Enrouleur 500m', 80, '26mm');

-- Indices de performance
CREATE INDEX IF NOT EXISTS idx_champs_actif ON champs(actif);
CREATE INDEX IF NOT EXISTS idx_pompes_actif ON pompes(actif);
CREATE INDEX IF NOT EXISTS idx_enrouleurs_actif ON enrouleurs(actif);
CREATE INDEX IF NOT EXISTS idx_irrigations_user ON irrigations(user_id);
CREATE INDEX IF NOT EXISTS idx_irrigations_date ON irrigations(date_debut);
CREATE INDEX IF NOT EXISTS idx_compensations_date ON compensations(date_jour);

-- Activity Logs (Journal d'activité admin)
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entite VARCHAR(50),
    entite_id INTEGER,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
