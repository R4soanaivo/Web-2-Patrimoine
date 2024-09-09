import express from 'express';
import cors from 'cors';
import moment from 'moment';
import { possessions } from './models/possessions.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/possession', (req, res) => {
  res.json({ possessions });
});

app.get('/possession/:libelle', (req, res) => {
  const { libelle } = req.params;
  const possession = possessions.find(p => p.libelle === libelle);
  if (possession) {
    res.json(possession);
  } else {
    res.status(404).json({ error: 'Possession not found' });
  }
});

app.post('/possession', (req, res) => {
  const { possesseur, libelle, valeur, dateDebut, tauxAmortissement, dateFin, jour, valeurConstante } = req.body;
  const newPossession = { possesseur, libelle, valeur, dateDebut, tauxAmortissement, dateFin, jour, valeurConstante };
  possessions.push(newPossession);
  res.status(201).json(newPossession);
});

app.put('/possession/:libelle', (req, res) => {
  const { libelle } = req.params;
  const { dateFin } = req.body;
  const index = possessions.findIndex(p => p.libelle === libelle);

  if (index !== -1) {
    possessions[index].dateFin = dateFin;
    res.json(possessions[index]);
  } else {
    res.status(404).json({ error: 'Possession not found' });
  }
});

app.delete('/possession/:libelle', (req, res) => {
  const { libelle } = req.params;
  const index = possessions.findIndex(p => p.libelle === libelle);

  if (index !== -1) {
    possessions.splice(index, 1);
    res.status(204).end();
  } else {
    res.status(404).json({ error: 'Possession not found' });
  }
});

const calculateValeurActuelle = (possession, dateActuelle) => {
  const dateDebut = moment(possession.dateDebut);
  let valeurActuelle = possession.valeur;

  if (possession.tauxAmortissement > 0) {
    const dureeUtilisee = dateActuelle.diff(dateDebut, 'years', true);
    valeurActuelle -= (possession.tauxAmortissement / 100) * dureeUtilisee * possession.valeur;
  } else if (possession.valeurConstante && possession.jour) {
    const joursPasses = dateActuelle.diff(dateDebut, 'days');
    const moisPasses = Math.floor(joursPasses / 30);
    valeurActuelle = possession.valeurConstante * moisPasses;
  }

  return Math.max(valeurActuelle, 0);
};

app.get('/patrimoine/:date', (req, res) => {
  const { date } = req.params;
  const selectedDate = moment(date);
  let totalValeur = 0;

  possessions.forEach(possession => {
    if (!possession.dateFin || moment(possession.dateFin).isAfter(selectedDate)) {
      totalValeur += calculateValeurActuelle(possession, selectedDate);
    }
  });

  res.json({ date, valeur: totalValeur });
});

app.post('/patrimoine/range', (req, res) => {
  const { dateDebut, dateFin } = req.body;
  const endDate = moment(dateFin);
  let totalValeur = 0;

  possessions.forEach(possession => {
    if (!possession.dateFin || moment(possession.dateFin).isAfter(endDate)) {
      const currentValue = calculateValeurActuelle(possession, endDate);
      totalValeur += currentValue;
    }
  });

  res.json({ dateDebut, dateFin, valeur: totalValeur });
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
