import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button, Table, Navbar, Nav } from 'react-bootstrap';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function App() {
  const [possessions, setPossessions] = useState([]);
  const [startDate, setStartDate] = useState(new Date('2019-01-01'));
  const [endDate, setEndDate] = useState(new Date());
  const [patrimoineValeur, setPatrimoineValeur] = useState(0);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:5000/possession");
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const json = await response.json();
        setPossessions(json.possessions);
        updateChart(json.possessions, startDate, endDate);
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };
    fetchData();
  }, [startDate, endDate]);

  const updateChart = (possessions, startDate, endDate) => {
    const labels = possessions.map(p => p.libelle);
    const data = possessions.map(p => calculerValeurActuelle(p, moment(endDate)));

    setChartData({
      labels,
      datasets: [
        {
          label: 'Valeur des Possessions',
          data,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
        }
      ]
    });
  };

  const calculerValeurActuelle = (possession, dateActuelle) => {
    const dateDebut = moment(possession.dateDebut);
    let valeurActuelle = possession.valeur;

    if (dateActuelle.isBefore(dateDebut)) {
      return 0;
    }

    const dateFin = possession.dateFin ? moment(possession.dateFin) : null;
    const effectiveEndDate = dateFin && dateFin.isBefore(dateActuelle) ? dateFin : dateActuelle;

    if (possession.tauxAmortissement > 0) {
      const dureeUtilisee = effectiveEndDate.diff(dateDebut, 'years', true);
      valeurActuelle -= (possession.tauxAmortissement / 100) * dureeUtilisee * possession.valeur;
    } else if (possession.valeurConstante && possession.jour) {
      const joursPasses = effectiveEndDate.diff(dateDebut, 'days');
      const moisPasses = Math.floor(joursPasses / 30);
      valeurActuelle = possession.valeurConstante * moisPasses;
    }

    return Math.max(valeurActuelle, 0);
  };

  const calculerValeurPatrimoine = () => {
    const dateActuelle = moment(endDate);
    let totalValeur = 0;

    const possessionsAvecValeurActuelle = possessions.map(item => {
      const valeurActuelle = calculerValeurActuelle(item, dateActuelle);
      totalValeur += valeurActuelle;
      return { ...item, valeurActuelle };
    });

    setPossessions(possessionsAvecValeurActuelle);
    setPatrimoineValeur(totalValeur);
    updateChart(possessionsAvecValeurActuelle, startDate, endDate);
  };

  return (
    <Router>
      <div className="container">
        <Navbar bg="light" expand="lg" className="navbar-custom">
          <Nav>
            <Nav.Link as={Link} to="/tableau">Tableau</Nav.Link>
            <Nav.Link as={Link} to="/graphique">Graphique</Nav.Link>
            <Nav.Link as={Link} to="/create">Ajouter Possession</Nav.Link>
          </Nav>
        </Navbar>

        <div className="main-content">
          <Routes>
            <Route path="/tableau" element={
              <div className="table-container">
                <Table striped="columns">
                  <thead>
                    <tr>
                      <th>Libellé</th>
                      <th>Valeur Initiale</th>
                      <th>Date Début</th>
                      <th>Date Fin</th>
                      <th>Amortissement</th>
                      <th>Valeur Actuelle</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {possessions.length > 0 ? (
                      possessions.map((item, index) => (
                        <tr key={index}>
                          <td>{item.libelle}</td>
                          <td>{item.valeur}</td>
                          <td>{moment(item.dateDebut).format('YYYY-MM-DD')}</td>
                          <td>{item.dateFin ? moment(item.dateFin).format('YYYY-MM-DD') : "N/A"}</td>
                          <td>{item.tauxAmortissement ? `${item.tauxAmortissement}%` : "N/A"}</td>
                          <td>{item.valeurActuelle ? item.valeurActuelle.toFixed(2) : "0"}</td>
                          <td>
                            <Button variant="warning" onClick={() => handleEdit(item.libelle)}>Modifier</Button>
                            <Button variant="danger" onClick={() => handleClose(item.libelle)}>Clôturer</Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7">Aucune donnée disponible</td>
                      </tr>
                    )}
                  </tbody>
                </Table>

                <div className="mt-3 text-center">
                  <label>Date Fin</label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    dateFormat="yyyy-MM-dd"
                    className="control ml-2"
                  />
                  <Button onClick={calculerValeurPatrimoine} className="ml-2">
                    Valider
                  </Button>
                </div>

                <div className="value-patrimoine text-center mt-3">
                  <h3>Valeur du Patrimoine: {patrimoineValeur.toFixed(2)} Ar</h3>
                </div>
              </div>
            } />
            <Route path="/graphique" element={
              <div className="chart-container">
                <h3>Graphique de Valeur des Possessions</h3>
                <div className="mt-3 text-center">
                  <label>Date Fin</label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => {
                      setEndDate(date);
                      updateChart(possessions, startDate, date);
                    }}
                    dateFormat="yyyy-MM-dd"
                    className="control ml-2"
                  />
                </div>
                <Line data={chartData} />
              </div>
            } />
            <Route path="/create" element={<CreatePossessionForm onAddPossession={handleAddPossession} />} />
            <Route path="/edit/:libelle" element={<EditPossessionForm onUpdatePossession={handleUpdatePossession} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

const handleAddPossession = async (possessionData) => {
  await fetch('http://localhost:5000/possession', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(possessionData)
  });
  const response = await fetch("http://localhost:5000/possession");
  const json = await response.json();
  setPossessions(json.possessions);
  updateChart(json.possessions, startDate, endDate);
};

const handleUpdatePossession = async (libelle, updatedData) => {
  await fetch(`http://localhost:5000/possession/${libelle}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedData)
  });
  const response = await fetch("http://localhost:5000/possession");
  const json = await response.json();
  setPossessions(json.possessions);
  updateChart(json.possessions, startDate, endDate);
};

const handleClose = async (libelle) => {
  await fetch(`http://localhost:5000/possession/${libelle}/close`, {
    method: 'PUT',
  });
  const response = await fetch("http://localhost:5000/possession");
  const json = await response.json();
  setPossessions(json.possessions);
  updateChart(json.possessions, startDate, endDate);
};

const handleEdit = (libelle) => {
  
};

const CreatePossessionForm = ({ onAddPossession }) => {
  const [libelle, setLibelle] = useState("");
  const [valeur, setValeur] = useState("");
  const [dateDebut, setDateDebut] = useState(new Date());
  const [dateFin, setDateFin] = useState(null);
  const [tauxAmortissement, setTauxAmortissement] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const possessionData = {
      libelle,
      valeur: parseFloat(valeur),
      dateDebut: moment(dateDebut).format('YYYY-MM-DD'),
      dateFin: dateFin ? moment(dateFin).format('YYYY-MM-DD') : null,
      tauxAmortissement: parseFloat(tauxAmortissement)
    };

    await onAddPossession(possessionData);

    setLibelle("");
    setValeur("");
    setDateDebut(new Date());
    setDateFin(null);
    setTauxAmortissement("");
  };

  return (
    <div className="create-form">
      <h3>Ajouter une Nouvelle Possession</h3>
      <form onSubmit={handleSubmit}>
        <label>Libellé</label>
        <input type="text" value={libelle} onChange={(e) => setLibelle(e.target.value)} required />

        <label>Valeur</label>
        <input type="number" value={valeur} onChange={(e) => setValeur(e.target.value)} required />

        <label>Date Début</label>
        <DatePicker selected={dateDebut} onChange={(date) => setDateDebut(date)} dateFormat="yyyy-MM-dd" />

        <label>Date Fin </label>
        <DatePicker selected={dateFin} onChange={(date) => setDateFin(date)} dateFormat="yyyy-MM-dd" />

        <label>Taux d'Amortissement (%)</label>
        <input type="number" value={tauxAmortissement} onChange={(e) => setTauxAmortissement(e.target.value)} />

        <Button type="submit">Ajouter</Button>
      </form>
    </div>
  );
};

const EditPossessionForm = ({ onUpdatePossession }) => {
};

export default App;
