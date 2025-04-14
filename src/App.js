import './App.css';
import FigmaStyleCanvas from './components/hall';
import DraggableTables from './components/hall';
import TablesAreaComponent from './components/newhall';
import ResponsiveSeatingArrangement from './components/ResponsiveSeatingArrangement';
import SeatingArrangement from './components/SeatingArrangement';
function App() {
  return (
    <div className="App">
       <ResponsiveSeatingArrangement />
      {/* <SeatingArrangement /> */}
      {/* <FigmaStyleCanvas /> */}
      {/* <TablesAreaComponent /> */}
    </div>
  );
}

export default App;
