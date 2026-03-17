import { useNavigateWithTransition, detectPlatform } from '@lemoncloud/react-page-transition';

import { Header } from '../components';
import { usePlatformContext } from '../context';

export const HomePage = () => {
    const { platform: selectedPlatform, setPlatform } = usePlatformContext();
    const navigate = useNavigateWithTransition({
        platform: selectedPlatform,
    });
    const detectedPlatform = detectPlatform();

    const items = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        title: `Item ${i + 1}`,
        description: `Description for item ${i + 1}. Click to see the transition animation.`,
    }));

    return (
        <div className="page">
            <Header title="Home" showBack={false} />

            <div className="content">
                <div className="platform-info">
                    <p>
                        Detected: <strong>{detectedPlatform ?? 'Desktop'}</strong>
                    </p>
                    <p>
                        Animation: <strong>{selectedPlatform === 'auto' ? 'Auto (iOS default)' : selectedPlatform.toUpperCase()}</strong>
                    </p>
                </div>

                <div className="platform-switcher">
                    <span>Animation Style:</span>
                    <div className="platform-buttons">
                        <button
                            className={`platform-btn ${selectedPlatform === 'auto' ? 'active' : ''}`}
                            onClick={() => setPlatform('auto')}
                        >
                            Auto
                        </button>
                        <button
                            className={`platform-btn ${selectedPlatform === 'ios' ? 'active' : ''}`}
                            onClick={() => setPlatform('ios')}
                        >
                            iOS
                        </button>
                        <button
                            className={`platform-btn ${selectedPlatform === 'android' ? 'active' : ''}`}
                            onClick={() => setPlatform('android')}
                        >
                            Android
                        </button>
                    </div>
                </div>

                <nav className="nav-buttons">
                    <button onClick={() => navigate('/settings')} className="nav-button">
                        Settings
                    </button>
                    <button onClick={() => navigate('/profile')} className="nav-button">
                        Profile
                    </button>
                </nav>

                <section className="item-list">
                    <h2>Items</h2>
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="item-card"
                            onClick={() => navigate(`/detail/${item.id}`)}
                        >
                            <h3>{item.title}</h3>
                            <p>{item.description}</p>
                        </div>
                    ))}
                </section>
            </div>
        </div>
    );
};
