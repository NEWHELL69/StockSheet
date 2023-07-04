import './css/app.css';
import Header from './components/Header/Header.js';

function App() {
  return (
    <div className="app">
      <Header></Header>
      <main>
        <button id="header-open-btn">+</button>
        <p>Hello! I am inside main tag.</p>
      </main>
    </div>
  );
}

export default App;
