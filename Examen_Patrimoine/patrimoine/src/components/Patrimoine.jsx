import { useState } from 'react';
import DatePicker from "react-datepicker";
import { Line } from 'react-chartjs-2';
import 'react-datepicker/dist/react-datepicker.css';

function Patrimoine() {
  const [dateDebut, setDateDebut] = useState(new Date());
  const [dateFin, setDateFin] = useState(new Date());
  const [jour, setJour] = useState(1);
  const [chartData, setChartData] = useState({});

  const handleValidateRange = async () => {
    const response = await fetch('/patrimoine/range', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateDebut, dateFin, jour })
    });
    const data = await response.json();
    setChartData({
      labels: data.dates,
      datasets: [{
        label: 'Valeur du Patrimoine',
        data: data.valeurs,
        borderColor: 'rgba(75,192,192,1)',
        fill: false,
      }]
    });
  };

  return (
    <div>
      <div className="mb-3">
        <DatePicker selected={dateDebut} onChange={date => setDateDebut(date)} />
        <DatePicker selected={dateFin} onChange={date => setDateFin(date)} />
        <input type="number" value={jour} onChange={e => setJour(e.target.value)} />
        <button onClick={handleValidateRange}>Validate</button>
      </div>
      <Line data={chartData} />
    </div>
  );
}

export default Patrimoine;
