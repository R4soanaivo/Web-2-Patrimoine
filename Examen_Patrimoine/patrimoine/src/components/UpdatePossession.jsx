import { useState } from 'react';
import { useParams } from 'react-router-dom';
import DatePicker from "react-datepicker";

function UpdatePossession() {
  const { libelle } = useParams();
  const [dateFin, setDateFin] = useState(new Date());

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(`http://localhost:5000/possession/${libelle}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateFin })
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Edit Possession: {libelle}</h2>
      <DatePicker selected={dateFin} onChange={date => setDateFin(date)} />
      <button type="submit">Update</button>
    </form>
  );
}

export default UpdatePossession;
