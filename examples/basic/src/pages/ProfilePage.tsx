import { useNavigateWithTransition } from '@lemoncloud/react-page-transition';

import { Header } from '../components';
import { usePlatformContext } from '../context';

export const ProfilePage = () => {
    const { platform } = usePlatformContext();
    const navigate = useNavigateWithTransition({ platform });

    return (
        <div className="page">
            <Header title="Profile" />

            <div className="content">
                <div className="profile-card">
                    <div className="avatar">JD</div>
                    <h2>John Doe</h2>
                    <p>john.doe@example.com</p>
                </div>

                <section className="profile-actions">
                    <button
                        onClick={() => navigate('/settings')}
                        className="action-button"
                    >
                        Edit Settings
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="action-button secondary"
                    >
                        Go Home
                    </button>
                </section>
            </div>
        </div>
    );
};
