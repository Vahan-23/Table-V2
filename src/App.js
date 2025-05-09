import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HallViewer from './components/HallViewer';
import ResponsiveSeatingArrangement from './components/ResponsiveSeatingArrangement';
import ClientBookingComponent from './components/ClientBookingComponent';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Главная страница будет показывать рассадку */}
          <Route path="/" element={<ResponsiveSeatingArrangement />} />

          {/* Страница /hallview будет показывать HallViewer */}
          <Route path="/hallview" element={<HallViewer />} />
          <Route path="/client" element={<ClientBookingComponent />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
