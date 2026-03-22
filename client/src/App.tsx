import { Route, Router, Switch } from "wouter";
import QuizPage from "@/pages/quiz";
import AnalyticsPage from "@/pages/analytics";

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={QuizPage} />
        <Route path="/analytics" component={AnalyticsPage} />
      </Switch>
    </Router>
  );
}

export default App;
