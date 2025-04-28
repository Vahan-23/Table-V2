import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HallViewer from './components/HallViewer';
import ResponsiveSeatingArrangement from './components/ResponsiveSeatingArrangement';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Главная страница будет показывать рассадку */}
          <Route path="/" element={<ResponsiveSeatingArrangement />} />

          {/* Страница /hallview будет показывать HallViewer */}
          <Route path="/hallview" element={<HallViewer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
