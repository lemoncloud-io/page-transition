import { useNavigateWithTransition } from '@lemoncloud/react-page-transition';

import { Header } from '../components';
import { usePlatformContext } from '../context';

export const SettingsPage = () => {
    const { platform } = usePlatformContext();
    const navigate = useNavigateWithTransition({ platform });

    return (
        <div className="page">
            <Header title="Settings" />

            <div className="content">
                <section className="settings-section">
                    <h2>Preferences</h2>
                    <div className="setting-item">
                        <span>Notifications</span>
                        <input type="checkbox" defaultChecked />
                    </div>
                    <div className="setting-item">
                        <span>Dark Mode</span>
                        <input type="checkbox" />
                    </div>
                </section>

                <section className="settings-section">
                    <h2>Navigation Examples</h2>

                    <div className="example-buttons">
                        <button
                            onClick={() => navigate('/profile')}
                            className="example-button"
                        >
                            Go to Profile (with transition)
                        </button>

                        <button
                            onClick={() => navigate('/profile', { transition: false })}
                            className="example-button secondary"
                        >
                            Go to Profile (no transition)
                        </button>

                        <button
                            onClick={() => navigate('/', { replace: true })}
                            className="example-button secondary"
                        >
                            Replace to Home (no transition by default)
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};
