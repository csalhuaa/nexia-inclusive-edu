import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppProviders } from "@/providers/AppProviders";
import { ROUTES } from "@/constants/routes";
import { BlindStudentPage } from "@/pages/BlindStudentPage";
import { CreateSessionPage } from "@/pages/CreateSessionPage";
import { DeafStudentPage } from "@/pages/DeafStudentPage";
import { HomePage } from "@/pages/HomePage";
import { JoinSessionPage } from "@/pages/JoinSessionPage";
import { TeacherPage } from "@/pages/TeacherPage";

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.home} element={<HomePage />} />
          <Route path={ROUTES.createSession} element={<CreateSessionPage />} />
          <Route path={ROUTES.joinSession} element={<JoinSessionPage />} />
          <Route path={ROUTES.teacher} element={<TeacherPage />} />
          <Route path={ROUTES.deafStudent} element={<DeafStudentPage />} />
          <Route path={ROUTES.blindStudent} element={<BlindStudentPage />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
