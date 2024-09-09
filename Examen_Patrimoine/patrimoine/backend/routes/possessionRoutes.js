import express from 'express';
import possessions from '../models/possessions.js';
import moment from 'moment';

const router = express.Router();


router.get('/', (req, res) => {
  res.json(possessions);
});

router.post('/', (req, res) => {
  const { libelle, valeur, dateDebut, tauxAmortissement, valeurConstante, jour } = req.body;
  possessions.push({
    libelle,
    valeur,
    dateDebut: moment(dateDebut).toISOString(),
    tauxAmortissement,
    valeurConstante,
    jour,
    dateFin: null,
  });
  res.status(201).json({ message: 'Possession créée avec succès' });
});

router.put('/:libelle', (req, res) => {
  const { libelle } = req.params;
  const { dateFin } = req.body;

  const possession = possessions.find(p => p.libelle === libelle);
  if (possession) {
    possession.dateFin = moment(dateFin).toISOString();
    res.json({ message: 'Possession mise à jour avec succès' });
  } else {
    res.status(404).json({ message: 'Possession non trouvée' });
  }
});

router.post('/:libelle/close', (req, res) => {
  const { libelle } = req.params;

  const possession = possessions.find(p => p.libelle === libelle);
  if (possession) {
    possession.dateFin = moment().toISOString();
    res.json({ message: 'Possession clôturée avec succès' });
  } else {
    res.status(404).json({ message: 'Possession non trouvée' });
  }
});

router.get('/patrimoine/:date', (req, res) => {
  const { date } = req.params;
  const dateActuelle = moment(date);
  let totalValeur = 0;

  possessions.forEach(possession => {
    if (!possession.dateFin || moment(possession.dateFin).isAfter(dateActuelle)) {
      let valeurActuelle = possession.valeur;

      if (possession.tauxAmortissement) {
        const dureeUtilisee = dateActuelle.diff(moment(possession.dateDebut), 'years', true);
        valeurActuelle -= (possession.tauxAmortissement / 100) * dureeUtilisee * possession.valeur;
      } else if (possession.valeurConstante) {
        const joursPasses = dateActuelle.diff(moment(possession.dateDebut), 'days');
        const moisPasses = Math.floor(joursPasses / 30);
        valeurActuelle = possession.valeurConstante * moisPasses;
      }

      totalValeur += valeurActuelle < 0 ? 0 : valeurActuelle;
    }
  });

  res.json({ valeur: totalValeur });
});

export default router;
