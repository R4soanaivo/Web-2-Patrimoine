import { useState } from 'react';
import DatePicker from "react-datepicker";

function CreatePossession() {
  const [libelle, setLibelle] = useState('');
  const [valeur, setValeur] = useState(0);
  const [dateDebut, setDateDebut] = useState(new Date());
  const [taux, setTaux] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:5000/possession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ libelle, valeur, dateDebut, taux })
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" value={libelle} onChange={e => setLibelle(e.target.value)} placeholder="Libellé" />
      <input type="number" value={valeur} onChange={e => setValeur(e.target.value)} placeholder="Valeur" />
      <DatePicker selected={dateDebut} onChange={date => setDateDebut(date)} />
      <input type="number" value={taux} onChange={e => setTaux(e.target.value)} placeholder="Taux d'Amortissement" />
      <button type="submit">Create</button>
    </form>
  );
}

export default CreatePossession;
