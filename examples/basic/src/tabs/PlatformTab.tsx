import { useNavigateWithTransition } from '@lemoncloud/react-page-transition';

import { DemoCard } from '../components';
import { usePlatformContext } from '../context';

export const PlatformTab = () => {
    const { platform } = usePlatformContext();
    const navigate = useNavigateWithTransition({ platform });

    return (
        <div className="tab-content">
            <div className="tab-header">
                <h2>Platform Animations</h2>
                <p>Compare iOS and Android transition styles</p>
            </div>

            <div className="demo-grid">
                <DemoCard
                    title="iOS Style"
                    description="Horizontal slide animation"
                    code={`navigate('/page')\n// with platform: 'ios'`}
                >
                    <button
                        className="demo-btn ios"
                        onClick={() => navigate('/detail/ios', { animation: 'slide' })}
                    >
                        <span className="demo-btn-icon">➡️</span>
                        <span>Slide Right</span>
                    </button>
                </DemoCard>

                <DemoCard
                    title="Android Style"
                    description="Vertical lift animation"
                    code={`navigate('/page')\n// with platform: 'android'`}
                >
                    <button
                        className="demo-btn android"
                        onClick={() => navigate('/detail/android', { animation: 'lift' })}
                    >
                        <span className="demo-btn-icon">⬆️</span>
                        <span>Lift Up</span>
                    </button>
                </DemoCard>
            </div>

            <DemoCard
                title="Auto Detection"
                description="Uses current platform setting from config bar"
                code={`const navigate = useNavigateWithTransition({ platform });\nnavigate('/detail/1');`}
            >
                <button
                    className="demo-btn primary"
                    onClick={() => navigate('/detail/auto')}
                >
                    Navigate with Current Platform
                </button>
            </DemoCard>
        </div>
    );
};
