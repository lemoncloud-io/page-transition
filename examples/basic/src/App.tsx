import { Routes, Route, Outlet } from 'react-router-dom';

import { ConfigBar, TabNav } from './components';
import { usePlatformContext } from './context';
import { DetailPage } from './pages';
import { PlatformTab, AnimationTab, OptionsTab } from './tabs';

const AppLayout = () => {
    const { platform, setPlatform } = usePlatformContext();

    return (
        <div className="app">
            <header className="app-header">
                <h1>@lemoncloud/react-page-transition</h1>
                <p className="app-subtitle">iOS/Android style page transitions</p>
            </header>

            <TabNav />

            <main className="app-main">
                <Outlet />
            </main>

            <ConfigBar platform={platform} onPlatformChange={setPlatform} />
        </div>
    );
};

export const App = () => {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route path="/" element={<PlatformTab />} />
                <Route path="/animation" element={<AnimationTab />} />
                <Route path="/options" element={<OptionsTab />} />
            </Route>
            <Route path="/detail/:id" element={<DetailPage />} />
        </Routes>
    );
};
