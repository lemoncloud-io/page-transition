import { Routes, Route } from 'react-router-dom';

import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { DetailPage } from './pages/DetailPage';

export const App = () => {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/detail/:id" element={<DetailPage />} />
        </Routes>
    );
};
