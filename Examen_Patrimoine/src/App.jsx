import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { Button, Table, Navbar, Nav, Modal, Form, Card, Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { FaHome, FaChartLine, FaListAlt } from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function App() {
  const [possession, setPossession] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [patrimoineValeur, setPatrimoineValeur] = useState(0);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });
  const [selectedPossession, setSelectedPossession] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newDateFin, setNewDateFin] = useState(new Date());

  useEffect(() => {
    const doFetch = async () => {
      try {
        const response = await fetch("http://localhost:5000/possession");
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const json = await response.json();
        setPossession(json.possessions);
        updateChart(json.possessions, startDate, endDate);
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };
    doFetch();
  }, [startDate, endDate]);

  const updateChart = (possessions, startDate, endDate) => {
    const labels = possessions.map(p => p.libelle);
    const data = possessions.map(p => {
      const valeur = calculerValeurActuelle(p, moment(endDate));
      return valeur;
    });

    setChartData({
      labels,
      datasets: [
        {
          label: 'Valeur des Possessions',
          data,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
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

  const calculerValeurPatrimoine = async () => {
    const dateActuelle = moment(endDate);
    let totalValeur = 0;

    const possessionsAvecValeurActuelle = possession.map(item => {
      const valeurActuelle = calculerValeurActuelle(item, dateActuelle);
      totalValeur += valeurActuelle;
      return { ...item, valeurActuelle };
    });

    setPossession(possessionsAvecValeurActuelle);
    setPatrimoineValeur(totalValeur);
    updateChart(possessionsAvecValeurActuelle, startDate, endDate);
  };

  const handleModify = async () => {
    if (!selectedPossession) return;

    try {
      const response = await fetch(`http://localhost:5000/possession/${selectedPossession.libelle}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newLibelle: selectedPossession.libelle,
          valeur: selectedPossession.valeur,
          dateDebut: selectedPossession.dateDebut,
          dateFin: newDateFin ? moment(newDateFin).format('YYYY-MM-DD') : null,
          tauxAmortissement: selectedPossession.tauxAmortissement,
          valeurConstante: selectedPossession.valeurConstante,
          jour: selectedPossession.jour
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la modification');
      }

      const json = await response.json();
      setPossession(prev => prev.map(p => p.libelle === selectedPossession.libelle ? json : p));
      setShowModal(false);
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
    }
  };

  const handleClose = async (libelle) => {
    try {
      const response = await fetch(`http://localhost:5000/possession/${libelle}/close`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la clôture');
      }

      const json = await response.json();
      setPossession(prev => prev.map(p => p.libelle === libelle ? json : p));
    } catch (error) {
      console.error('Erreur lors de la clôture:', error);
    }
  };

  return (
    <Router>
      <Navbar bg="primary" variant="dark" expand="lg" className="mb-4">
        <Navbar.Brand as={Link} to="/">
          <FaHome /> <span className="ms-2">BudgetMaster</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/patrimoine" className="text-light">
              <FaChartLine /> <span className="ms-2">Patrimoine</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/possession" className="text-light">
              <FaListAlt /> <span className="ms-2">Possessions</span>
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      <Container>
        <Routes>
          <Route path="/patrimoine" element={
            <Card className="mb-4" bg="light">
              <Card.Header as="h5" className="bg-primary text-white">Patrimoine</Card.Header>
              <Card.Body>
                <DatePicker selected={startDate} onChange={date => setStartDate(date)} className="form-control mb-3" placeholderText="Date de début" />
                <DatePicker selected={endDate} onChange={date => setEndDate(date)} className="form-control mb-3" placeholderText="Date de fin" />
                <Button onClick={calculerValeurPatrimoine} variant="success">Calculer</Button>
                <Card.Text className="mt-3">
                  <h3>Valeur Totale: <span className="text-success">{patrimoineValeur}</span></h3>
                </Card.Text>
                <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </Card.Body>
            </Card>
          } />

          <Route path="/possession" element={
            <Card className="mb-4" bg="light">
              <Card.Header as="h5" className="bg-primary text-white">Liste des Possessions</Card.Header>
              <Card.Body>
                <Button as={Link} to="/possession/create" variant="success" className="mb-3">Ajouter Nouvelle Possession</Button>
                <Table striped bordered hover variant="light">
                  <thead className="bg-primary text-light">
                    <tr>
                      <th>Libelle</th>
                      <th>Valeur</th>
                      <th>Date Début</th>
                      <th>Date Fin</th>
                      <th>Taux</th>
                      <th>Valeur Actuelle</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {possession.map(item => (
                      <tr key={item.libelle}>
                        <td>{item.libelle}</td>
                        <td>{item.valeur}</td>
                        <td>{item.dateDebut}</td>
                        <td>{item.dateFin || 'N/A'}</td>
                        <td>{item.tauxAmortissement}</td>
                        <td>{calculerValeurActuelle(item, moment())}</td>
                        <td>
                          <Button 
                            onClick={() => { 
                              setSelectedPossession(item); 
                              setShowModal(true); 
                            }} 
                            variant="warning" 
                            size="sm" className="me-2">
                            Modifier
                          </Button>
                          <Button 
                            onClick={() => handleClose(item.libelle)} 
                            variant="danger" 
                            size="sm">
                            Clôturer
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          } />

          <Route path="/possession/create" element={
            <Card className="mb-4" bg="light">
              <Card.Header as="h5" className="bg-primary text-white">Ajouter Nouvelle Possession</Card.Header>
              <Card.Body>
                {/* Formulaire pour ajouter une nouvelle possession */}
              </Card.Body>
            </Card>
          } />
        </Routes>
      </Container>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Modifier Possession</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formLibelle">
              <Form.Label>Libelle</Form.Label>
              <Form.Control
                type="text"
                value={selectedPossession?.libelle || ''}
                onChange={(e) => setSelectedPossession({ ...selectedPossession, libelle: e.target.value })}
              />
            </Form.Group>
            <Form.Group controlId="formValeur">
              <Form.Label>Valeur</Form.Label>
              <Form.Control
                type="number"
                value={selectedPossession?.valeur || ''}
                onChange={(e) => setSelectedPossession({ ...selectedPossession, valeur: e.target.value })}
              />
            </Form.Group>
            <Form.Group controlId="formDateDebut">
              <Form.Label>Date Début</Form.Label>
              <Form.Control
                type="date"
                value={selectedPossession?.dateDebut || ''}
                onChange={(e) => setSelectedPossession({ ...selectedPossession, dateDebut: e.target.value })}
              />
            </Form.Group>
            <Form.Group controlId="formDateFin">
              <Form.Label>Date Fin</Form.Label>
              <DatePicker
                selected={newDateFin ? new Date(newDateFin) : null}
                onChange={date => setNewDateFin(date)}
                className="form-control"
                placeholderText="Date de fin"
              />
            </Form.Group>
            <Form.Group controlId="formTauxAmortissement">
              <Form.Label>Taux Amortissement</Form.Label>
              <Form.Control
                type="number"
                value={selectedPossession?.tauxAmortissement || ''}
                onChange={(e) => setSelectedPossession({ ...selectedPossession, tauxAmortissement: e.target.value })}
              />
            </Form.Group>
            <Form.Group controlId="formValeurConstante">
              <Form.Label>Valeur Constante</Form.Label>
              <Form.Control
                type="number"
                value={selectedPossession?.valeurConstante || ''}
                onChange={(e) => setSelectedPossession({ ...selectedPossession, valeurConstante: e.target.value })}
              />
            </Form.Group>
            <Form.Group controlId="formJour">
              <Form.Label>Jour</Form.Label>
              <Form.Control
                type="text"
                value={selectedPossession?.jour || ''}
                onChange={(e) => setSelectedPossession({ ...selectedPossession, jour: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Fermer
          </Button>
          <Button variant="primary" onClick={handleModify}>
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal>
    </Router>
  );
}

export default App;
