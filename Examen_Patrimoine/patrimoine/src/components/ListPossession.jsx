import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function ListPossession() {
  const [possessions, setPossessions] = useState([]);

  useEffect(() => {
    const fetchPossessions = async () => {
      const response = await fetch('http://localhost:5000/possession');
      const data = await response.json();
      setPossessions(data);
    };
    fetchPossessions();
  }, []);

  const handleClose = async (libelle) => {
    await fetch(`http://localhost:5000/possession/${libelle}/close`, { method: 'POST' });
    setPossessions(possessions.filter(possession => possession.libelle !== libelle));
  };

  return (
    <div>
      <Link to="/possession/create">
        <button>Create Possession</button>
      </Link>
      <table>
        <thead>
          <tr>
            <th>Libellé</th>
            <th>Valeur</th>
            <th>Date Début</th>
            <th>Date Fin</th>
            <th>Taux</th>
            <th>Valeur Actuelle</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {possessions.map(possession => (
            <tr key={possession.libelle}>
              <td>{possession.libelle}</td>
              <td>{possession.valeur}</td>
              <td>{new Date(possession.dateDebut).toLocaleDateString()}</td>
              <td>{possession.dateFin ? new Date(possession.dateFin).toLocaleDateString() : 'N/A'}</td>
              <td>{possession.tauxAmortissement}%</td>
              <td>{possession.valeurActuelle}</td>
              <td>
                <Link to={`/possession/${possession.libelle}/update`}>Edit</Link>
                <button onClick={() => handleClose(possession.libelle)}>Close</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ListPossession;
