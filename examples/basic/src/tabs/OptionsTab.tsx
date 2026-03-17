import { useNavigateWithTransition } from '@lemoncloud/react-page-transition';

import { DemoCard } from '../components';
import { usePlatformContext } from '../context';

export const OptionsTab = () => {
    const { platform } = usePlatformContext();
    const navigate = useNavigateWithTransition({ platform });

    const handleAwait = async () => {
        console.log('🚀 Starting navigation...');
        await navigate('/detail/await');
        console.log('✅ Transition complete!');
    };

    return (
        <div className="tab-content">
            <div className="tab-header">
                <h2>Navigation Options</h2>
                <p>Fine-tune transition behavior</p>
            </div>

            <DemoCard
                title="direction"
                description="Control animation direction for path navigation"
                code={`navigate('/home', { direction: 'back' });\nnavigate('/page', { direction: 'forward' });`}
            >
                <div className="demo-btn-group">
                    <button
                        className="demo-btn"
                        onClick={() => navigate('/detail/forward', { direction: 'forward' })}
                    >
                        Forward →
                    </button>
                    <button
                        className="demo-btn"
                        onClick={() => navigate('/detail/back', { direction: 'back' })}
                    >
                        ← Back
                    </button>
                </div>
            </DemoCard>

            <DemoCard
                title="transition"
                description="Enable or disable animation"
                code={`navigate('/page', { transition: false });\nnavigate('/page', { transition: true });`}
            >
                <div className="demo-btn-group">
                    <button
                        className="demo-btn primary"
                        onClick={() => navigate('/detail/with-transition')}
                    >
                        With Transition
                    </button>
                    <button
                        className="demo-btn secondary"
                        onClick={() => navigate('/detail/no-transition', { transition: false })}
                    >
                        No Transition
                    </button>
                </div>
            </DemoCard>

            <DemoCard
                title="replace"
                description="Replace history entry (no transition by default)"
                code={`navigate('/page', { replace: true });\n// transition: false by default`}
            >
                <div className="demo-btn-group">
                    <button
                        className="demo-btn secondary"
                        onClick={() => navigate('/detail/replace', { replace: true })}
                    >
                        Replace (no transition)
                    </button>
                    <button
                        className="demo-btn"
                        onClick={() => navigate('/detail/replace-with', { replace: true, transition: true })}
                    >
                        Replace + Transition
                    </button>
                </div>
            </DemoCard>

            <DemoCard
                title="await"
                description="Wait for transition completion (check console)"
                code={`await navigate('/page');\nconsole.log('Transition complete!');`}
            >
                <button className="demo-btn primary" onClick={handleAwait}>
                    Navigate & Await
                </button>
            </DemoCard>
        </div>
    );
};
